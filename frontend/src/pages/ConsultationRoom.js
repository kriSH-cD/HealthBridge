import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Wifi, WifiOff,
  User, Stethoscope, Shield, Clock, AlertTriangle, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { consultationsApi } from '../services/api';

export const ConsultationRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Consultation state
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, ENDED
  const [callDuration, setCallDuration] = useState(0);

  // Media & Controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);

  // WebRTC references
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const lastSignalTimeRef = useRef(0);
  const pollingTimerRef = useRef(null);
  const durationTimerRef = useRef(null);

  // 1. Fetch consultation room metadata
  useEffect(() => {
    let isMounted = true;
    consultationsApi.get(roomId)
      .then((data) => {
        if (!isMounted) return;
        setConsultation(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.response?.data?.error || 'ਕਮਰੇ ਤੱਕ ਪਹੁੰਚਣ ਵਿੱਚ ਅਸਮਰੱਥ (Could not access consultation room)');
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [roomId]);

  // 2. Initialize WebRTC Media & PeerConnection
  useEffect(() => {
    if (loading || error || !consultation) return;

    let pc = null;
    let localStream = null;

    const setupWebRTC = async () => {
      try {
        // Capture local audio & video
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (mediaErr) {
          console.warn('Camera not available, falling back to audio only:', mediaErr);
          localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setIsVideoMuted(true);
        }

        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Configure RTCPeerConnection
        const iceServers = consultation.ice_servers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];

        pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // Add local media tracks to connection
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Remote media stream handler
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setRemoteStreamActive(true);
            setCallStatus('CONNECTED');
          }
        };

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            consultationsApi.sendSignal(roomId, {
              type: 'candidate',
              candidate: event.candidate,
            }).catch(() => {});
          }
        };

        // Doctor initiates offer
        const isDoctor = user?.role === 'DOCTOR';
        if (isDoctor) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await consultationsApi.sendSignal(roomId, {
            type: 'offer',
            sdp: offer.sdp,
          });
        }

        // Start WebRTC signaling polling loop (every 2.5 seconds)
        pollingTimerRef.current = setInterval(async () => {
          try {
            const signals = await consultationsApi.getSignals(roomId, lastSignalTimeRef.current);
            for (const sig of signals) {
              lastSignalTimeRef.current = Math.max(lastSignalTimeRef.current, sig.created_at || Date.now());

              if (sig.sender_id === user?.id) continue; // Ignore own signals

              if (sig.type === 'offer' && !isDoctor && pc.signalingState !== 'closed') {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sig.sdp }));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await consultationsApi.sendSignal(roomId, {
                  type: 'answer',
                  sdp: answer.sdp,
                });
                setCallStatus('CONNECTED');
              } else if (sig.type === 'answer' && isDoctor && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sig.sdp }));
                setCallStatus('CONNECTED');
              } else if (sig.type === 'candidate' && sig.candidate && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
              }
            }
          } catch (pollErr) {
            console.warn('Signaling poll error:', pollErr);
          }
        }, 2500);

        // Update consultation status to CONNECTED
        consultationsApi.updateStatus(roomId, { status: 'CONNECTED' }).catch(() => {});
      } catch (err) {
        console.error('Failed to setup WebRTC call:', err);
      }
    };

    setupWebRTC();

    // Call duration timer
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [loading, error, consultation, roomId, user?.id, user?.role]);

  // Audio mute toggle
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Video camera toggle
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = isVideoMuted;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Format call duration MM:SS
  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-300 font-medium">ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ... (Connecting to Consultation Room)</p>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">ਕੰਸਲਟੇਸ਼ਨ ਰੂਮ ਨਹੀਂ ਮਿਲਿਆ</h2>
          <p className="text-sm text-slate-400 mb-4">{error || 'Consultation session not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            ਵਾਪਸ ਜਾਓ (Return to Dashboard)
          </button>
        </div>
      </div>
    );
  }

  const isDoctor = user?.role === 'DOCTOR';
  const otherParty = isDoctor ? consultation.patient : consultation.doctor;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* 1. Header with details and status */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            {isDoctor ? <User className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="font-semibold text-sm md:text-base flex items-center space-x-2">
              <span>{otherParty?.full_name || 'Healthcare Professional'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {otherParty?.village ? `ਪਿੰਡ ${otherParty.village}` : otherParty?.specialization || 'Nabha Telehealth'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-2 font-mono">
              <span className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>{roomId}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(callDuration)}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            callStatus === 'CONNECTED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {callStatus === 'CONNECTED' ? '● ਜੁੜਿਆ ਹੋਇਆ (Live)' : 'ਸੰਪਰਕ ਹੋ ਰਿਹਾ ਹੈ...'}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{t('end_call') || 'ਬਾਹਰ ਜਾਓ'}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Video Viewport Stage */}
      <main className="flex-1 relative flex items-center justify-center p-2 sm:p-4 bg-slate-950">
        {/* Remote Video Stream (Main Stage) */}
        <div className="relative w-full h-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center min-h-[420px]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              remoteStreamActive ? 'opacity-100' : 'opacity-0 absolute'
            }`}
          />

          {/* Placeholder while waiting for remote video */}
          {!remoteStreamActive && (
            <div className="text-center p-8 space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center text-slate-400 animate-pulse">
                {isDoctor ? <User className="w-12 h-12" /> : <Stethoscope className="w-12 h-12" />}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">
                  {otherParty?.full_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ਦੂਜੀ ਧਿਰ ਦੇ ਜੁੜਨ ਦੀ ਉਡੀਕ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ (Awaiting peer connection)...
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>WebRTC P2P ਸੁਰੱਖਿਅਤ ਲਿੰਕ ਤਿਆਰ ਹੈ</span>
              </div>
            </div>
          )}

          {/* Picture-in-Picture Local Video Preview */}
          <div className="absolute bottom-4 right-4 w-32 sm:w-48 aspect-video bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${
                isVideoMuted ? 'hidden' : 'block'
              }`}
            />
            {isVideoMuted && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                <span className="text-[10px]">ਕੈਮਰਾ ਬੰਦ ਹੈ</span>
              </div>
            )}
            <div className="absolute bottom-1 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
              ਤੁਸੀਂ (You)
            </div>
          </div>
        </div>
      </main>

      {/* 3. Media Controls Dock */}
      <footer className="bg-slate-900/90 backdrop-blur border-t border-slate-800 px-4 py-3 flex items-center justify-between z-20">
        {/* Left: Jitsi Emergency Fallback */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <a
            href={`https://meet.jit.si/${roomId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-emerald-400 transition-colors bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700"
            title="External Jitsi Fallback"
          >
            <span>Jitsi ਬੈਕਅੱਪ</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Center: Call Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`p-3 rounded-full transition shadow-lg ${
              isAudioMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
            }`}
            title={isAudioMuted ? 'ਮਾਈਕ ਚਾਲੂ ਕਰੋ' : 'ਮਾਈਕ ਬੰਦ ਕਰੋ'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3 rounded-full transition shadow-lg ${
              isVideoMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
            }`}
            title={isVideoMuted ? 'ਕੈਮਰਾ ਚਾਲੂ ਕਰੋ' : 'ਕੈਮਰਾ ਬੰਦ ਕਰੋ'}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-lg flex items-center space-x-2 px-4"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">{t('end_call') || 'ਕਾਲ ਸਮਾਪਤ ਕਰੋ'}</span>
          </button>
        </div>

        {/* Right: Spacer */}
        <div className="w-24 hidden sm:block"></div>
      </footer>
    </div>
  );
};
