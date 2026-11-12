import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Wifi, WifiOff,
  MessageSquare, User, Stethoscope, Star, CheckCircle,
  AlertTriangle, Shield, Clock, Send, FileText, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { consultationsApi } from '../services/api';
import { WritePrescriptionModal } from '../components/WritePrescriptionModal';

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
  const [bandwidthMode, setBandwidthMode] = useState('VIDEO'); // 'VIDEO', 'AUDIO', 'CHAT'
  const [networkQuality, setNetworkQuality] = useState('GOOD'); // 'GOOD' (4G/WiFi), 'POOR' (2G/3G)
  const [networkEffectiveType, setNetworkEffectiveType] = useState('4g');
  const [autoFallbackActive, setAutoFallbackActive] = useState(false);

  // UI Panels
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isWritePrescriptionOpen, setIsWritePrescriptionOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [qualityRating, setQualityRating] = useState(5);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSubmittingEnd, setIsSubmittingEnd] = useState(false);

  // WebRTC references
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const lastSignalTimeRef = useRef(0);
  const pollingTimerRef = useRef(null);
  const durationTimerRef = useRef(null);
  const chatBottomRef = useRef(null);

  // 1. Load consultation details
  useEffect(() => {
    let isMounted = true;
    consultationsApi.get(roomId)
      .then((data) => {
        if (!isMounted) return;
        setConsultation(data);
        if (data.low_bandwidth_fallback) {
          setBandwidthMode(data.consultation_type || 'AUDIO');
          setAutoFallbackActive(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.response?.data?.detail || 'ਕਮਰੇ ਤੱਕ ਪਹੁੰਚਣ ਵਿੱਚ ਅਸਮਰੱਥ (Could not access consultation room)');
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [roomId]);

  // 2. Network speed detection (2G/3G auto-fallback)
  useEffect(() => {
    const checkConnection = () => {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const effType = conn.effectiveType || '4g';
        const downlink = conn.downlink || 5;
        setNetworkEffectiveType(effType);

        // Rural Nabha 2G/slow 3G threshold
        if (effType === '2g' || effType === 'slow-2g' || downlink < 0.4) {
          setNetworkQuality('POOR');
          if (bandwidthMode === 'VIDEO') {
            setBandwidthMode('AUDIO');
            setAutoFallbackActive(true);
            setIsVideoMuted(true);
            // Notify server of rural fallback
            consultationsApi.setFallback(roomId, {
              low_bandwidth_fallback: true,
              consultation_type: 'AUDIO',
              reason: `Auto fallback on ${effType} network (${downlink} Mbps)`,
            }).catch(() => {});
          }
        } else {
          setNetworkQuality('GOOD');
        }
      }
    };

    checkConnection();
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.addEventListener) {
      conn.addEventListener('change', checkConnection);
      return () => conn.removeEventListener('change', checkConnection);
    }
  }, [roomId, bandwidthMode]);

  // 3. Initialize WebRTC media & PeerConnection
  useEffect(() => {
    if (loading || error) return;

    let pc = null;
    let localStream = null;

    const setupWebRTC = async () => {
      try {
        // Try getting user media
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: bandwidthMode === 'VIDEO',
        }).catch(() => {
          // Fallback to audio-only if camera fails
          return navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        });

        localStreamRef.current = localStream;
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }

        // Setup RTCPeerConnection with STUN
        const iceServers = consultation?.ice_servers || [{ urls: 'stun:stun.l.google.com:19302' }];
        pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        }

        // Remote track handler
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setCallStatus('CONNECTED');
        };

        // ICE Candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            consultationsApi.sendSignal(roomId, {
              type: 'candidate',
              data: event.candidate,
            }).catch(() => {});
          }
        };

        // Mark as connected in backend
        consultationsApi.updateStatus(roomId, { status: 'CONNECTED' })
          .then(() => setCallStatus('CONNECTED'))
          .catch(() => setCallStatus('CONNECTED'));

        // If user is doctor, create and send SDP offer
        if (user?.role === 'DOCTOR') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await consultationsApi.sendSignal(roomId, {
            type: 'offer',
            data: offer,
          });
        }
      } catch (err) {
        console.warn('WebRTC initialization error, running in simulated mode:', err);
        setCallStatus('CONNECTED');
      }
    };

    setupWebRTC();

    // 4. Polling loop for WebRTC signals & in-call chat
    pollingTimerRef.current = setInterval(async () => {
      try {
        // Fetch new signals
        const signals = await consultationsApi.getSignals(roomId, lastSignalTimeRef.current);
        if (signals && signals.length > 0) {
          for (const sig of signals) {
            if (sig.timestamp > lastSignalTimeRef.current) {
              lastSignalTimeRef.current = sig.timestamp;
            }

            if (pc) {
              if (sig.type === 'offer' && user?.role === 'PATIENT') {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await consultationsApi.sendSignal(roomId, { type: 'answer', data: answer });
              } else if (sig.type === 'answer' && user?.role === 'DOCTOR') {
                if (pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
                }
              } else if (sig.type === 'candidate' && sig.data) {
                await pc.addIceCandidate(new RTCIceCandidate(sig.data)).catch(() => {});
              } else if (sig.type === 'fallback_change') {
                if (sig.data?.consultation_type) {
                  setBandwidthMode(sig.data.consultation_type);
                  setAutoFallbackActive(true);
                }
              }
            }
          }
        }

        // Fetch in-call chat messages
        const chats = await consultationsApi.getChat(roomId);
        if (chats) {
          setChatMessages(chats);
        }
      } catch {
        // Quietly retry on next interval
      }
    }, 1800);

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
  }, [loading, error, roomId, user?.role, consultation?.ice_servers]);

  // Handle Bandwidth Mode Switch
  const switchBandwidthMode = async (mode) => {
    setBandwidthMode(mode);
    const isAudioOnly = mode === 'AUDIO';
    const isChatOnly = mode === 'CHAT';

    // Disable video track locally
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = mode === 'VIDEO';
      });
    }

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isChatOnly && !isAudioMuted;
      });
    }

    setIsVideoMuted(isAudioOnly || isChatOnly);

    // Notify peer via server
    await consultationsApi.setFallback(roomId, {
      low_bandwidth_fallback: isAudioOnly || isChatOnly,
      consultation_type: mode,
      reason: `Manual switch to ${mode} mode`,
    }).catch(() => {});
  };

  // Toggle Mic
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isAudioMuted;
      });
    }
    setIsAudioMuted(!isAudioMuted);
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (bandwidthMode !== 'VIDEO') {
      switchBandwidthMode('VIDEO');
      return;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoMuted;
      });
    }
    setIsVideoMuted(!isVideoMuted);
  };

  // Send In-Call Chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    try {
      const sent = await consultationsApi.sendChat(roomId, { message: newChatMessage.trim() });
      setChatMessages((prev) => [...prev, sent]);
      setNewChatMessage('');
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // Failed to send
    }
  };

  // Complete consultation
  const handleEndConsultation = async () => {
    setIsSubmittingEnd(true);
    try {
      await consultationsApi.updateStatus(roomId, {
        status: 'COMPLETED',
        quality_rating: qualityRating,
        doctor_notes: doctorNotes.trim() || undefined,
      });
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-white min-h-[80vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-300">ਸੁਰੱਖਿਅਤ ਵੀਡੀਓ ਰੂਮ ਨਾਲ ਜੁੜਿਆ ਜਾ ਰਿਹਾ ਹੈ...</p>
          <p className="text-xs text-slate-500">Connecting to Nabha Rural Teleconsultation Room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-6 text-center shadow-sm space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">ਕੰਸਲਟੇਸ਼ਨ ਰੂਮ ਖੁੱਲ੍ਹ ਨਹੀਂ ਸਕਿਆ</h2>
          <p className="text-xs text-slate-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-slate-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition"
          >
            ਡੈਸ਼ਬੋਰਡ 'ਤੇ ਵਾਪਸ ਜਾਓ (Back to Dashboard)
          </button>
        </div>
      </div>
    );
  }

  const otherPerson = user?.role === 'DOCTOR' ? consultation.patient : consultation.doctor;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white min-h-[90vh]">
      {/* 1. Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            {user?.role === 'DOCTOR' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-100">{otherPerson?.full_name}</h2>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                {otherPerson?.village || 'Nabha'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {user?.role === 'DOCTOR'
                ? `ਉਮਰ: ${otherPerson?.age || 'N/A'} • ਲਿੰਗ: ${otherPerson?.gender || 'N/A'} • ABHA: ${otherPerson?.abha_id || 'Pending'}`
                : `${otherPerson?.specialization || 'General Physician'} • ${otherPerson?.hospital_name || 'Civil Hospital'}`}
            </p>
          </div>
        </div>

        {/* Center: Call Timer & Network Indicator */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="inline-flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-bold">{formatDuration(callDuration)}</span>
          </div>

          <div
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
              networkQuality === 'GOOD'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                : 'bg-amber-950/60 text-amber-400 border-amber-800/50'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{networkQuality === 'GOOD' ? `4G/WiFi (${networkEffectiveType})` : `2G/3G (${networkEffectiveType})`}</span>
          </div>
        </div>

        {/* Right: Bandwidth Mode Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => switchBandwidthMode('VIDEO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              bandwidthMode === 'VIDEO' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            ਵੀਡੀਓ (Video)
          </button>
          <button
            type="button"
            onClick={() => switchBandwidthMode('AUDIO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              bandwidthMode === 'AUDIO' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>2G/3G ਆਡੀਓ</span>
          </button>
          <button
            type="button"
            onClick={() => switchBandwidthMode('CHAT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              bandwidthMode === 'CHAT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            ਸਿਰਫ਼ ਚੈਟ
          </button>
        </div>
      </header>

      {/* 2. Rural Low-Bandwidth Alert Banner */}
      {autoFallbackActive && bandwidthMode !== 'VIDEO' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>ਪੇਂਡੂ ਨੈੱਟਵਰਕ ਮੋਡ ਸਰਗਰਮ (Low Bandwidth 2G/3G):</strong> ਵੀਡੀਓ ਬੰਦ ਕੀਤੀ ਗਈ ਹੈ ਤਾਂ ਜੋ ਗੱਲਬਾਤ ਨਿਰਵਿਘਨ ਰਹੇ।
            </span>
          </div>
          <button
            onClick={() => switchBandwidthMode('VIDEO')}
            className="text-xs underline text-amber-200 hover:text-white ml-2 shrink-0"
          >
            ਵੀਡੀਓ ਮੁੜ ਚਾਲੂ ਕਰੋ (Force Video)
          </button>
        </div>
      )}

      {/* 3. Main Stage & Video Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-950 relative">
          {/* Main Remote View */}
          {bandwidthMode === 'VIDEO' ? (
            <div className="w-full h-full max-w-4xl max-h-[70vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-700 text-xs flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">{otherPerson?.full_name}</span>
              </div>
            </div>
          ) : (
            /* Audio / Low-Bandwidth Mode Avatar Stage */
            <div className="w-full max-w-lg bg-slate-900/60 rounded-3xl border border-slate-800/80 p-8 text-center space-y-5 shadow-2xl">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-xl">
                  {user?.role === 'DOCTOR' ? <User className="w-12 h-12" /> : <Stethoscope className="w-12 h-12" />}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">{otherPerson?.full_name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {bandwidthMode === 'AUDIO' ? 'ਆਡੀਓ ਕਾਲ ਚਾਲੂ ਹੈ (Low Bandwidth Voice Mode)' : 'ਚੈਟ ਮੋਡ ਸਰਗਰਮ (Chat Mode)'}
                </p>
                <div className="inline-flex items-center space-x-1.5 mt-3 text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-3 py-1 rounded-full">
                  <Shield className="w-3.5 h-3.5" />
                  <span>95% ਡਾਟਾ ਬੱਚਤ (Nabha Rural 2G Optimized)</span>
                </div>
              </div>
            </div>
          )}

          {/* Local Picture-in-Picture Video */}
          <div className="absolute bottom-6 right-6 w-36 sm:w-48 aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
            {bandwidthMode === 'VIDEO' && !isVideoMuted ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
                <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                <span>ਕੈਮਰਾ ਬੰਦ (Camera Off)</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-slate-900/80 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
              ਤੁਸੀਂ ({user?.role === 'DOCTOR' ? 'Doctor' : 'Patient'})
            </div>
          </div>
        </div>

        {/* 4. Sliding In-Call Chat Drawer */}
        {isChatOpen && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>ਲਾਈਵ ਚੈਟ (In-Call Chat)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  ਕੋਈ ਸੁਨੇਹਾ ਨਹੀਂ (No messages yet)
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-500 mb-0.5">{msg.sender_name}</span>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Punjabi Clinical Helpers */}
            <div className="p-2 border-t border-slate-800 bg-slate-950/40 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setNewChatMessage('ਦਵਾਈ ਸਮੇਂ ਸਿਰ ਲੈ ਰਹੇ ਹੋ?')}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                ਦਵਾਈ ਸਮੇਂ ਸਿਰ?
              </button>
              <button
                type="button"
                onClick={() => setNewChatMessage('ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਜਾਂ ਸ਼ੂਗਰ ਦੱਸੋ')}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                ਬੀਪੀ / ਸ਼ੂਗਰ?
              </button>
              <button
                type="button"
                onClick={() => setNewChatMessage('ਆਵਾਜ਼ ਸਾਫ਼ ਸੁਣ ਰਹੀ ਹੈ')}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                ਆਵਾਜ਼ ਸਾਫ਼ ਹੈ
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-2.5 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="ਸੁਨੇਹਾ ਲਿਖੋ (Type a message)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded-lg text-white transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* 5. In-Call Controls Dock */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="font-mono text-[11px] bg-slate-800 px-2 py-1 rounded border border-slate-700">
            {roomId}
          </span>
          <a
            href={`https://meet.jit.si/${roomId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center space-x-1 text-slate-400 hover:text-emerald-400 transition"
            title="Open Jitsi Fallback"
          >
            <span>Jitsi Backup</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Center Call Buttons */}
        <div className="flex items-center space-x-3">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`p-3 rounded-full transition shadow-lg ${
              isAudioMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3 rounded-full transition shadow-lg ${
              isVideoMuted || bandwidthMode !== 'VIDEO'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoMuted ? 'Start Video' : 'Stop Video'}
          >
            {isVideoMuted || bandwidthMode !== 'VIDEO' ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </button>

          {/* Toggle Chat */}
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3 rounded-full transition shadow-lg ${
              isChatOpen ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Toggle Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Doctor Only: Write Prescription Shortcut */}
          {user?.role === 'DOCTOR' && (
            <button
              type="button"
              onClick={() => setIsWritePrescriptionOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-lg"
            >
              <FileText className="w-4 h-4" />
              <span>ਪਰਚੀ ਲਿਖੋ (Rx)</span>
            </button>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => setIsEndModalOpen(true)}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-lg flex items-center space-x-2 px-4"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">ਕਾਲ ਸਮਾਪਤ ਕਰੋ</span>
          </button>
        </div>

        <div className="w-24 hidden sm:block"></div>
      </footer>

      {/* 6. Doctor Write Prescription Modal directly inside Call */}
      {isWritePrescriptionOpen && (
        <WritePrescriptionModal
          appointment={{
            id: consultation.appointment_id,
            patient_id: consultation.patient_id,
            patient_name: consultation.patient?.full_name,
            patient_age: consultation.patient?.age,
            patient_gender: consultation.patient?.gender,
          }}
          onClose={() => setIsWritePrescriptionOpen(false)}
          onCreated={(rx) => {
            setIsWritePrescriptionOpen(false);
            // Send prescription notification in call chat
            consultationsApi.sendChat(roomId, {
              message: `✅ ਡਿਜੀਟਲ ਪਰਚੀ ਜਾਰੀ ਹੋ ਗਈ ਹੈ: #${rx.prescription_number || 'RX-NBH'}`,
            }).catch(() => {});
          }}
        />
      )}

      {/* 7. End Call & Quality Rating Modal */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>ਕੰਸਲਟੇਸ਼ਨ ਸਮਾਪਤ ਕਰੋ (End Consultation)</span>
            </h3>

            <p className="text-xs text-slate-400">
              ਕਿਰਪਾ ਕਰਕੇ ਕਾਲ ਦੀ ਗੁਣਵੱਤਾ ਅਤੇ ਪੇਂਡੂ ਨੈੱਟਵਰਕ ਰੇਟਿੰਗ ਦਿਓ ਤਾਂ ਜੋ ਸਿਹਤ ਸੇਤੂ ਪ੍ਰਣਾਲੀ ਹੋਰ ਬਿਹਤਰ ਬਣ ਸਕੇ।
            </p>

            {/* 1-5 Star Rating */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ਕਾਲ ਗੁਣਵੱਤਾ (Rating):</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setQualityRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${star <= qualityRating ? 'fill-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor Clinical Notes */}
            {user?.role === 'DOCTOR' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  ਡਾਕਟਰ ਦੇ ਨੋਟਸ (Clinical Notes):
                </label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="ਮਰੀਜ਼ ਦੇ ਲੱਛਣ, ਸਲਾਹ ਜਾਂ ਅਗਲੀ ਜਾਂਚ ਸੰਬੰਧੀ ਨੋਟਸ..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
              >
                ਰੱਦ ਕਰੋ (Cancel)
              </button>
              <button
                type="button"
                disabled={isSubmittingEnd}
                onClick={handleEndConsultation}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
              >
                {isSubmittingEnd ? 'ਸਮਾਪਤ ਹੋ ਰਿਹਾ ਹੈ...' : 'ਜਮ੍ਹਾਂ ਕਰੋ ਅਤੇ ਬਾਹਰ ਜਾਓ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
