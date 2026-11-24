# HealthBridge (SehatSetu) – 3D Hospital Environment in Unity

Welcome to the **HealthBridge (SehatSetu)** 3D Hospital building project. This environment represents a modern healthcare center designed to showcase accessible healthcare services for rural and urban communities.

---

## 🏥 Overview

- **Engine Version**: Unity 6 (6000.6.7f1) / Compatible with Unity 2022.3+ LTS and Unity 6
- **Architecture**: 3-Floor Modern Healthcare Facility built purely using Unity 3D primitives (Cubes, Planes, Cylinders, Spheres), customized materials, directional & point lighting, TextMeshPro, and Unity UI.
- **Render Pipeline**: Built-in / Universal Render Pipeline (URP) compatible materials.
- **Assets**: 100% self-contained — No external paid assets or Blender models required.

---

## 🎮 Controls

| Action | Key / Input |
| :--- | :--- |
| **Move Forward** | `W` or `Up Arrow` |
| **Move Backward** | `S` or `Down Arrow` |
| **Move Left** | `A` or `Left Arrow` |
| **Move Right** | `D` or `Right Arrow` |
| **Sprint** | Hold `Left Shift` |
| **Look Around** | `Mouse` |
| **Interact** | `E` (when near interactive counter/desk) |
| **Pause / Close Dialog** | `Escape` |

---

## 🌟 Interactive Hospital Points

Approach any of the following interactive points and press **`[E]`** when the on-screen prompt appears:

1. **Reception & Registration Desk** (Lobby entrance):
   - Welcomes patients to HealthBridge Hospital (SehatSetu).
   - Details OPD timings, digital Ayushman Bharat / ABHA registration, and telemedicine triage.
2. **Information Kiosk** (Central Foyer):
   - Interactive directory explaining the hospital's rural outreach mission, floor directory, and 24/7 helplines.
3. **Doctor Consultation Room (OPD 1)** (West Wing):
   - Executive desk, examination bed with privacy curtain, X-ray light box, and Snellen eye chart.
   - Displays doctor consulting schedules (Dr. Ananya Sharma - Internal Medicine, Dr. Rajesh Patel - Tele-Medicine Specialist).
4. **Jan-Aushadhi 24/7 Pharmacy** (East Wing):
   - Dispensing counter with glass partition, checkout register, and stocked medicine shelves.
   - Displays details on subsidized generic medicines, emergency refills, and rural delivery networks.
5. **Emergency & Trauma Care (ER)** (North-East Wing with direct Ambulance access):
   - 2 Emergency trauma stretchers, chrome IV drip stands, cardiac vital signs monitor, crash cart, and oxygen cylinders.
   - Displays critical care protocols, 24/7 trauma response, and ambulance dispatch info (108/112).

---

## 🏢 Scene Hierarchy Structure

The scene `Assets/Scenes/HospitalScene.unity` is organized into the exact requested hierarchy:

```
HospitalScene
├── Environment
│   ├── Ground (Campus lawn & terrain)
│   ├── Roads (Main avenue, lane stripes, sidewalks & loop driveway)
│   ├── Trees (Campus landscaping trees, garden benches, streetlamps)
│   └── Parking (Visitor parking stalls & dedicated Ambulance Bay)
├── Hospital
│   ├── MainBuilding (3-floor structure, exterior walls, trim bands)
│   ├── Floors (Ground floor tile, Floor 1 slab, Floor 2 slab)
│   ├── Windows (Large blue glass ribbon windows & showroom glazing)
│   ├── Doors (Main entrance glass sliding doors, portico canopy, Emergency entrance)
│   ├── Roof (Parapet safety walls, HVAC chillers, elevator penthouse)
│   └── MedicalSign (3D Glowing Red Cross, HealthBridge Hospital Billboard)
├── Interior
│   ├── Reception (L-shaped desk, 2 PCs, office chairs, signage, interactable)
│   ├── WaitingArea (8 padded chairs, coffee table, wall TV, water dispenser, plants)
│   ├── DoctorRoom (Executive desk, laptop, exam bed, X-ray viewer, eye chart)
│   ├── Pharmacy (Counter, glass screen, shelves with medicine boxes, green cross)
│   └── EmergencyRoom (2 trauma beds, IV stands, cardiac monitor, crash cart, O2 tanks)
├── Player (CharacterController, FPS PlayerController, InteractionSystem, Eye Camera)
├── Lighting (Directional Sun with soft shadows, interior downlights, streetlamps)
└── UI (Canvas with WelcomePanel, InteractionPanel, PausePanel, PromptHUD, Crosshair)
```

---

## 📜 C# Scripts Overview

All scripts are located in `Assets/Scripts/`:

1. **`PlayerController.cs`**:
   - Handles smooth first-person WASD movement, sprint, jump, and mouse-look.
   - Clamps vertical camera rotation between -80° and +80°.
   - Implements subtle head bobbing for realistic exploration feel.
   - Automatically halts movement and frees the mouse cursor when UI dialogs or pause menus are open.

2. **`InteractionSystem.cs`**:
   - Attached to the Player.
   - Casts a raycast from the center of the camera up to 3.8 meters.
   - Detects `HospitalInteractable` objects, displays on-screen HUD prompt (`Press [E] to Interact`), and triggers interaction upon pressing `E`.

3. **`HospitalInteractable.cs`**:
   - Attached to interactive counters and stations.
   - Stores information title, category, description, prompt text, and badge theme color.
   - Triggers `UIManager.Instance.ShowInformation(...)` when interacted with.

4. **`UIManager.cs`**:
   - Central singleton manager controlling all UI states.
   - Manages `WelcomePanel` (first launch), `InteractionPanel` (detailed information dialogs), `PausePanel` (Escape key menu), `PromptPanel` (HUD pill), and `Crosshair`.
   - Handles cursor locking and game pause time scaling (`Time.timeScale`).

5. **`Assets/Editor/HospitalSceneBuilder.cs`**:
   - Custom Editor script that programmatically constructs the entire scene, creates all materials, sets up colliders and lighting, builds UI, and configures build settings.
   - Accessible from the Unity top menu: **`HealthBridge > Build Complete Hospital Scene`**.

---

## 🚀 How to Run the Project

1. Open **Unity Hub**.
2. Click **Add** (or **Open**) and select this folder:
   `/Users/vedanshgupta/Desktop/hospital`
3. Open the project with **Unity 6** (or Unity 2022/2023).
4. In the Project window, navigate to `Assets/Scenes/` and double-click **`HospitalScene.unity`**.
5. Click the **Play** button (▶) at the top of the Unity Editor.
6. The **Welcome Panel** will appear explaining the controls. Click **"START EXPLORATION"** or press **ESC** to begin exploring the hospital!
