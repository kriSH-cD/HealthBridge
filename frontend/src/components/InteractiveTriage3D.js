import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  Wind, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Eye, 
  Truck, 
  User, 
  CheckCircle2, 
  ChevronRight,
  Flame,
  Radio,
  Sparkles
} from 'lucide-react';

// Clinical & Telemetry Hotspot Data
export const ANATOMY_HOTSPOTS = [
  {
    id: 'brain',
    name: 'Brain / Cranium (ਮਾਸਤਕ)',
    category: 'Neurological',
    position: [0, 2.18, 0],
    color: 0xa855f7,
    emissive: 0x6b21a8,
    severity: 'CRITICAL',
    vitals: { hr: 112, spo2: 91, bp: '165/105', resp: 24 },
    diagnosis: 'Acute cerebrovascular trauma / Suspected stroke',
    symptoms: 'Sudden unilateral numbness, altered sensorium, severe headache',
    protocol: 'Immediate ALS Ambulance with rapid neuro-triage and tele-neurology consult',
    recommendedVehicle: 'ALS Unit (Advanced Life Support)'
  },
  {
    id: 'heart',
    name: 'Heart / Myocardium (ਦਿਲ)',
    category: 'Cardiovascular',
    position: [-0.14, 1.36, 0.16],
    color: 0xef4444,
    emissive: 0xb91c1c,
    severity: 'CRITICAL',
    vitals: { hr: 138, spo2: 88, bp: '85/55', resp: 28 },
    diagnosis: 'Acute Myocardial Infarction / Ventricular Arrhythmia',
    symptoms: 'Crushing retrosternal chest pain radiating to left jaw, diaphoresis, dyspnea',
    protocol: 'ALS Ambulance equipped with 12-lead ECG monitor, AED, and IV thrombolytics',
    recommendedVehicle: 'ALS Unit with Biphasic Defibrillator'
  },
  {
    id: 'lungs',
    name: 'Lungs / Pulmonary System (ਫੇਫੜੇ)',
    category: 'Respiratory',
    position: [0.22, 1.36, 0.08],
    color: 0x06b6d4,
    emissive: 0x0e7490,
    severity: 'URGENT',
    vitals: { hr: 104, spo2: 90, bp: '130/85', resp: 32 },
    diagnosis: 'Acute Respiratory Distress / Severe Bronchospasm',
    symptoms: 'Audible stridor, wheezing, tachypnea, cyanosis of extremities',
    protocol: 'High-flow oxygen administration via non-rebreather mask; transport ventilator on standby',
    recommendedVehicle: 'ALS Unit with Transport Ventilator'
  },
  {
    id: 'abdomen',
    name: 'Abdomen / Visceral Core (ਪੇਟ)',
    category: 'Gastrointestinal & Trauma',
    position: [0, 0.85, 0.12],
    color: 0xf59e0b,
    emissive: 0xb45309,
    severity: 'URGENT',
    vitals: { hr: 96, spo2: 96, bp: '115/75', resp: 20 },
    diagnosis: 'Acute Abdominal Trauma / Suspected Internal Hemorrhage',
    symptoms: 'Rigidity, rebound tenderness, peritonitis signs following blunt injury',
    protocol: 'Rapid surgical triage at Nabha Civil Hospital; avoid oral intake; IV crystalloids',
    recommendedVehicle: 'BLS or ALS Unit depending on hemodynamic stability'
  },
  {
    id: 'limbs',
    name: 'Musculoskeletal / Limbs (ਹੱਡੀਆਂ ਤੇ ਜੋੜ)',
    category: 'Orthopedic Trauma',
    position: [0.65, 0.7, 0],
    color: 0x10b981,
    emissive: 0x047857,
    severity: 'NORMAL',
    vitals: { hr: 78, spo2: 98, bp: '120/80', resp: 16 },
    diagnosis: 'Closed Fracture / Ligamentous Strain',
    symptoms: 'Localized edema, erythema, deformity without neurovascular deficit',
    protocol: 'Splinting, immobilization, analgesia, routine transit to orthopedic clinic',
    recommendedVehicle: 'BLS Unit (Basic Life Support)'
  }
];

export const AMBULANCE_HOTSPOTS = [
  {
    id: 'ventilator',
    name: 'Transport Ventilator (ਵੈਂਟੀਲੇਟਰ)',
    category: 'ALS Equipment',
    position: [0, 0.6, 0.5],
    color: 0x06b6d4,
    emissive: 0x0891b2,
    severity: 'CRITICAL',
    details: 'Digital multi-mode invasive & non-invasive ventilator with PEEP control and turbine drive.',
    status: 'Operational • Ready for Dispatch'
  },
  {
    id: 'defibrillator',
    name: 'Biphasic Defibrillator & ECG (ਡੀਫਿਬ੍ਰਿਲੇਟਰ)',
    category: 'ALS Equipment',
    position: [-0.4, 0.5, 0],
    color: 0xef4444,
    emissive: 0xdc2626,
    severity: 'CRITICAL',
    details: 'Automated External Defibrillator (AED) + manual pacing with real-time 12-lead telemetry.',
    status: 'Operational • Battery 98%'
  },
  {
    id: 'oxygen',
    name: 'Medical Oxygen Cylinders (ਆਕਸੀਜਨ ਸਿਲੰਡਰ)',
    category: 'Respiratory Support',
    position: [0.4, 0.4, -0.6],
    color: 0x10b981,
    emissive: 0x059669,
    severity: 'URGENT',
    details: 'Dual 10L cylinders at 150 bar with dual pressure regulators and flowmeters.',
    status: 'Full (150 Bar)'
  },
  {
    id: 'stretcher',
    name: 'Hydraulic Auto-Loading Stretcher (ਸਟ੍ਰੈਚਰ)',
    category: 'Patient Transit',
    position: [0, -0.1, 0],
    color: 0x3b82f6,
    emissive: 0x1d4ed8,
    severity: 'NORMAL',
    details: 'Shock-absorbing collapsible spine-board certified for rural unpaved road transit.',
    status: 'Sanitized • Locked in Cradle'
  },
  {
    id: 'telematics',
    name: 'GPS Telematics & 108 Dispatch Transponder (ਜੀ.ਪੀ.ਐੱਸ)',
    category: 'Fleet Navigation',
    position: [0, 0.95, -1.2],
    color: 0x8b5cf6,
    emissive: 0x6d28d9,
    severity: 'NORMAL',
    details: 'Real-time 4G/2G dual-SIM cellular modem streaming live Nabha coordinates to Civil Hospital.',
    status: 'Connected • 12ms Latency'
  }
];

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && typeof gl.getParameter === 'function');
  } catch (e) {
    return false;
  }
}

// Synthesize medical telemetry monitor beep sound via Web Audio API
function playTelemetryBeep(severity = 'NORMAL') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = severity === 'CRITICAL' ? 880 : severity === 'URGENT' ? 660 : 520;
    osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (err) {
    // Audio context may be blocked before user gesture
  }
}

export const InteractiveTriage3D = ({
  onSelectHotspot,
  onDispatchTrigger,
  initialMode = 'anatomy'
}) => {
  const mountRef = useRef(null);
  const [mode, setMode] = useState(initialMode); // 'anatomy' | 'ambulance'
  const [selectedHotspot, setSelectedHotspot] = useState(ANATOMY_HOTSPOTS[1]); // Default Heart
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [isWireframe, setIsWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasWebGL, setHasWebGL] = useState(() => checkWebGLSupport());

  // References to Three.js active objects
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const clickableMeshesRef = useRef([]);
  const pulseLightRef = useRef(null);
  const heartMeshRef = useRef(null);
  const lungsMeshRef = useRef(null);
  const sirenLightRedRef = useRef(null);
  const sirenLightBlueRef = useRef(null);

  // Helper to handle selection
  const handleSelect = useCallback((hotspot) => {
    setSelectedHotspot(hotspot);
    if (soundEnabled) {
      playTelemetryBeep(hotspot.severity);
    }
    if (onSelectHotspot) {
      onSelectHotspot(hotspot);
    }
  }, [soundEnabled, onSelectHotspot]);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!hasWebGL || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.08);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 4.8);
    cameraRef.current = camera;

    // 3. Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (err) {
      setHasWebGL(false);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 8.5;
    controls.minDistance = 1.2;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // 5. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(4, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x818cf8, 1.0);
    backLight.position.set(-4, 3, -4);
    scene.add(backLight);

    // Dynamic Emergency / Cardiac Pulse PointLight
    const pulseLight = new THREE.PointLight(0xef4444, 2.5, 6);
    pulseLight.position.set(0, 1.5, 1.2);
    scene.add(pulseLight);
    pulseLightRef.current = pulseLight;

    // Dual Flashing Ambulance Siren Lights
    const sirenRed = new THREE.PointLight(0xef4444, 0, 5);
    sirenRed.position.set(-0.35, 2.1, 0.4);
    scene.add(sirenRed);
    sirenLightRedRef.current = sirenRed;

    const sirenBlue = new THREE.PointLight(0x3b82f6, 0, 5);
    sirenBlue.position.set(0.35, 2.1, 0.4);
    scene.add(sirenBlue);
    sirenLightBlueRef.current = sirenBlue;

    // 6. Medical Scanner Floor Grid
    const grid = new THREE.GridHelper(10, 24, 0x0284c7, 0x1e293b);
    grid.position.y = -0.2;
    scene.add(grid);

    // Concentric scan circles
    const ringGeo = new THREE.RingGeometry(1.4, 1.48, 64);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x38bdf8, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.4 
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = -0.19;
    scene.add(ringMesh);

    // 7. Build Procedural Scene Models based on Active Mode
    clickableMeshesRef.current = [];

    if (mode === 'anatomy') {
      // --- PATIENT ANATOMICAL HIERARCHY ---
      const patientGroup = new THREE.Group();
      patientGroup.name = 'PatientRoot';

      // Torso / Outer Hologram Shell
      const torsoGeo = new THREE.CylinderGeometry(0.42, 0.32, 1.0, 32);
      const torsoMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: isWireframe ? 0.9 : 0.28,
        wireframe: isWireframe,
        roughness: 0.15,
        metalness: 0.4,
        clearcoat: 0.8
      });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.y = 1.15;
      patientGroup.add(torsoMesh);

      // Head / Cranium
      const headGeo = new THREE.SphereGeometry(0.32, 32, 32);
      const headMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: isWireframe ? 0.9 : 0.35,
        wireframe: isWireframe,
        roughness: 0.2,
        metalness: 0.3
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 2.18;
      patientGroup.add(headMesh);

      // Limbs (Arms & Legs)
      const limbMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        transparent: true,
        opacity: 0.3,
        wireframe: isWireframe
      });

      // Left & Right Arms
      const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.9, 16);
      const leftArm = new THREE.Mesh(armGeo, limbMat);
      leftArm.position.set(-0.58, 1.05, 0);
      leftArm.rotation.z = 0.15;
      patientGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, limbMat);
      rightArm.position.set(0.58, 1.05, 0);
      rightArm.rotation.z = -0.15;
      patientGroup.add(rightArm);

      // Left & Right Legs
      const legGeo = new THREE.CylinderGeometry(0.12, 0.09, 1.1, 16);
      const leftLeg = new THREE.Mesh(legGeo, limbMat);
      leftLeg.position.set(-0.2, 0.2, 0);
      patientGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, limbMat);
      rightLeg.position.set(0.2, 0.2, 0);
      patientGroup.add(rightLeg);

      // --- INTERACTIVE ANATOMICAL ORGANS ---
      ANATOMY_HOTSPOTS.forEach((spot) => {
        let organMesh;
        const mat = new THREE.MeshStandardMaterial({
          color: spot.color,
          emissive: spot.emissive,
          emissiveIntensity: 0.6,
          roughness: 0.25,
          metalness: 0.6
        });

        if (spot.id === 'brain') {
          const geo = new THREE.IcosahedronGeometry(0.2, 2);
          organMesh = new THREE.Mesh(geo, mat);
        } else if (spot.id === 'heart') {
          const geo = new THREE.DodecahedronGeometry(0.16, 1);
          organMesh = new THREE.Mesh(geo, mat);
          heartMeshRef.current = organMesh;
        } else if (spot.id === 'lungs') {
          const geo = new THREE.CapsuleGeometry(0.12, 0.24, 8, 16);
          organMesh = new THREE.Mesh(geo, mat);
          lungsMeshRef.current = organMesh;
        } else if (spot.id === 'abdomen') {
          const geo = new THREE.CylinderGeometry(0.24, 0.22, 0.32, 16);
          organMesh = new THREE.Mesh(geo, mat);
        } else {
          const geo = new THREE.SphereGeometry(0.14, 16, 16);
          organMesh = new THREE.Mesh(geo, mat);
        }

        organMesh.position.set(...spot.position);
        organMesh.userData = { hotspot: spot };

        // Pulsing Marker Ring around Hotspot
        const markerGeo = new THREE.TorusGeometry(0.22, 0.015, 16, 32);
        const markerMat = new THREE.MeshBasicMaterial({ 
          color: spot.color, 
          transparent: true, 
          opacity: 0.85 
        });
        const markerMesh = new THREE.Mesh(markerGeo, markerMat);
        markerMesh.rotation.x = Math.PI / 2;
        organMesh.add(markerMesh);

        patientGroup.add(organMesh);
        clickableMeshesRef.current.push(organMesh);
      });

      scene.add(patientGroup);
    } else {
      // --- 108 AMBULANCE UNIT HIERARCHY ---
      const ambGroup = new THREE.Group();
      ambGroup.name = 'AmbulanceRoot';

      // Chassis / Cabin Body
      const bodyGeo = new THREE.BoxGeometry(1.6, 1.4, 3.8);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.3,
        metalness: 0.2,
        wireframe: isWireframe
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.85;
      ambGroup.add(bodyMesh);

      // Red/Yellow 108 Rural EMS Livery Stripe
      const stripeGeo = new THREE.BoxGeometry(1.62, 0.22, 3.82);
      const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.4
      });
      const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
      stripeMesh.position.y = 0.82;
      ambGroup.add(stripeMesh);

      // Tinted Glass Windshield
      const glassGeo = new THREE.BoxGeometry(1.4, 0.65, 0.9);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
        metalness: 0.8
      });
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(0, 1.15, 1.4);
      ambGroup.add(glassMesh);

      // Rooftop Siren Bar
      const sirenBarGeo = new THREE.BoxGeometry(1.0, 0.15, 0.28);
      const sirenBarMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const sirenBar = new THREE.Mesh(sirenBarGeo, sirenBarMat);
      sirenBar.position.set(0, 1.62, 0.4);
      ambGroup.add(sirenBar);

      // Siren Dome Left (Red) & Right (Blue)
      const domeGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.16, 16);
      const domeRed = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      domeRed.position.set(-0.35, 1.74, 0.4);
      ambGroup.add(domeRed);

      const domeBlue = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      domeBlue.position.set(0.35, 1.74, 0.4);
      ambGroup.add(domeBlue);

      // 4 Heavy-Duty Transit Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 24);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const wheelPositions = [
        [-0.88, 0.2, 1.1],
        [0.88, 0.2, 1.1],
        [-0.88, 0.2, -1.1],
        [0.88, 0.2, -1.1]
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, y, z);
        ambGroup.add(wheel);
      });

      // --- INTERACTIVE AMBULANCE EQUIPMENT HOTSPOTS ---
      AMBULANCE_HOTSPOTS.forEach((spot) => {
        const mat = new THREE.MeshStandardMaterial({
          color: spot.color,
          emissive: spot.emissive,
          emissiveIntensity: 0.7,
          roughness: 0.3,
          metalness: 0.5
        });
        const geo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
        const equipMesh = new THREE.Mesh(geo, mat);
        equipMesh.position.set(...spot.position);
        equipMesh.userData = { hotspot: spot };

        const markerRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.02, 16, 32),
          new THREE.MeshBasicMaterial({ color: spot.color, transparent: true, opacity: 0.9 })
        );
        markerRing.rotation.x = Math.PI / 2;
        equipMesh.add(markerRing);

        ambGroup.add(equipMesh);
        clickableMeshesRef.current.push(equipMesh);
      });

      scene.add(ambGroup);
    }

    // 8. Raycasting and Mouse Event Handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableMeshesRef.current, false);

      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
        const hit = intersects[0].object.userData.hotspot;
        setHoveredHotspot(hit);
      } else {
        container.style.cursor = 'default';
        setHoveredHotspot(null);
      }
    };

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableMeshesRef.current, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData.hotspot;
        handleSelect(hit);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 9. Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clockRef.current.getElapsedTime();

      // Controls update
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.2;
      controls.update();

      // Biological / Mechanical Animations
      if (heartMeshRef.current) {
        const pulse = 1 + 0.14 * Math.sin(elapsedTime * 8);
        heartMeshRef.current.scale.set(pulse, pulse, pulse);
      }

      if (lungsMeshRef.current) {
        const breath = 1 + 0.08 * Math.sin(elapsedTime * 2.5);
        lungsMeshRef.current.scale.set(breath, breath, breath);
      }

      // Dynamic Emergency Beacon Flashing
      if (mode === 'ambulance') {
        const isRed = Math.sin(elapsedTime * 14) > 0;
        if (sirenLightRedRef.current) sirenLightRedRef.current.intensity = isRed ? 4 : 0.2;
        if (sirenLightBlueRef.current) sirenLightBlueRef.current.intensity = isRed ? 0.2 : 4;
      } else if (pulseLightRef.current) {
        const pulse = 1.8 + 1.2 * Math.sin(elapsedTime * 5);
        pulseLightRef.current.intensity = pulse;
      }

      // Floor Scan Ring Rotation
      ringMesh.rotation.z += 0.008;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointermove', handlePointerMove);
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [mode, isWireframe, autoRotate, hasWebGL, handleSelect]);

  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 1.6, 4.8);
      controlsRef.current.target.set(0, 1.2, 0);
      controlsRef.current.update();
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-700/80 animate-pulse';
      case 'URGENT':
        return 'bg-amber-950 text-amber-300 border-amber-700/80';
      case 'NORMAL':
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-700/80';
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col lg:flex-row text-white min-h-[580px]">
      
      {/* 3D Canvas Viewport */}
      <div className="relative flex-1 min-h-[420px] lg:min-h-[580px]">
        {hasWebGL ? (
          <div ref={mountRef} className="w-full h-full" data-testid="three-canvas-container" />
        ) : (
          /* Accessible 2D Fallback for JSDOM / Environments without WebGL */
          <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-slate-900" data-testid="fallback-schematic">
            <ShieldAlert className="w-12 h-12 text-sky-400 mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100">Interactive Medical Schematic (2D Mode)</h3>
            <p className="text-xs text-slate-400 max-w-md text-center mt-1 mb-6">
              WebGL hardware acceleration is unavailable in this test runner. Interactive nodes remain fully selectable below:
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {(mode === 'anatomy' ? ANATOMY_HOTSPOTS : AMBULANCE_HOTSPOTS).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    selectedHotspot?.id === item.id 
                      ? 'bg-sky-950 border-sky-400 text-sky-200' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top Control Overlay */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center space-x-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
            <button
              onClick={() => {
                setMode('anatomy');
                setSelectedHotspot(ANATOMY_HOTSPOTS[1]);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === 'anatomy' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>ਮਰੀਜ਼ ਟ੍ਰਾਈਏਜ (Patient Anatomy)</span>
            </button>
            <button
              onClick={() => {
                setMode('ambulance');
                setSelectedHotspot(AMBULANCE_HOTSPOTS[0]);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === 'ambulance' 
                  ? 'bg-amber-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>108 ALS ਐਂਬੂਲੈਂਸ (Fleet Unit)</span>
            </button>
          </div>

          {/* Quick Camera & View Controls */}
          <div className="flex items-center space-x-1.5 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
            <button
              onClick={resetCamera}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Reset Camera Framing"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg transition ${
                autoRotate ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Auto-Rotation"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsWireframe(!isWireframe)}
              className={`p-1.5 rounded-lg transition ${
                isWireframe ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Holographic Wireframe"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg transition ${
                soundEnabled ? 'text-amber-400 bg-amber-950/60' : 'text-slate-500 hover:text-white'
              }`}
              title="Toggle Telemetry Audio Synthesizer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredHotspot && (
          <div className="absolute bottom-4 left-4 pointer-events-none bg-slate-900/90 backdrop-blur border border-sky-500/50 px-3 py-1.5 rounded-lg shadow-xl text-xs text-sky-200 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <span className="font-semibold">{hoveredHotspot.name}</span>
            <span className="text-[10px] text-slate-400">• Click to Triage</span>
          </div>
        )}

        {/* 3D Navigation Hint */}
        <div className="absolute bottom-4 right-4 pointer-events-none text-[11px] text-slate-500 bg-slate-950/70 px-2.5 py-1 rounded-md border border-slate-800">
          Left Drag: Rotate • Scroll: Zoom • Right Drag: Pan
        </div>
      </div>

      {/* Clinical Telemetry & Triage Action Sidebar */}
      <div className="w-full lg:w-96 p-6 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between backdrop-blur-md">
        
        {/* Top Header & Selected Hotspot Summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-wider uppercase font-bold text-sky-400 flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>ISD 3D Telemetry Feed</span>
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getSeverityBadgeClass(selectedHotspot?.severity)}`}>
              {selectedHotspot?.severity || 'NORMAL'}
            </span>
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight mb-1">
            {selectedHotspot?.name}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Category: <span className="text-slate-300 font-medium">{selectedHotspot?.category}</span>
          </p>

          {/* Real-time Simulated Vitals Grid (Anatomy Mode) */}
          {mode === 'anatomy' && selectedHotspot?.vitals && (
            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                <span className="text-base font-extrabold text-red-400 flex items-center space-x-1">
                  <Heart className="w-3.5 h-3.5 animate-pulse inline mr-1" />
                  {selectedHotspot.vitals.hr} <span className="text-[10px] font-normal text-slate-400">BPM</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                <span className="text-base font-extrabold text-amber-400">
                  {selectedHotspot.vitals.bp} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Oxygen (SpO2)</span>
                <span className="text-base font-extrabold text-sky-400">
                  {selectedHotspot.vitals.spo2}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Respiration</span>
                <span className="text-base font-extrabold text-emerald-400 flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5 inline mr-1" />
                  {selectedHotspot.vitals.resp} <span className="text-[10px] font-normal text-slate-400">/min</span>
                </span>
              </div>
            </div>
          )}

          {/* Clinical Findings & Symptoms */}
          <div className="space-y-2.5 text-xs">
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-0.5">Clinical Presentation:</span>
              <p className="text-slate-400 leading-relaxed">
                {selectedHotspot?.diagnosis || selectedHotspot?.details}
              </p>
            </div>

            {selectedHotspot?.symptoms && (
              <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-0.5">Reported Symptoms:</span>
                <p className="text-slate-400 leading-relaxed">
                  {selectedHotspot.symptoms}
                </p>
              </div>
            )}

            {selectedHotspot?.protocol && (
              <div className="bg-blue-950/30 p-2.5 rounded-lg border border-blue-900/50">
                <span className="font-semibold text-blue-300 block mb-0.5">108 EMS Protocol:</span>
                <p className="text-blue-200 leading-relaxed">
                  {selectedHotspot.protocol}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hotspot Direct Selector List */}
        <div className="my-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">Interactive Hotspot Index:</span>
          <div className="flex flex-wrap gap-1.5">
            {(mode === 'anatomy' ? ANATOMY_HOTSPOTS : AMBULANCE_HOTSPOTS).map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition ${
                  selectedHotspot?.id === item.id
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.id}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <button
            onClick={() => {
              if (onDispatchTrigger) {
                onDispatchTrigger({
                  severity: selectedHotspot?.severity || 'CRITICAL',
                  complaint: `${selectedHotspot?.name}: ${selectedHotspot?.diagnosis || selectedHotspot?.details}`,
                  hotspot: selectedHotspot
                });
              }
            }}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-red-950 flex items-center justify-center space-x-2 transition transform active:scale-95"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>108 ਐਮਰਜੈਂਸੀ ਰਵਾਨਾ ਕਰੋ (Dispatch 108 EMS)</span>
          </button>

          <p className="text-[10px] text-center text-slate-500">
            ISD Course Capstone • Interactive Systems & 3D Simulation
          </p>
        </div>

      </div>

    </div>
  );
};
