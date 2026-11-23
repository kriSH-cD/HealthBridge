using System.IO;
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using TMPro;

/// <summary>
/// Professional Scene Builder for HealthBridge (SehatSetu) Hospital.
/// Constructs the complete 3D hospital building, detailed interior, exterior campus,
/// first-person player controller, lighting, and interactive UI panels programmatically using Unity primitives.
/// </summary>
public static class HospitalSceneBuilder
{
    private const string SCENE_PATH = "Assets/Scenes/HospitalScene.unity";
    private const string MAT_DIR = "Assets/Materials";

    // Material references
    private static Material matWhiteWall;
    private static Material matHospitalBlue;
    private static Material matDarkBlue;
    private static Material matBlueGlass;
    private static Material matRedCross;
    private static Material matGreenCross;
    private static Material matFloorTile;
    private static Material matCeiling;
    private static Material matWoodDesk;
    private static Material matMetalChrome;
    private static Material matBedSheet;
    private static Material matBedMattress;
    private static Material matGround;
    private static Material matRoad;
    private static Material matRoadStripe;
    private static Material matYellowLine;
    private static Material matSidewalk;
    private static Material matTreeBark;
    private static Material matTreeLeaves;
    private static Material matBlackPlastic;
    private static Material matECGScreen;
    private static Material matXRay;
    private static Material matPlantPot;

    private static TMP_FontAsset defaultFontAsset;

    [MenuItem("HealthBridge/Build Complete Hospital Scene")]
    public static void BuildScene()
    {
        Debug.Log("[HospitalSceneBuilder] Starting Complete HealthBridge Scene Generation...");

        EnsureDirectories();
        ImportTMPEssentialsIfNeeded();
        LoadDefaultFont();
        CreateAllMaterials();

        // Create new empty scene
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // 1. Root Hierarchy GameObjects
        GameObject envRoot = new GameObject("Environment");
        GameObject hospitalRoot = new GameObject("Hospital");
        GameObject interiorRoot = new GameObject("Interior");
        GameObject lightingRoot = new GameObject("Lighting");
        GameObject uiRoot = new GameObject("UI");

        // Hierarchy children
        GameObject groundObj = new GameObject("Ground"); groundObj.transform.SetParent(envRoot.transform);
        GameObject roadsObj = new GameObject("Roads"); roadsObj.transform.SetParent(envRoot.transform);
        GameObject treesObj = new GameObject("Trees"); treesObj.transform.SetParent(envRoot.transform);
        GameObject parkingObj = new GameObject("Parking"); parkingObj.transform.SetParent(envRoot.transform);

        GameObject mainBuildingObj = new GameObject("MainBuilding"); mainBuildingObj.transform.SetParent(hospitalRoot.transform);
        GameObject floorsObj = new GameObject("Floors"); floorsObj.transform.SetParent(hospitalRoot.transform);
        GameObject windowsObj = new GameObject("Windows"); windowsObj.transform.SetParent(hospitalRoot.transform);
        GameObject doorsObj = new GameObject("Doors"); doorsObj.transform.SetParent(hospitalRoot.transform);
        GameObject roofObj = new GameObject("Roof"); roofObj.transform.SetParent(hospitalRoot.transform);
        GameObject medicalSignObj = new GameObject("MedicalSign"); medicalSignObj.transform.SetParent(hospitalRoot.transform);

        GameObject receptionObj = new GameObject("Reception"); receptionObj.transform.SetParent(interiorRoot.transform);
        GameObject waitingAreaObj = new GameObject("WaitingArea"); waitingAreaObj.transform.SetParent(interiorRoot.transform);
        GameObject doctorRoomObj = new GameObject("DoctorRoom"); doctorRoomObj.transform.SetParent(interiorRoot.transform);
        GameObject pharmacyObj = new GameObject("Pharmacy"); pharmacyObj.transform.SetParent(interiorRoot.transform);
        GameObject emergencyRoomObj = new GameObject("EmergencyRoom"); emergencyRoomObj.transform.SetParent(interiorRoot.transform);

        // 2. Build Scene Sections
        BuildLighting(lightingRoot.transform);
        BuildEnvironment(groundObj.transform, roadsObj.transform, treesObj.transform, parkingObj.transform);
        BuildHospitalBuilding(mainBuildingObj.transform, floorsObj.transform, windowsObj.transform, doorsObj.transform, roofObj.transform, medicalSignObj.transform);
        BuildInterior(receptionObj.transform, waitingAreaObj.transform, doctorRoomObj.transform, pharmacyObj.transform, emergencyRoomObj.transform, interiorRoot.transform);
        BuildPlayer();
        BuildUI(uiRoot);

        // 3. Save Scene & Set in Build Settings
        EditorSceneManager.SaveScene(scene, SCENE_PATH);
        AddSceneToBuildSettings(SCENE_PATH);

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        Debug.Log($"[HospitalSceneBuilder] Hospital Scene successfully built and saved to: {SCENE_PATH}!");
    }

    private static void EnsureDirectories()
    {
        if (!Directory.Exists("Assets/Scenes")) Directory.CreateDirectory("Assets/Scenes");
        if (!Directory.Exists(MAT_DIR)) Directory.CreateDirectory(MAT_DIR);
    }

    private static void ImportTMPEssentialsIfNeeded()
    {
        string[] tmpSettings = AssetDatabase.FindAssets("t:TMP_Settings");
        if (tmpSettings.Length == 0)
        {
            string[] unityPackages = Directory.GetFiles("Library/PackageCache", "TMP Essential Resources.unitypackage", SearchOption.AllDirectories);
            if (unityPackages.Length > 0)
            {
                Debug.Log("[HospitalSceneBuilder] Importing TextMesh Pro Essential Resources...");
                AssetDatabase.ImportPackage(unityPackages[0], false);
                AssetDatabase.Refresh();
            }
        }
    }

    private static void LoadDefaultFont()
    {
        string[] fontGuids = AssetDatabase.FindAssets("LiberationSans SDF t:TMP_FontAsset");
        if (fontGuids.Length > 0)
        {
            string path = AssetDatabase.GUIDToAssetPath(fontGuids[0]);
            defaultFontAsset = AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(path);
        }
    }

    #region Materials Creation
    private static void CreateAllMaterials()
    {
        Shader litShader = Shader.Find("Universal Render Pipeline/Lit");
        if (litShader == null) litShader = Shader.Find("Standard");
        if (litShader == null) litShader = Shader.Find("Diffuse");

        matGround = GetOrCreateMaterial("Mat_Ground", new Color(0.24f, 0.54f, 0.22f), 0.1f, 0f, litShader);
        matRoad = GetOrCreateMaterial("Mat_Road", new Color(0.18f, 0.20f, 0.22f), 0.2f, 0f, litShader);
        matRoadStripe = GetOrCreateMaterial("Mat_RoadStripe", new Color(0.95f, 0.95f, 0.95f), 0.2f, 0f, litShader);
        matYellowLine = GetOrCreateMaterial("Mat_YellowLine", new Color(0.95f, 0.78f, 0.10f), 0.2f, 0f, litShader);
        matSidewalk = GetOrCreateMaterial("Mat_Sidewalk", new Color(0.75f, 0.76f, 0.78f), 0.1f, 0f, litShader);

        matWhiteWall = GetOrCreateMaterial("Mat_WhiteWall", new Color(0.96f, 0.97f, 0.98f), 0.25f, 0f, litShader);
        matHospitalBlue = GetOrCreateMaterial("Mat_HospitalBlue", new Color(0.08f, 0.44f, 0.76f), 0.35f, 0.1f, litShader);
        matDarkBlue = GetOrCreateMaterial("Mat_DarkBlue", new Color(0.05f, 0.23f, 0.45f), 0.35f, 0.1f, litShader);
        matFloorTile = GetOrCreateMaterial("Mat_FloorTile", new Color(0.91f, 0.93f, 0.94f), 0.6f, 0.1f, litShader);
        matCeiling = GetOrCreateMaterial("Mat_Ceiling", new Color(0.98f, 0.98f, 0.98f), 0.1f, 0f, litShader);

        matWoodDesk = GetOrCreateMaterial("Mat_WoodDesk", new Color(0.55f, 0.38f, 0.27f), 0.4f, 0f, litShader);
        matMetalChrome = GetOrCreateMaterial("Mat_MetalChrome", new Color(0.82f, 0.85f, 0.88f), 0.85f, 0.85f, litShader);
        matBedSheet = GetOrCreateMaterial("Mat_BedSheet", new Color(0.92f, 0.97f, 0.98f), 0.1f, 0f, litShader);
        matBedMattress = GetOrCreateMaterial("Mat_BedMattress", new Color(0.12f, 0.65f, 0.65f), 0.2f, 0f, litShader);

        matTreeBark = GetOrCreateMaterial("Mat_TreeBark", new Color(0.35f, 0.24f, 0.18f), 0.1f, 0f, litShader);
        matTreeLeaves = GetOrCreateMaterial("Mat_TreeLeaves", new Color(0.18f, 0.48f, 0.20f), 0.1f, 0f, litShader);
        matBlackPlastic = GetOrCreateMaterial("Mat_BlackPlastic", new Color(0.12f, 0.12f, 0.12f), 0.4f, 0f, litShader);
        matPlantPot = GetOrCreateMaterial("Mat_PlantPot", new Color(0.48f, 0.32f, 0.25f), 0.2f, 0f, litShader);

        // Emissive Materials
        matRedCross = GetOrCreateMaterial("Mat_RedCross", new Color(0.92f, 0.12f, 0.12f), 0.5f, 0f, litShader);
        SetEmission(matRedCross, new Color(0.92f, 0.12f, 0.12f), 1.6f);

        matGreenCross = GetOrCreateMaterial("Mat_GreenCross", new Color(0.12f, 0.78f, 0.25f), 0.5f, 0f, litShader);
        SetEmission(matGreenCross, new Color(0.12f, 0.78f, 0.25f), 1.4f);

        matECGScreen = GetOrCreateMaterial("Mat_ECGScreen", new Color(0.04f, 0.68f, 0.35f), 0.5f, 0f, litShader);
        SetEmission(matECGScreen, new Color(0.04f, 0.68f, 0.35f), 1.8f);

        matXRay = GetOrCreateMaterial("Mat_XRay", new Color(0.82f, 0.94f, 1.0f), 0.5f, 0f, litShader);
        SetEmission(matXRay, new Color(0.82f, 0.94f, 1.0f), 1.5f);

        // Semi-transparent blue glass
        matBlueGlass = GetOrCreateMaterial("Mat_BlueGlass", new Color(0.25f, 0.65f, 0.95f, 0.42f), 0.92f, 0.2f, litShader, isTransparent: true);
    }

    private static Material GetOrCreateMaterial(string matName, Color color, float smoothness, float metallic, Shader shader, bool isTransparent = false)
    {
        string path = $"{MAT_DIR}/{matName}.mat";
        Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);
        if (mat == null)
        {
            mat = new Material(shader);
            AssetDatabase.CreateAsset(mat, path);
        }

        mat.color = color;
        if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", color);
        if (mat.HasProperty("_Glossiness")) mat.SetFloat("_Glossiness", smoothness);
        if (mat.HasProperty("_Smoothness")) mat.SetFloat("_Smoothness", smoothness);
        if (mat.HasProperty("_Metallic")) mat.SetFloat("_Metallic", metallic);

        if (isTransparent)
        {
            SetupTransparentMaterial(mat);
        }

        EditorUtility.SetDirty(mat);
        return mat;
    }

    private static void SetEmission(Material mat, Color emissionColor, float intensity)
    {
        mat.EnableKeyword("_EMISSION");
        Color finalColor = emissionColor * intensity;
        if (mat.HasProperty("_EmissionColor")) mat.SetColor("_EmissionColor", finalColor);
    }

    private static void SetupTransparentMaterial(Material mat)
    {
        // Standard shader transparency setup
        if (mat.shader.name.Contains("Standard"))
        {
            mat.SetFloat("_Mode", 3); // Transparent
            mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            mat.SetInt("_ZWrite", 0);
            mat.DisableKeyword("_ALPHATEST_ON");
            mat.EnableKeyword("_ALPHABLEND_ON");
            mat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
            mat.renderQueue = 3000;
        }
        else if (mat.shader.name.Contains("Universal"))
        {
            mat.SetFloat("_Surface", 1); // 1 = Transparent
            mat.SetFloat("_Blend", 0);   // 0 = Alpha
            mat.SetInt("_ZWrite", 0);
            mat.renderQueue = 3000;
        }
    }
    #endregion

    #region Lighting
    private static void BuildLighting(Transform parent)
    {
        // Directional Sunlight
        GameObject sunObj = new GameObject("Sun_DirectionalLight");
        sunObj.transform.SetParent(parent);
        sunObj.transform.position = new Vector3(0, 40, 0);
        sunObj.transform.rotation = Quaternion.Euler(50f, -35f, 0f);

        Light sun = sunObj.AddComponent<Light>();
        sun.type = LightType.Directional;
        sun.color = new Color(1.0f, 0.98f, 0.93f);
        sun.intensity = 1.25f;
        sun.shadows = LightShadows.Soft;

        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
        RenderSettings.ambientSkyColor = new Color(0.68f, 0.78f, 0.90f);
        RenderSettings.ambientEquatorColor = new Color(0.55f, 0.62f, 0.68f);
        RenderSettings.ambientGroundColor = new Color(0.35f, 0.40f, 0.35f);
    }

    private static void AddPointLight(Transform parent, Vector3 localPos, Color color, float intensity, float range)
    {
        GameObject lightObj = new GameObject("PointLight");
        lightObj.transform.SetParent(parent);
        lightObj.transform.position = localPos;
        Light light = lightObj.AddComponent<Light>();
        light.type = LightType.Point;
        light.color = color;
        light.intensity = intensity;
        light.range = range;
        light.shadows = LightShadows.None;
    }
    #endregion

    #region Environment Construction
    private static void BuildEnvironment(Transform groundParent, Transform roadsParent, Transform treesParent, Transform parkingParent)
    {
        // 1. Large Ground Plane / Lawn (130m x 130m)
        GameObject ground = CreateBox("Main_Ground", groundParent, new Vector3(0, -0.2f, 0), new Vector3(130, 0.4f, 130), matGround);

        // 2. Main Road in front (Width 14m, Length 130m, at Z = -34)
        CreateBox("Main_Avenue", roadsParent, new Vector3(0, 0.05f, -34), new Vector3(130, 0.1f, 14), matRoad);

        // Center dashed yellow/white lane dividers
        for (int x = -60; x <= 60; x += 6)
        {
            CreateBox("Road_Divider_Line", roadsParent, new Vector3(x, 0.11f, -34), new Vector3(3.5f, 0.02f, 0.3f), matRoadStripe);
        }

        // Sidewalks along road
        CreateBox("Sidewalk_North", roadsParent, new Vector3(0, 0.15f, -25.8f), new Vector3(130, 0.2f, 2.4f), matSidewalk);
        CreateBox("Sidewalk_South", roadsParent, new Vector3(0, 0.15f, -42.2f), new Vector3(130, 0.2f, 2.4f), matSidewalk);

        // Hospital Drop-off Driveway / Plaza Loop (connecting road to hospital entrance)
        CreateBox("Entrance_Plaza", roadsParent, new Vector3(0, 0.08f, -20), new Vector3(44, 0.14f, 10), matSidewalk);
        CreateBox("Driveway_Approach", roadsParent, new Vector3(0, 0.06f, -23), new Vector3(36, 0.12f, 5), matRoad);

        // 3. Parking Lots
        // Visitor Parking (Left Side: X = -28 to -14, Z = -22 to -16)
        CreateBox("Visitor_Parking_Lot", parkingParent, new Vector3(-20, 0.06f, -20), new Vector3(16, 0.1f, 8), matRoad);
        for (int i = 0; i < 6; i++)
        {
            float posX = -26f + (i * 2.5f);
            CreateBox($"Parking_Slot_Stripe_{i}", parkingParent, new Vector3(posX, 0.12f, -20), new Vector3(0.18f, 0.02f, 6.5f), matRoadStripe);
        }

        // Dedicated Ambulance Bay (Right Side: X = 16 to 26, Z = -20 to -14)
        CreateBox("Ambulance_Parking_Bay", parkingParent, new Vector3(21, 0.06f, -18), new Vector3(12, 0.1f, 8), matRoad);
        // Yellow cross-hatched boundary
        CreateBox("Ambulance_Yellow_Border_L", parkingParent, new Vector3(15.5f, 0.12f, -18), new Vector3(0.3f, 0.02f, 7.5f), matYellowLine);
        CreateBox("Ambulance_Yellow_Border_R", parkingParent, new Vector3(26.5f, 0.12f, -18), new Vector3(0.3f, 0.02f, 7.5f), matYellowLine);
        CreateBox("Ambulance_Yellow_Cross_1", parkingParent, new Vector3(21, 0.12f, -18), new Vector3(9f, 0.02f, 0.3f), matYellowLine);
        // Ambulance Signboard
        BuildSignboard(parkingParent, new Vector3(21, 0, -13.5f), "AMBULANCE", "ONLY 24x7", matHospitalBlue, matYellowLine);

        // 4. Campus Trees & Garden
        Vector3[] treePositions = new Vector3[]
        {
            new Vector3(-32, 0, -28), new Vector3(-24, 0, -28), new Vector3(-16, 0, -28),
            new Vector3(28, 0, -28), new Vector3(36, 0, -28), new Vector3(44, 0, -28),
            new Vector3(-32, 0, -10), new Vector3(-32, 0, 5), new Vector3(-32, 0, 20),
            new Vector3(32, 0, -10), new Vector3(32, 0, 5), new Vector3(32, 0, 20),
            new Vector3(-18, 0, 24), new Vector3(0, 0, 24), new Vector3(18, 0, 24)
        };

        foreach (var pos in treePositions)
        {
            BuildTree(treesParent, pos);
        }

        // Garden Benches
        BuildGardenBench(treesParent, new Vector3(-8, 0, -19), 0f);
        BuildGardenBench(treesParent, new Vector3(8, 0, -19), 0f);

        // Streetlamps with Lights
        Vector3[] lampPositions = new Vector3[]
        {
            new Vector3(-12, 0, -26), new Vector3(12, 0, -26),
            new Vector3(-25, 0, -26), new Vector3(25, 0, -26),
            new Vector3(-7, 0, -15), new Vector3(7, 0, -15)
        };
        foreach (var lpos in lampPositions)
        {
            BuildStreetLamp(treesParent, lpos);
        }
    }

    private static void BuildTree(Transform parent, Vector3 rootPos)
    {
        GameObject tree = new GameObject("Hospital_Tree");
        tree.transform.SetParent(parent);
        tree.transform.position = rootPos;

        // Trunk (Cylinder: height 3m, diam 0.45m)
        GameObject trunk = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        trunk.name = "Trunk";
        trunk.transform.SetParent(tree.transform);
        trunk.transform.localPosition = new Vector3(0, 1.5f, 0);
        trunk.transform.localScale = new Vector3(0.45f, 1.5f, 0.45f);
        trunk.GetComponent<Renderer>().material = matTreeBark;

        // Foliage Crown (Layered Spheres)
        GameObject crown1 = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        crown1.name = "Foliage_Base";
        crown1.transform.SetParent(tree.transform);
        crown1.transform.localPosition = new Vector3(0, 3.6f, 0);
        crown1.transform.localScale = new Vector3(2.8f, 2.4f, 2.8f);
        crown1.GetComponent<Renderer>().material = matTreeLeaves;

        GameObject crown2 = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        crown2.name = "Foliage_Top";
        crown2.transform.SetParent(tree.transform);
        crown2.transform.localPosition = new Vector3(0, 4.6f, 0);
        crown2.transform.localScale = new Vector3(2.0f, 2.0f, 2.0f);
        crown2.GetComponent<Renderer>().material = matTreeLeaves;
    }

    private static void BuildGardenBench(Transform parent, Vector3 pos, float yRotation)
    {
        GameObject bench = new GameObject("GardenBench");
        bench.transform.SetParent(parent);
        bench.transform.position = pos;
        bench.transform.rotation = Quaternion.Euler(0, yRotation, 0);

        // Seat
        CreateBox("Seat", bench.transform, new Vector3(0, 0.45f, 0), new Vector3(1.8f, 0.08f, 0.5f), matWoodDesk);
        // Backrest
        CreateBox("Backrest", bench.transform, new Vector3(0, 0.85f, -0.22f), new Vector3(1.8f, 0.45f, 0.06f), matWoodDesk);
        // Metal Legs
        CreateBox("Leg_L", bench.transform, new Vector3(-0.75f, 0.22f, 0), new Vector3(0.08f, 0.44f, 0.48f), matMetalChrome);
        CreateBox("Leg_R", bench.transform, new Vector3(0.75f, 0.22f, 0), new Vector3(0.08f, 0.44f, 0.48f), matMetalChrome);
    }

    private static void BuildStreetLamp(Transform parent, Vector3 pos)
    {
        GameObject lamp = new GameObject("Outdoor_Streetlamp");
        lamp.transform.SetParent(parent);
        lamp.transform.position = pos;

        // Pole (Cylinder)
        GameObject pole = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        pole.transform.SetParent(lamp.transform);
        pole.transform.localPosition = new Vector3(0, 2.2f, 0);
        pole.transform.localScale = new Vector3(0.18f, 2.2f, 0.18f);
        pole.GetComponent<Renderer>().material = matDarkBlue;

        // Bulb / Lantern (Sphere)
        GameObject bulb = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        bulb.transform.SetParent(lamp.transform);
        bulb.transform.localPosition = new Vector3(0, 4.5f, 0);
        bulb.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);
        bulb.GetComponent<Renderer>().material = matRedCross; // Bright glow
        SetEmission(bulb.GetComponent<Renderer>().material, new Color(1f, 0.95f, 0.8f), 2f);

        AddPointLight(lamp.transform, new Vector3(0, 4.3f, 0), new Color(1f, 0.95f, 0.8f), 1.1f, 9f);
    }
    #endregion

    #region Hospital Building Exterior
    private static void BuildHospitalBuilding(Transform mainParent, Transform floorsParent, Transform windowsParent, Transform doorsParent, Transform roofParent, Transform signParent)
    {
        // Building Footprint: Width 42m (X: -21 to +21), Depth 26m (Z: -13 to +13), Height: 12.6m (3 floors, 4.2m each)
        float bWidth = 42f;
        float bDepth = 26f;
        float floorH = 4.2f;
        float bHeight = floorH * 3; // 12.6m

        // 1. Foundation Slab
        CreateBox("Foundation_Slab", mainParent, new Vector3(0, 0.05f, 0), new Vector3(bWidth + 0.6f, 0.1f, bDepth + 0.6f), matDarkBlue);

        // 2. Exterior Walls (Rear, Left, Right)
        // Rear Wall (Full height)
        CreateBox("Exterior_Wall_Rear", mainParent, new Vector3(0, bHeight / 2f, bDepth / 2f), new Vector3(bWidth, bHeight, 0.6f), matWhiteWall);
        // Left Wall (Full height)
        CreateBox("Exterior_Wall_Left", mainParent, new Vector3(-bWidth / 2f, bHeight / 2f, 0), new Vector3(0.6f, bHeight, bDepth), matWhiteWall);
        // Right Wall (Full height with Emergency doorway opening)
        CreateBox("Exterior_Wall_Right_Top", mainParent, new Vector3(bWidth / 2f, (bHeight + floorH) / 2f, 0), new Vector3(0.6f, bHeight - floorH, bDepth), matWhiteWall);
        CreateBox("Exterior_Wall_Right_Back", mainParent, new Vector3(bWidth / 2f, floorH / 2f, 7f), new Vector3(0.6f, floorH, 12f), matWhiteWall);
        CreateBox("Exterior_Wall_Right_Front", mainParent, new Vector3(bWidth / 2f, floorH / 2f, -8f), new Vector3(0.6f, floorH, 10f), matWhiteWall);

        // Front Exterior Walls (Flanking entrance and upper floors)
        // Ground Floor Front: Left Wing (X: -21 to -4) and Right Wing (X: 4 to 21)
        CreateBox("Exterior_Front_G_Left", mainParent, new Vector3(-12.5f, floorH / 2f, -bDepth / 2f), new Vector3(17f, floorH, 0.6f), matWhiteWall);
        CreateBox("Exterior_Front_G_Right", mainParent, new Vector3(12.5f, floorH / 2f, -bDepth / 2f), new Vector3(17f, floorH, 0.6f), matWhiteWall);
        // Lintel above main entrance door
        CreateBox("Exterior_Front_G_DoorLintel", mainParent, new Vector3(0, 3.6f, -bDepth / 2f), new Vector3(8f, 1.2f, 0.6f), matWhiteWall);

        // Upper Floors Front Facade (Floors 1 & 2)
        // Solid wall pillars between large window panels
        CreateBox("Exterior_Front_Upper_Left", mainParent, new Vector3(-16f, (floorH * 2) + 0.1f, -bDepth / 2f), new Vector3(10f, floorH * 2, 0.6f), matWhiteWall);
        CreateBox("Exterior_Front_Upper_MidL", mainParent, new Vector3(-5.5f, (floorH * 2) + 0.1f, -bDepth / 2f), new Vector3(3f, floorH * 2, 0.6f), matWhiteWall);
        CreateBox("Exterior_Front_Upper_Center", mainParent, new Vector3(0, (floorH * 2) + 0.1f, -bDepth / 2f), new Vector3(4f, floorH * 2, 0.6f), matWhiteWall);
        CreateBox("Exterior_Front_Upper_MidR", mainParent, new Vector3(5.5f, (floorH * 2) + 0.1f, -bDepth / 2f), new Vector3(3f, floorH * 2, 0.6f), matWhiteWall);
        CreateBox("Exterior_Front_Upper_Right", mainParent, new Vector3(16f, (floorH * 2) + 0.1f, -bDepth / 2f), new Vector3(10f, floorH * 2, 0.6f), matWhiteWall);

        // Architectural Blue Accent Trim Bands
        for (int floor = 1; floor <= 3; floor++)
        {
            float yPos = floor * floorH;
            CreateBox($"BlueTrim_Band_{floor}", mainParent, new Vector3(0, yPos, -bDepth / 2f - 0.05f), new Vector3(bWidth + 0.4f, 0.35f, 0.7f), matHospitalBlue);
            CreateBox($"BlueTrim_Band_Rear_{floor}", mainParent, new Vector3(0, yPos, bDepth / 2f + 0.05f), new Vector3(bWidth + 0.4f, 0.35f, 0.7f), matHospitalBlue);
            CreateBox($"BlueTrim_Band_Left_{floor}", mainParent, new Vector3(-bWidth / 2f - 0.05f, yPos, 0), new Vector3(0.7f, 0.35f, bDepth + 0.4f), matHospitalBlue);
            CreateBox($"BlueTrim_Band_Right_{floor}", mainParent, new Vector3(bWidth / 2f + 0.05f, yPos, 0), new Vector3(0.7f, 0.35f, bDepth + 0.4f), matHospitalBlue);
        }

        // 3. Floor Slabs
        // Ground Floor Sanitized Tile Floor
        CreateBox("Floor_Ground", floorsParent, new Vector3(0, 0.02f, 0), new Vector3(bWidth - 0.2f, 0.04f, bDepth - 0.2f), matFloorTile);
        // Floor 1 Slab (Ceiling of ground floor)
        CreateBox("Floor_Level1_Slab", floorsParent, new Vector3(0, floorH, 0), new Vector3(bWidth - 0.2f, 0.3f, bDepth - 0.2f), matCeiling);
        // Floor 2 Slab
        CreateBox("Floor_Level2_Slab", floorsParent, new Vector3(0, floorH * 2, 0), new Vector3(bWidth - 0.2f, 0.3f, bDepth - 0.2f), matCeiling);

        // 4. Windows (Large Blue Glass-style Windows)
        // Ground Floor Showroom Windows (Flanking entrance)
        CreateBox("Window_G_Left", windowsParent, new Vector3(-10f, 2.0f, -bDepth / 2f), new Vector3(8f, 2.4f, 0.2f), matBlueGlass);
        CreateBox("Window_G_Right", windowsParent, new Vector3(10f, 2.0f, -bDepth / 2f), new Vector3(8f, 2.4f, 0.2f), matBlueGlass);
        // Window Mullion Frames
        CreateBox("Frame_G_Left", windowsParent, new Vector3(-10f, 2.0f, -bDepth / 2f), new Vector3(8.1f, 2.5f, 0.1f), matDarkBlue);
        CreateBox("Frame_G_Right", windowsParent, new Vector3(10f, 2.0f, -bDepth / 2f), new Vector3(8.1f, 2.5f, 0.1f), matDarkBlue);

        // Floor 1 & 2 Facade Ribbon Windows
        for (int fl = 1; fl <= 2; fl++)
        {
            float yWin = (fl * floorH) + 2.1f;
            CreateBox($"Window_F{fl}_Left", windowsParent, new Vector3(-9.5f, yWin, -bDepth / 2f), new Vector3(5f, 2.6f, 0.2f), matBlueGlass);
            CreateBox($"Window_F{fl}_Right", windowsParent, new Vector3(9.5f, yWin, -bDepth / 2f), new Vector3(5f, 2.6f, 0.2f), matBlueGlass);
            CreateBox($"Window_F{fl}_CenterL", windowsParent, new Vector3(-2.2f, yWin, -bDepth / 2f), new Vector3(3f, 2.6f, 0.2f), matBlueGlass);
            CreateBox($"Window_F{fl}_CenterR", windowsParent, new Vector3(2.2f, yWin, -bDepth / 2f), new Vector3(3f, 2.6f, 0.2f), matBlueGlass);
        }

        // Side & Rear Windows for exterior realism
        for (int fl = 0; fl <= 2; fl++)
        {
            float yWin = (fl * floorH) + 2.1f;
            for (int z = -8; z <= 8; z += 8)
            {
                CreateBox($"Window_SideL_F{fl}_{z}", windowsParent, new Vector3(-bWidth / 2f, yWin, z), new Vector3(0.2f, 2.2f, 4f), matBlueGlass);
                if (!(fl == 0 && z >= 0)) // Avoid overlap with emergency doorway
                {
                    CreateBox($"Window_SideR_F{fl}_{z}", windowsParent, new Vector3(bWidth / 2f, yWin, z), new Vector3(0.2f, 2.2f, 4f), matBlueGlass);
                }
            }
        }

        // 5. Doors & Entrance Porticos
        // Main Entrance Portico Canopy
        CreateBox("Main_Canopy_Roof", doorsParent, new Vector3(0, 4.2f, -15.5f), new Vector3(10f, 0.35f, 5.5f), matHospitalBlue);
        // Canopy Pillars (Cylinders)
        GameObject colL = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        colL.name = "Canopy_Col_L"; colL.transform.SetParent(doorsParent);
        colL.transform.position = new Vector3(-4.5f, 2.1f, -17.8f);
        colL.transform.localScale = new Vector3(0.45f, 2.1f, 0.45f);
        colL.GetComponent<Renderer>().material = matMetalChrome;

        GameObject colR = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        colR.name = "Canopy_Col_R"; colR.transform.SetParent(doorsParent);
        colR.transform.position = new Vector3(4.5f, 2.1f, -17.8f);
        colR.transform.localScale = new Vector3(0.45f, 2.1f, 0.45f);
        colR.GetComponent<Renderer>().material = matMetalChrome;

        // Double Glass Sliding Doors (Main Entrance)
        CreateBox("Glass_Door_Left", doorsParent, new Vector3(-1.4f, 1.5f, -bDepth / 2f), new Vector3(2.6f, 3.0f, 0.12f), matBlueGlass);
        CreateBox("Glass_Door_Right", doorsParent, new Vector3(1.4f, 1.5f, -bDepth / 2f), new Vector3(2.6f, 3.0f, 0.12f), matBlueGlass);
        // Door Aluminium Frames & Handles
        CreateBox("Door_Handle_L", doorsParent, new Vector3(-0.25f, 1.4f, -bDepth / 2f - 0.08f), new Vector3(0.06f, 0.9f, 0.06f), matMetalChrome);
        CreateBox("Door_Handle_R", doorsParent, new Vector3(0.25f, 1.4f, -bDepth / 2f - 0.08f), new Vector3(0.06f, 0.9f, 0.06f), matMetalChrome);

        // Emergency Entrance Portico (Right side: X = bWidth/2, Z = 0)
        CreateBox("Emergency_Canopy_Roof", doorsParent, new Vector3(bWidth / 2f + 2.5f, 3.8f, 0), new Vector3(5.5f, 0.35f, 7f), matRedCross);
        CreateBox("Emergency_Sign_Box", doorsParent, new Vector3(bWidth / 2f + 2.5f, 4.3f, 0), new Vector3(5.5f, 0.7f, 0.4f), matRedCross);
        // Emergency Glass Double Doors
        CreateBox("Emergency_Door_L", doorsParent, new Vector3(bWidth / 2f, 1.5f, -1.2f), new Vector3(0.12f, 3.0f, 2.2f), matBlueGlass);
        CreateBox("Emergency_Door_R", doorsParent, new Vector3(bWidth / 2f, 1.5f, 1.2f), new Vector3(0.12f, 3.0f, 2.2f), matBlueGlass);

        // 6. Roof & Parapets
        // Main Roof Slab
        CreateBox("Roof_Slab", roofParent, new Vector3(0, bHeight, 0), new Vector3(bWidth + 0.4f, 0.4f, bDepth + 0.4f), matWhiteWall);
        // Parapet Safety Walls around Roof Perimeter (Height 1.3m)
        CreateBox("Roof_Parapet_Front", roofParent, new Vector3(0, bHeight + 0.65f, -bDepth / 2f), new Vector3(bWidth + 0.4f, 1.3f, 0.5f), matHospitalBlue);
        CreateBox("Roof_Parapet_Rear", roofParent, new Vector3(0, bHeight + 0.65f, bDepth / 2f), new Vector3(bWidth + 0.4f, 1.3f, 0.5f), matHospitalBlue);
        CreateBox("Roof_Parapet_Left", roofParent, new Vector3(-bWidth / 2f, bHeight + 0.65f, 0), new Vector3(0.5f, 1.3f, bDepth + 0.4f), matHospitalBlue);
        CreateBox("Roof_Parapet_Right", roofParent, new Vector3(bWidth / 2f, bHeight + 0.65f, 0), new Vector3(0.5f, 1.3f, bDepth + 0.4f), matHospitalBlue);

        // Rooftop Elevator Penthouse & HVAC Units
        CreateBox("Roof_Elevator_Penthouse", roofParent, new Vector3(-6f, bHeight + 2.0f, 2f), new Vector3(6f, 4f, 6f), matWhiteWall);
        CreateBox("Roof_HVAC_Unit_1", roofParent, new Vector3(8f, bHeight + 1.2f, -2f), new Vector3(4f, 2.2f, 3.5f), matMetalChrome);
        CreateBox("Roof_HVAC_Unit_2", roofParent, new Vector3(14f, bHeight + 1.2f, -2f), new Vector3(4f, 2.2f, 3.5f), matMetalChrome);

        // 7. Medical Sign & Hospital Name Board
        // Large 3D Glowing Red Medical Cross on Rooftop (Visible from afar)
        GameObject redCross = new GameObject("Rooftop_Red_Medical_Cross");
        redCross.transform.SetParent(signParent);
        redCross.transform.position = new Vector3(0, bHeight + 3.2f, -bDepth / 2f);
        // Vertical Bar (Width 1.2m, Height 4.2m, Depth 0.6m)
        CreateBox("Cross_Vertical", redCross.transform, Vector3.zero, new Vector3(1.2f, 4.2f, 0.6f), matRedCross);
        // Horizontal Bar (Width 4.2m, Height 1.2m, Depth 0.6m)
        CreateBox("Cross_Horizontal", redCross.transform, Vector3.zero, new Vector3(4.2f, 1.2f, 0.6f), matRedCross);

        // Hospital Billboard Board on Roof Parapet
        CreateBox("Hospital_Name_Backing", signParent, new Vector3(0, bHeight + 1.0f, -bDepth / 2f - 0.28f), new Vector3(26f, 1.6f, 0.25f), matDarkBlue);
        CreateBox("Hospital_Name_Board_White", signParent, new Vector3(0, bHeight + 1.0f, -bDepth / 2f - 0.42f), new Vector3(25.4f, 1.35f, 0.08f), matWhiteWall);

        // 3D Text / Lettering Proxy Blocks for "HEALTHBRIDGE HOSPITAL"
        Build3DSignText(signParent, new Vector3(0, bHeight + 1.0f, -bDepth / 2f - 0.48f), "HEALTHBRIDGE HOSPITAL");
    }

    private static void Build3DSignText(Transform parent, Vector3 centerPos, string text)
    {
        // Creates clear stylized 3D header text blocks
        GameObject signTextObj = new GameObject("Hospital_Sign_Text");
        signTextObj.transform.SetParent(parent);
        signTextObj.transform.position = centerPos;

        // Subtitle badge: "SEHAT SETU"
        CreateBox("SehatSetu_Badge", signTextObj.transform, new Vector3(0, -0.9f, 0), new Vector3(12f, 0.5f, 0.08f), matHospitalBlue);

        // Overhead Canopy Entrance Sign
        CreateBox("Entrance_Overhead_Sign", signTextObj.transform, new Vector3(0, -8.7f, -2.5f), new Vector3(9f, 0.8f, 0.15f), matDarkBlue);
    }

    private static void BuildSignboard(Transform parent, Vector3 pos, string line1, string line2, Material backMat, Material textMat)
    {
        GameObject sign = new GameObject($"Signboard_{line1}");
        sign.transform.SetParent(parent);
        sign.transform.position = pos;

        CreateBox("Sign_Pole_L", sign.transform, new Vector3(-1.2f, 1f, 0), new Vector3(0.08f, 2f, 0.08f), matMetalChrome);
        CreateBox("Sign_Pole_R", sign.transform, new Vector3(1.2f, 1f, 0), new Vector3(0.08f, 2f, 0.08f), matMetalChrome);
        CreateBox("Sign_Board", sign.transform, new Vector3(0, 1.8f, 0), new Vector3(2.6f, 1.2f, 0.12f), backMat);
        CreateBox("Sign_Graphic", sign.transform, new Vector3(0, 1.8f, -0.07f), new Vector3(2.3f, 0.9f, 0.04f), textMat);
    }
    #endregion

    #region Hospital Interior
    private static void BuildInterior(Transform receptionParent, Transform waitingParent, Transform doctorParent, Transform pharmacyParent, Transform erParent, Transform interiorRoot)
    {
        // Interior Dimensions: Ground Floor Y = 0 to 4.2m
        float floorH = 4.2f;

        // 1. Interior Partition Walls & Layout
        // Central Corridor runs East-West at Z = 0 to 4 (Width 4m)
        // West Partition Wall separating Doctor Room & Waiting Area (at X = -7.5)
        CreateBox("Wall_West_Partition_1", interiorRoot, new Vector3(-7.5f, floorH / 2f, -8f), new Vector3(0.4f, floorH, 9f), matWhiteWall);
        CreateBox("Wall_West_Partition_2", interiorRoot, new Vector3(-7.5f, floorH / 2f, 8f), new Vector3(0.4f, floorH, 9f), matWhiteWall);

        // East Partition Wall separating Pharmacy & ER from Lobby (at X = 7.5)
        CreateBox("Wall_East_Partition_1", interiorRoot, new Vector3(7.5f, floorH / 2f, -8f), new Vector3(0.4f, floorH, 9f), matWhiteWall);
        CreateBox("Wall_East_Partition_2", interiorRoot, new Vector3(7.5f, floorH / 2f, 8f), new Vector3(0.4f, floorH, 9f), matWhiteWall);

        // North-South Room Dividers
        // Separates Waiting Area from Doctor Room (at Z = 2, X: -20 to -7.5)
        CreateBox("Wall_Waiting_Doctor_Divider", interiorRoot, new Vector3(-14.2f, floorH / 2f, 2f), new Vector3(13f, floorH, 0.4f), matWhiteWall);
        // Separates Pharmacy from Emergency Room (at Z = 2, X: 7.5 to 20)
        CreateBox("Wall_Pharmacy_ER_Divider", interiorRoot, new Vector3(14.2f, floorH / 2f, 2f), new Vector3(13f, floorH, 0.4f), matWhiteWall);

        // 2. Interior Lighting
        AddPointLight(interiorRoot, new Vector3(0, 3.5f, -6), new Color(1f, 0.98f, 0.95f), 1.3f, 11f); // Lobby
        AddPointLight(interiorRoot, new Vector3(0, 3.5f, 2), new Color(1f, 0.98f, 0.95f), 1.2f, 10f);  // Corridor
        AddPointLight(waitingParent, new Vector3(-13, 3.5f, -5), new Color(1f, 0.98f, 0.95f), 1.2f, 10f);
        AddPointLight(doctorParent, new Vector3(-13, 3.5f, 7), new Color(1f, 0.98f, 0.95f), 1.2f, 10f);
        AddPointLight(pharmacyParent, new Vector3(13, 3.5f, -5), new Color(1f, 1f, 0.95f), 1.3f, 10f);
        AddPointLight(erParent, new Vector3(13, 3.5f, 7), new Color(1f, 0.95f, 0.95f), 1.4f, 11f);

        // ==========================================
        // 3. RECEPTION & REGISTRATION DESK
        // ==========================================
        GameObject recepStation = new GameObject("Reception_Desk_Station");
        recepStation.transform.SetParent(receptionParent);
        recepStation.transform.position = new Vector3(0, 0, -5f);

        // Curved / L-shaped Modern Counter
        CreateBox("Counter_Main", recepStation.transform, new Vector3(0, 0.55f, 0), new Vector3(5.2f, 1.1f, 1.2f), matWhiteWall);
        CreateBox("Counter_Top_Oak", recepStation.transform, new Vector3(0, 1.12f, 0), new Vector3(5.4f, 0.08f, 1.35f), matWoodDesk);
        CreateBox("Counter_Accent_Blue", recepStation.transform, new Vector3(0, 0.55f, -0.61f), new Vector3(5.0f, 0.35f, 0.04f), matHospitalBlue);

        // 2 Computer Monitors & Keyboards
        BuildComputer(recepStation.transform, new Vector3(-1.4f, 1.16f, 0.1f));
        BuildComputer(recepStation.transform, new Vector3(1.4f, 1.16f, 0.1f));

        // 2 Office Swivel Chairs behind counter
        BuildOfficeChair(recepStation.transform, new Vector3(-1.4f, 0, 1.1f), 180f);
        BuildOfficeChair(recepStation.transform, new Vector3(1.4f, 0, 1.1f), 180f);

        // Overhead "RECEPTION & ADMISSIONS" Sign
        CreateBox("Recep_Signboard", recepStation.transform, new Vector3(0, 2.8f, 0), new Vector3(3.6f, 0.65f, 0.15f), matHospitalBlue);

        // INTERACTIVE COMPONENT - RECEPTION
        HospitalInteractable recepInteract = recepStation.AddComponent<HospitalInteractable>();
        recepInteract.infoTitle = "HealthBridge Reception & Registration";
        recepInteract.category = "Patient Admissions";
        recepInteract.interactionPrompt = "Press [E] to Speak with Receptionist";
        recepInteract.themeColor = new Color(0.08f, 0.44f, 0.76f);
        recepInteract.infoDescription =
            "Welcome to HealthBridge Hospital (SehatSetu).\n\n" +
            "• OPD Registration: 8:00 AM – 8:00 PM Daily\n" +
            "• Digital Ayushman Card & ABHA Health ID verification\n" +
            "• Telemedicine scheduling with super-specialty urban hubs\n" +
            "• Wheelchair assistance, priority queues & patient advocacy\n\n" +
            "Need help navigating? Check our Information Kiosk or ask our duty desk coordinator.";

        // Box Collider for interaction raycast
        BoxCollider recepCol = recepStation.AddComponent<BoxCollider>();
        recepCol.center = new Vector3(0, 0.8f, 0);
        recepCol.size = new Vector3(5.6f, 1.6f, 2.0f);

        // ==========================================
        // 4. INFORMATION DESK (Central Lobby Kiosk)
        // ==========================================
        GameObject infoKiosk = new GameObject("Information_Kiosk_Station");
        infoKiosk.transform.SetParent(receptionParent);
        infoKiosk.transform.position = new Vector3(4.2f, 0, -8f);

        // Kiosk Stand
        CreateBox("Kiosk_Pedestal", infoKiosk.transform, new Vector3(0, 0.5f, 0), new Vector3(0.8f, 1.0f, 0.8f), matDarkBlue);
        CreateBox("Kiosk_Screen_Angled", infoKiosk.transform, new Vector3(0, 1.25f, 0), new Vector3(1.1f, 0.75f, 0.15f), matBlackPlastic);
        CreateBox("Kiosk_Touch_Display", infoKiosk.transform, new Vector3(0, 1.25f, -0.09f), new Vector3(1.0f, 0.68f, 0.03f), matECGScreen);
        CreateBox("Kiosk_Top_Badge", infoKiosk.transform, new Vector3(0, 1.75f, 0), new Vector3(1.2f, 0.3f, 0.08f), matHospitalBlue);

        // INTERACTIVE COMPONENT - INFORMATION DESK
        HospitalInteractable infoInteract = infoKiosk.AddComponent<HospitalInteractable>();
        infoInteract.infoTitle = "HealthBridge (SehatSetu) Digital Information Hub";
        infoInteract.category = "Hospital & Community Overview";
        infoInteract.interactionPrompt = "Press [E] for Hospital Directory & Services";
        infoInteract.themeColor = new Color(0.12f, 0.65f, 0.85f);
        infoInteract.infoDescription =
            "HealthBridge (SehatSetu) Mission:\n" +
            "Bridging the healthcare divide by providing high-quality, dignified medical care to rural and underserved communities.\n\n" +
            "Building Directory:\n" +
            "• Ground Floor: Reception, Jan-Aushadhi Pharmacy, OPD Clinic 1, 24x7 Emergency (ER)\n" +
            "• 1st Floor: Diagnostics Lab, Digital X-Ray / Ultrasound, Tele-Health Command Unit\n" +
            "• 2nd Floor: Inpatient Wards, High Dependency Unit (HDU), Operation Theatre\n\n" +
            "Toll-Free Patient Helpline: 1800-SEHAT-SETU | Emergency Helpline: 108";

        BoxCollider infoCol = infoKiosk.AddComponent<BoxCollider>();
        infoCol.center = new Vector3(0, 1.0f, 0);
        infoCol.size = new Vector3(1.4f, 2.0f, 1.4f);

        // ==========================================
        // 5. WAITING AREA
        // ==========================================
        // 2 Rows of 4 Waiting Chairs
        for (int r = 0; r < 2; r++)
        {
            float zRow = -5.0f - (r * 2.2f);
            for (int c = 0; c < 4; c++)
            {
                float xCol = -15.5f + (c * 1.5f);
                BuildWaitingChair(waitingParent, new Vector3(xCol, 0, zRow), 0f);
            }
        }

        // Center Low Table with Magazines
        CreateBox("Coffee_Table", waitingParent, new Vector3(-13.2f, 0.25f, -6.1f), new Vector3(3.5f, 0.45f, 0.9f), matWoodDesk);
        CreateBox("Health_Mag_1", waitingParent, new Vector3(-13.8f, 0.49f, -6.1f), new Vector3(0.4f, 0.03f, 0.3f), matHospitalBlue);
        CreateBox("Health_Mag_2", waitingParent, new Vector3(-12.6f, 0.49f, -6.1f), new Vector3(0.4f, 0.03f, 0.3f), matRedCross);

        // Wall-mounted Television playing health awareness
        CreateBox("Waiting_TV_Screen", waitingParent, new Vector3(-13.2f, 2.4f, -11.6f), new Vector3(2.6f, 1.5f, 0.12f), matBlackPlastic);
        CreateBox("Waiting_TV_Display", waitingParent, new Vector3(-13.2f, 2.4f, -11.53f), new Vector3(2.4f, 1.35f, 0.03f), matECGScreen);

        // Water Dispenser Unit
        BuildWaterDispenser(waitingParent, new Vector3(-8.5f, 0, -11.5f));

        // Indoor Potted Plants
        BuildIndoorPlant(waitingParent, new Vector3(-19.5f, 0, -11.5f));
        BuildIndoorPlant(waitingParent, new Vector3(-8.5f, 0, -3.2f));

        // ==========================================
        // 6. DOCTOR CONSULTATION ROOM (West Wing)
        // ==========================================
        GameObject docRoom = new GameObject("Doctor_Room_Station");
        docRoom.transform.SetParent(doctorParent);
        docRoom.transform.position = new Vector3(-13.5f, 0, 7f);

        // Doctor's Wooden Executive Desk
        CreateBox("Doc_Desk", docRoom.transform, new Vector3(0, 0.48f, 0), new Vector3(2.4f, 0.96f, 1.2f), matWoodDesk);
        CreateBox("Doc_Laptop", docRoom.transform, new Vector3(-0.4f, 1.0f, 0), new Vector3(0.5f, 0.04f, 0.4f), matMetalChrome);
        CreateBox("Doc_Laptop_Screen", docRoom.transform, new Vector3(-0.4f, 1.25f, 0.18f), new Vector3(0.5f, 0.45f, 0.04f), matBlackPlastic);
        CreateBox("Doc_Stethoscope_Proxy", docRoom.transform, new Vector3(0.5f, 0.98f, -0.1f), new Vector3(0.35f, 0.03f, 0.25f), matBlackPlastic);

        // Doctor's Swivel Chair
        BuildOfficeChair(docRoom.transform, new Vector3(0, 0, 1.1f), 180f);
        // 2 Patient Chairs across desk
        BuildWaitingChair(docRoom.transform, new Vector3(-0.65f, 0, -1.05f), 0f);
        BuildWaitingChair(docRoom.transform, new Vector3(0.65f, 0, -1.05f), 0f);

        // Examination Bed with raised pillow & sheet
        BuildHospitalBed(docRoom.transform, new Vector3(-4.5f, 0, -0.5f), 90f);

        // Diagnostic X-Ray Lightbox on wall
        CreateBox("XRay_Box", docRoom.transform, new Vector3(0, 2.2f, 3.8f), new Vector3(1.4f, 1.0f, 0.12f), matDarkBlue);
        CreateBox("XRay_Illuminated_View", docRoom.transform, new Vector3(0, 2.2f, 3.73f), new Vector3(1.25f, 0.88f, 0.03f), matXRay);

        // Snellen Visual Acuity Eye Chart on wall
        CreateBox("Eye_Chart_Backing", docRoom.transform, new Vector3(4.2f, 2.0f, 1.5f), new Vector3(0.08f, 1.4f, 0.7f), matWhiteWall);

        // Overhead Room Sign
        CreateBox("Doc_Room_Sign", docRoom.transform, new Vector3(0, 2.8f, -3.8f), new Vector3(2.5f, 0.5f, 0.1f), matHospitalBlue);

        // INTERACTIVE COMPONENT - DOCTOR ROOM
        HospitalInteractable docInteract = docRoom.AddComponent<HospitalInteractable>();
        docInteract.infoTitle = "Doctor Consultation Room – OPD 1";
        docInteract.category = "Clinical Services";
        docInteract.interactionPrompt = "Press [E] to Check Doctor Schedule & OPD";
        docInteract.themeColor = new Color(0.18f, 0.58f, 0.35f);
        docInteract.infoDescription =
            "Consulting Medical Specialists:\n\n" +
            "• Dr. Ananya Sharma (MD - Internal Medicine)\n" +
            "  OPD Timings: Monday – Saturday (9:00 AM – 2:00 PM)\n\n" +
            "• Dr. Rajesh Patel (MS - Tele-Medicine Specialist)\n" +
            "  Rural Virtual Consultations: Monday – Friday (3:00 PM – 7:00 PM)\n\n" +
            "• Dr. Priya Verma (MBBS, DGO - Maternal Care Specialist)\n" +
            "  Prenatal & Postnatal OPD: Tuesday & Thursday (10:00 AM – 1:00 PM)\n\n" +
            "Services: General consultation, preventive checkups, digital prescription issuance, referral to regional super-specialty hospitals.";

        BoxCollider docCol = docRoom.AddComponent<BoxCollider>();
        docCol.center = new Vector3(0, 0.8f, 0);
        docCol.size = new Vector3(3.0f, 1.8f, 2.2f);

        // ==========================================
        // 7. PHARMACY COUNTER (East Wing)
        // ==========================================
        GameObject pharmStation = new GameObject("Pharmacy_Station");
        pharmStation.transform.SetParent(pharmacyParent);
        pharmStation.transform.position = new Vector3(13.5f, 0, -6.5f);

        // Pharmacy Dispensing Counter with glass partition
        CreateBox("Pharm_Counter", pharmStation.transform, new Vector3(0, 0.55f, 0), new Vector3(4.5f, 1.1f, 1.0f), matWhiteWall);
        CreateBox("Pharm_Counter_Top", pharmStation.transform, new Vector3(0, 1.12f, 0), new Vector3(4.7f, 0.08f, 1.15f), matWoodDesk);
        CreateBox("Pharm_Glass_Partition", pharmStation.transform, new Vector3(0, 1.6f, -0.2f), new Vector3(4.2f, 0.9f, 0.08f), matBlueGlass);
        CreateBox("Pharm_Cash_Register", pharmStation.transform, new Vector3(1.2f, 1.25f, 0.1f), new Vector3(0.5f, 0.25f, 0.45f), matBlackPlastic);

        // Wall Shelving filled with Medicine Boxes
        for (int shelf = 0; shelf < 3; shelf++)
        {
            float yShelf = 1.0f + (shelf * 0.7f);
            CreateBox($"Pharm_Shelf_{shelf}", pharmStation.transform, new Vector3(0, yShelf, 2.2f), new Vector3(4.6f, 0.06f, 0.6f), matWoodDesk);

            // Medicine Cartons & Bottles (Colored Primitives)
            for (int b = -4; b <= 4; b++)
            {
                Material medMat = (b % 3 == 0) ? matHospitalBlue : (b % 3 == 1 ? matRedCross : matGreenCross);
                CreateBox($"Med_Box_{shelf}_{b}", pharmStation.transform, new Vector3(b * 0.45f, yShelf + 0.16f, 2.2f), new Vector3(0.24f, 0.26f, 0.2f), medMat);
            }
        }

        // Green Illuminated Pharmacy Cross Sign
        GameObject pharmCross = new GameObject("Pharmacy_Green_Cross");
        pharmCross.transform.SetParent(pharmStation.transform);
        pharmCross.transform.position = new Vector3(0, 2.9f, 0);
        CreateBox("PCross_V", pharmCross.transform, Vector3.zero, new Vector3(0.4f, 1.4f, 0.1f), matGreenCross);
        CreateBox("PCross_H", pharmCross.transform, Vector3.zero, new Vector3(1.4f, 0.4f, 0.1f), matGreenCross);

        // INTERACTIVE COMPONENT - PHARMACY
        HospitalInteractable pharmInteract = pharmStation.AddComponent<HospitalInteractable>();
        pharmInteract.infoTitle = "Jan-Aushadhi 24/7 Pharmacy";
        pharmInteract.category = "Medicine & Pharmacy Services";
        pharmInteract.interactionPrompt = "Press [E] to View Pharmacy Services";
        pharmInteract.themeColor = new Color(0.12f, 0.72f, 0.35f);
        pharmInteract.infoDescription =
            "HealthBridge Jan-Aushadhi 24/7 Pharmacy\n\n" +
            "• 500+ Essential Generic & Branded Medicines in stock\n" +
            "• Up to 80% subsidized prices on essential chronic illness medications (Diabetes, Hypertension, Cardiac care)\n" +
            "• Ayushman Bharat cashless medicine disbursement\n" +
            "• Maternal & infant health supplements, ORS packets, clean delivery kits\n" +
            "• Scheduled medicine drone / courier deliveries to rural primary health centers.";

        BoxCollider pharmCol = pharmStation.AddComponent<BoxCollider>();
        pharmCol.center = new Vector3(0, 0.8f, 0);
        pharmCol.size = new Vector3(4.8f, 1.8f, 1.8f);

        // ==========================================
        // 8. EMERGENCY ROOM (ER / Trauma Center)
        // ==========================================
        GameObject erStation = new GameObject("Emergency_Room_Station");
        erStation.transform.SetParent(erParent);
        erStation.transform.position = new Vector3(13.5f, 0, 7f);

        // 2 Emergency Trauma Beds
        BuildHospitalBed(erStation.transform, new Vector3(-2.8f, 0, 0.5f), 0f);
        BuildHospitalBed(erStation.transform, new Vector3(2.8f, 0, 0.5f), 0f);

        // 2 IV Drip Stands beside beds
        BuildIVDripStand(erStation.transform, new Vector3(-4.2f, 0, 1.2f));
        BuildIVDripStand(erStation.transform, new Vector3(4.2f, 0, 1.2f));

        // Vital Signs Patient Monitor (Cardiac Telemetry)
        GameObject monitor = new GameObject("Vital_Signs_Monitor");
        monitor.transform.SetParent(erStation.transform);
        monitor.transform.position = new Vector3(0, 0, 2.5f);
        CreateBox("Monitor_Stand", monitor.transform, new Vector3(0, 0.75f, 0), new Vector3(0.15f, 1.5f, 0.15f), matMetalChrome);
        CreateBox("Monitor_Screen_Box", monitor.transform, new Vector3(0, 1.6f, 0), new Vector3(0.9f, 0.65f, 0.2f), matBlackPlastic);
        CreateBox("Monitor_Display_Glow", monitor.transform, new Vector3(0, 1.6f, -0.11f), new Vector3(0.82f, 0.58f, 0.02f), matECGScreen);

        // Crash Cart / Medical Instrument Trolley
        CreateBox("Crash_Cart_Trolley", erStation.transform, new Vector3(0, 0.45f, -0.5f), new Vector3(1.1f, 0.9f, 0.7f), matMetalChrome);
        CreateBox("Trolley_Drawer_Red", erStation.transform, new Vector3(0, 0.65f, -0.86f), new Vector3(0.9f, 0.2f, 0.04f), matRedCross);

        // Oxygen Cylinders (Green Cylinders)
        GameObject oxy1 = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        oxy1.name = "O2_Cylinder_1"; oxy1.transform.SetParent(erStation.transform);
        oxy1.transform.localPosition = new Vector3(5.2f, 0.7f, 3.2f);
        oxy1.transform.localScale = new Vector3(0.35f, 0.7f, 0.35f);
        oxy1.GetComponent<Renderer>().material = matGreenCross;

        GameObject oxy2 = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        oxy2.name = "O2_Cylinder_2"; oxy2.transform.SetParent(erStation.transform);
        oxy2.transform.localPosition = new Vector3(5.7f, 0.7f, 3.2f);
        oxy2.transform.localScale = new Vector3(0.35f, 0.7f, 0.35f);
        oxy2.GetComponent<Renderer>().material = matGreenCross;

        // Emergency Overhead Sign
        CreateBox("ER_Overhead_Sign", erStation.transform, new Vector3(0, 2.8f, -3.8f), new Vector3(3.2f, 0.55f, 0.1f), matRedCross);

        // INTERACTIVE COMPONENT - EMERGENCY ROOM
        HospitalInteractable erInteract = erStation.AddComponent<HospitalInteractable>();
        erInteract.infoTitle = "24x7 Emergency & Trauma Care";
        erInteract.category = "Emergency Medical Services";
        erInteract.interactionPrompt = "Press [E] to View Emergency Services";
        erInteract.themeColor = new Color(0.92f, 0.15f, 0.15f);
        erInteract.infoDescription =
            "CRITICAL CARE & RESUSCITATION UNIT (LEVEL II)\n\n" +
            "• 24/7 Rapid Emergency Response & Resuscitation\n" +
            "• Dedicated Emergency Medical Officer (EMO) on round-the-clock duty\n" +
            "• Direct connection to Advanced Life Support (ALS) Ambulance fleet\n" +
            "• Emergency Cardiac, Stroke & Snakebite protocol management\n" +
            "• Emergency Hotline: 108 / 112 (Instant Ambulance GPS Dispatch)";

        BoxCollider erCol = erStation.AddComponent<BoxCollider>();
        erCol.center = new Vector3(0, 0.8f, 0.5f);
        erCol.size = new Vector3(3.6f, 1.8f, 2.5f);

        // ==========================================
        // 9. CORRIDOR & WAYFINDING SIGNAGE
        // ==========================================
        // Directional overhead corridor signs
        CreateBox("Sign_Corridor_East", interiorRoot, new Vector3(5.0f, 3.0f, 0), new Vector3(2.4f, 0.5f, 0.12f), matHospitalBlue);
        CreateBox("Sign_Corridor_West", interiorRoot, new Vector3(-5.0f, 3.0f, 0), new Vector3(2.4f, 0.5f, 0.12f), matHospitalBlue);
    }

    private static void BuildComputer(Transform parent, Vector3 localPos)
    {
        GameObject pc = new GameObject("PC_Terminal");
        pc.transform.SetParent(parent);
        pc.transform.localPosition = localPos;

        // Base & Stand
        CreateBox("Stand_Base", pc.transform, new Vector3(0, 0.02f, 0), new Vector3(0.24f, 0.04f, 0.18f), matMetalChrome);
        CreateBox("Stand_Pole", pc.transform, new Vector3(0, 0.18f, 0.05f), new Vector3(0.06f, 0.32f, 0.04f), matMetalChrome);
        // Monitor Bezel & Screen
        CreateBox("Monitor_Bezel", pc.transform, new Vector3(0, 0.38f, 0), new Vector3(0.72f, 0.46f, 0.06f), matBlackPlastic);
        CreateBox("Monitor_Screen", pc.transform, new Vector3(0, 0.38f, -0.035f), new Vector3(0.66f, 0.40f, 0.02f), matHospitalBlue);
        // Keyboard
        CreateBox("Keyboard", pc.transform, new Vector3(0, 0.02f, -0.24f), new Vector3(0.48f, 0.03f, 0.18f), matBlackPlastic);
    }

    private static void BuildOfficeChair(Transform parent, Vector3 localPos, float yRot)
    {
        GameObject chair = new GameObject("OfficeChair");
        chair.transform.SetParent(parent);
        chair.transform.localPosition = localPos;
        chair.transform.localRotation = Quaternion.Euler(0, yRot, 0);

        // Seat & Backrest
        CreateBox("Seat", chair.transform, new Vector3(0, 0.5f, 0), new Vector3(0.55f, 0.08f, 0.55f), matHospitalBlue);
        CreateBox("Backrest", chair.transform, new Vector3(0, 0.85f, -0.24f), new Vector3(0.52f, 0.65f, 0.08f), matHospitalBlue);
        // Pedestal
        GameObject stem = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        stem.name = "Stem"; stem.transform.SetParent(chair.transform);
        stem.transform.localPosition = new Vector3(0, 0.25f, 0);
        stem.transform.localScale = new Vector3(0.08f, 0.25f, 0.08f);
        stem.GetComponent<Renderer>().material = matMetalChrome;
    }

    private static void BuildWaitingChair(Transform parent, Vector3 localPos, float yRot)
    {
        GameObject chair = new GameObject("WaitingChair");
        chair.transform.SetParent(parent);
        chair.transform.localPosition = localPos;
        chair.transform.localRotation = Quaternion.Euler(0, yRot, 0);

        CreateBox("Seat", chair.transform, new Vector3(0, 0.42f, 0), new Vector3(0.58f, 0.07f, 0.52f), matHospitalBlue);
        CreateBox("Backrest", chair.transform, new Vector3(0, 0.74f, -0.22f), new Vector3(0.55f, 0.55f, 0.06f), matHospitalBlue);
        CreateBox("Leg_L", chair.transform, new Vector3(-0.25f, 0.2f, 0), new Vector3(0.04f, 0.4f, 0.42f), matMetalChrome);
        CreateBox("Leg_R", chair.transform, new Vector3(0.25f, 0.2f, 0), new Vector3(0.04f, 0.4f, 0.42f), matMetalChrome);
    }

    private static void BuildHospitalBed(Transform parent, Vector3 localPos, float yRot)
    {
        GameObject bed = new GameObject("Hospital_Bed");
        bed.transform.SetParent(parent);
        bed.transform.localPosition = localPos;
        bed.transform.localRotation = Quaternion.Euler(0, yRot, 0);

        // Bed Metal Frame
        CreateBox("Frame_Base", bed.transform, new Vector3(0, 0.35f, 0), new Vector3(1.15f, 0.12f, 2.25f), matMetalChrome);
        CreateBox("Headboard", bed.transform, new Vector3(0, 0.75f, 1.12f), new Vector3(1.15f, 0.7f, 0.08f), matMetalChrome);
        CreateBox("Footboard", bed.transform, new Vector3(0, 0.60f, -1.12f), new Vector3(1.15f, 0.4f, 0.08f), matMetalChrome);

        // Side Safety Rails
        CreateBox("Rail_Left", bed.transform, new Vector3(-0.58f, 0.65f, 0.2f), new Vector3(0.05f, 0.35f, 1.2f), matMetalChrome);
        CreateBox("Rail_Right", bed.transform, new Vector3(0.58f, 0.65f, 0.2f), new Vector3(0.05f, 0.35f, 1.2f), matMetalChrome);

        // Mattress & Clean Bed Sheet
        CreateBox("Mattress", bed.transform, new Vector3(0, 0.48f, 0), new Vector3(1.08f, 0.18f, 2.15f), matBedMattress);
        CreateBox("Clean_Sheet", bed.transform, new Vector3(0, 0.58f, -0.15f), new Vector3(1.09f, 0.04f, 1.7f), matBedSheet);

        // Raised Head Pillow
        CreateBox("Pillow", bed.transform, new Vector3(0, 0.63f, 0.85f), new Vector3(0.75f, 0.12f, 0.42f), matWhiteWall);
    }

    private static void BuildIVDripStand(Transform parent, Vector3 localPos)
    {
        GameObject stand = new GameObject("IV_Drip_Stand");
        stand.transform.SetParent(parent);
        stand.transform.localPosition = localPos;

        // Chrome Pole
        GameObject pole = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        pole.name = "Pole"; pole.transform.SetParent(stand.transform);
        pole.transform.localPosition = new Vector3(0, 1.05f, 0);
        pole.transform.localScale = new Vector3(0.05f, 1.05f, 0.05f);
        pole.GetComponent<Renderer>().material = matMetalChrome;

        // Base Caster Wheels
        CreateBox("Base_Cross", stand.transform, new Vector3(0, 0.03f, 0), new Vector3(0.6f, 0.05f, 0.6f), matMetalChrome);

        // Top Hook & Saline/IV Fluid Bag
        CreateBox("Top_Hanger", stand.transform, new Vector3(0, 2.1f, 0), new Vector3(0.35f, 0.04f, 0.04f), matMetalChrome);
        CreateBox("IV_Bag", stand.transform, new Vector3(0.12f, 1.88f, 0), new Vector3(0.12f, 0.28f, 0.08f), matBlueGlass);
    }

    private static void BuildWaterDispenser(Transform parent, Vector3 localPos)
    {
        GameObject dispenser = new GameObject("Water_Dispenser");
        dispenser.transform.SetParent(parent);
        dispenser.transform.localPosition = localPos;

        // Cabinet Base
        CreateBox("Base_Unit", dispenser.transform, new Vector3(0, 0.5f, 0), new Vector3(0.42f, 1.0f, 0.42f), matWhiteWall);
        // Taps cutout area
        CreateBox("Tap_Blue", dispenser.transform, new Vector3(-0.08f, 0.8f, -0.22f), new Vector3(0.04f, 0.06f, 0.06f), matHospitalBlue);
        CreateBox("Tap_Red", dispenser.transform, new Vector3(0.08f, 0.8f, -0.22f), new Vector3(0.04f, 0.06f, 0.06f), matRedCross);

        // Inverted Blue Water Bottle (Cylinder)
        GameObject bottle = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        bottle.name = "Water_Jug"; bottle.transform.SetParent(dispenser.transform);
        bottle.transform.localPosition = new Vector3(0, 1.25f, 0);
        bottle.transform.localScale = new Vector3(0.34f, 0.25f, 0.34f);
        bottle.GetComponent<Renderer>().material = matBlueGlass;
    }

    private static void BuildIndoorPlant(Transform parent, Vector3 localPos)
    {
        GameObject plant = new GameObject("Indoor_Plant");
        plant.transform.SetParent(parent);
        plant.transform.localPosition = localPos;

        // Terracotta Pot
        GameObject pot = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        pot.name = "Pot"; pot.transform.SetParent(plant.transform);
        pot.transform.localPosition = new Vector3(0, 0.35f, 0);
        pot.transform.localScale = new Vector3(0.55f, 0.35f, 0.55f);
        pot.GetComponent<Renderer>().material = matPlantPot;

        // Foliage Spheres
        GameObject leaves1 = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        leaves1.name = "Leaves1"; leaves1.transform.SetParent(plant.transform);
        leaves1.transform.localPosition = new Vector3(0, 0.95f, 0);
        leaves1.transform.localScale = new Vector3(0.85f, 0.95f, 0.85f);
        leaves1.GetComponent<Renderer>().material = matTreeLeaves;
    }
    #endregion

    #region Player Setup
    private static void BuildPlayer()
    {
        // Creates the first-person explorer player
        GameObject playerObj = new GameObject("Player");
        playerObj.transform.position = new Vector3(0f, 0.1f, -18f); // Facing hospital entrance
        playerObj.transform.rotation = Quaternion.identity;

        // Character Controller component
        CharacterController cc = playerObj.AddComponent<CharacterController>();
        cc.height = 1.8f;
        cc.radius = 0.42f;
        cc.center = new Vector3(0, 0.9f, 0);
        cc.stepOffset = 0.35f;
        cc.slopeLimit = 45f;

        // Camera (Eye level at Y = 1.62m)
        GameObject camObj = new GameObject("Main Camera");
        camObj.transform.SetParent(playerObj.transform);
        camObj.transform.localPosition = new Vector3(0, 1.62f, 0);
        camObj.transform.localRotation = Quaternion.identity;
        camObj.tag = "MainCamera";

        Camera cam = camObj.AddComponent<Camera>();
        cam.nearClipPlane = 0.1f;
        cam.farClipPlane = 400f;
        cam.fieldOfView = 65f;
        camObj.AddComponent<AudioListener>();

        // Attach Scripts
        PlayerController pc = playerObj.AddComponent<PlayerController>();
        pc.playerCamera = camObj.transform;
        pc.walkSpeed = 4.8f;
        pc.runSpeed = 7.5f;
        pc.lookSensitivity = 2.2f;

        InteractionSystem isys = playerObj.AddComponent<InteractionSystem>();
        isys.playerCamera = cam;
        isys.interactionDistance = 3.8f;
    }
    #endregion

    #region UI Setup
    private static void BuildUI(GameObject uiParent)
    {
        // 1. Canvas Setup
        Canvas canvas = uiParent.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 100;

        CanvasScaler scaler = uiParent.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920, 1080);
        scaler.matchWidthOrHeight = 0.5f;

        uiParent.AddComponent<GraphicRaycaster>();

        // Ensure EventSystem exists
        EnsureEventSystem();

        UIManager uiManager = uiParent.AddComponent<UIManager>();

        // 2. Crosshair / Reticle
        GameObject crosshairObj = CreateUIElement("Crosshair", uiParent.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(8, 8));
        Image crosshairImg = crosshairObj.AddComponent<Image>();
        crosshairImg.color = new Color(1f, 1f, 1f, 0.75f);
        uiManager.crosshair = crosshairObj;

        // 3. Prompt Panel (Bottom-center HUD pill)
        GameObject promptObj = CreateUIElement("PromptPanel", uiParent.transform, new Vector2(0.5f, 0.18f), new Vector2(0.5f, 0.18f), Vector2.zero, new Vector2(440, 52));
        Image promptBg = promptObj.AddComponent<Image>();
        promptBg.color = new Color(0.08f, 0.10f, 0.14f, 0.88f);

        GameObject promptTextObj = CreateUIElement("PromptText", promptObj.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        TextMeshProUGUI promptTMP = promptTextObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(promptTMP);
        promptTMP.text = "Press [E] to Interact";
        promptTMP.fontSize = 20;
        promptTMP.alignment = TextAlignmentOptions.Center;
        promptTMP.color = new Color(0.25f, 0.85f, 1.0f);
        uiManager.promptPanel = promptObj;
        uiManager.promptText = promptTMP;

        // 4. Welcome Panel
        GameObject welcomeObj = CreateUIElement("WelcomePanel", uiParent.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        Image welcomeOverlay = welcomeObj.AddComponent<Image>();
        welcomeOverlay.color = new Color(0.05f, 0.08f, 0.12f, 0.90f);

        GameObject welcomeCard = CreateUIElement("Card", welcomeObj.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(780, 560));
        Image cardBg = welcomeCard.AddComponent<Image>();
        cardBg.color = new Color(0.12f, 0.16f, 0.22f, 0.98f);

        // Header Banner
        GameObject headerBanner = CreateUIElement("HeaderBanner", welcomeCard.transform, new Vector2(0.5f, 1.0f), new Vector2(0.5f, 1.0f), new Vector2(0, -42), new Vector2(740, 68));
        Image bannerImg = headerBanner.AddComponent<Image>();
        bannerImg.color = new Color(0.08f, 0.44f, 0.76f, 1.0f);

        GameObject titleObj = CreateUIElement("TitleText", headerBanner.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        TextMeshProUGUI titleTMP = titleObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(titleTMP);
        titleTMP.text = "HEALTHBRIDGE HOSPITAL (SEHATSETU)";
        titleTMP.fontSize = 26;
        titleTMP.fontStyle = FontStyles.Bold;
        titleTMP.alignment = TextAlignmentOptions.Center;
        titleTMP.color = Color.white;

        // Welcome Description & Instructions
        GameObject welcomeBodyObj = CreateUIElement("BodyText", welcomeCard.transform, new Vector2(0.5f, 0.52f), new Vector2(0.5f, 0.52f), Vector2.zero, new Vector2(700, 310));
        TextMeshProUGUI bodyTMP = welcomeBodyObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(bodyTMP);
        bodyTMP.text =
            "Welcome to the HealthBridge 3D Hospital Environment.\n\n" +
            "HealthBridge (SehatSetu) is a modern healthcare initiative designed to provide dignified, accessible, and high-quality medical services to rural and urban communities alike.\n\n" +
            "<color=#38BDF8><b>EXPLORATION CONTROLS:</b></color>\n" +
            "•  <color=#FACC15><b>[W, A, S, D]</b></color> : Move Forward, Left, Backward, Right\n" +
            "•  <color=#FACC15><b>[Left Shift]</b></color> : Hold to Sprint\n" +
            "•  <color=#FACC15><b>[Mouse]</b></color> : Look Around\n" +
            "•  <color=#FACC15><b>[E]</b></color> : Interact with Reception, Doctor, Pharmacy & ER\n" +
            "•  <color=#FACC15><b>[ESC]</b></color> : Pause Menu / Close Dialogs";
        bodyTMP.fontSize = 19;
        bodyTMP.lineSpacing = 16f;
        bodyTMP.color = new Color(0.90f, 0.94f, 0.98f);

        // Start Exploration Button
        GameObject welcomeBtnObj = CreateButton("StartButton", welcomeCard.transform, new Vector2(0.5f, 0.1f), new Vector2(0.5f, 0.1f), Vector2.zero, new Vector2(280, 52), "START EXPLORATION", new Color(0.08f, 0.55f, 0.90f));
        uiManager.welcomePanel = welcomeObj;
        uiManager.welcomeCloseButton = welcomeBtnObj.GetComponent<Button>();

        // 5. Interaction Modal Panel
        GameObject interactObj = CreateUIElement("InteractionPanel", uiParent.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        Image interactOverlay = interactObj.AddComponent<Image>();
        interactOverlay.color = new Color(0.05f, 0.08f, 0.12f, 0.75f);

        GameObject modalCard = CreateUIElement("Card", interactObj.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(720, 500));
        Image modalBg = modalCard.AddComponent<Image>();
        modalBg.color = new Color(0.12f, 0.16f, 0.22f, 0.98f);

        // Category Badge
        GameObject badgeObj = CreateUIElement("CategoryBadge", modalCard.transform, new Vector2(0.5f, 0.91f), new Vector2(0.5f, 0.91f), Vector2.zero, new Vector2(300, 36));
        Image badgeImg = badgeObj.AddComponent<Image>();
        badgeImg.color = new Color(0.08f, 0.44f, 0.76f);

        GameObject badgeTextObj = CreateUIElement("BadgeText", badgeObj.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        TextMeshProUGUI badgeTMP = badgeTextObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(badgeTMP);
        badgeTMP.text = "PATIENT SERVICES";
        badgeTMP.fontSize = 17;
        badgeTMP.fontStyle = FontStyles.Bold;
        badgeTMP.alignment = TextAlignmentOptions.Center;
        badgeTMP.color = Color.white;

        // Title
        GameObject modalTitleObj = CreateUIElement("TitleText", modalCard.transform, new Vector2(0.5f, 0.81f), new Vector2(0.5f, 0.81f), Vector2.zero, new Vector2(660, 44));
        TextMeshProUGUI modalTitleTMP = modalTitleObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(modalTitleTMP);
        modalTitleTMP.text = "Hospital Information";
        modalTitleTMP.fontSize = 24;
        modalTitleTMP.fontStyle = FontStyles.Bold;
        modalTitleTMP.alignment = TextAlignmentOptions.Center;
        modalTitleTMP.color = Color.white;

        // Divider
        GameObject dividerObj = CreateUIElement("Divider", modalCard.transform, new Vector2(0.5f, 0.74f), new Vector2(0.5f, 0.74f), Vector2.zero, new Vector2(640, 2));
        Image divImg = dividerObj.AddComponent<Image>();
        divImg.color = new Color(0.25f, 0.35f, 0.45f);

        // Description Body Text
        GameObject descObj = CreateUIElement("DescriptionText", modalCard.transform, new Vector2(0.5f, 0.45f), new Vector2(0.5f, 0.45f), Vector2.zero, new Vector2(640, 240));
        TextMeshProUGUI descTMP = descObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(descTMP);
        descTMP.text = "Information details will appear here.";
        descTMP.fontSize = 19;
        descTMP.lineSpacing = 14f;
        descTMP.color = new Color(0.92f, 0.95f, 0.98f);

        // Close Button
        GameObject closeBtnObj = CreateButton("CloseButton", modalCard.transform, new Vector2(0.5f, 0.1f), new Vector2(0.5f, 0.1f), Vector2.zero, new Vector2(220, 48), "CLOSE [ESC]", new Color(0.20f, 0.28f, 0.36f));

        uiManager.interactionPanel = interactObj;
        uiManager.interactionTitleText = modalTitleTMP;
        uiManager.interactionCategoryText = badgeTMP;
        uiManager.interactionDescriptionText = descTMP;
        uiManager.interactionCategoryBadge = badgeImg;
        uiManager.interactionCloseButton = closeBtnObj.GetComponent<Button>();

        // 6. Pause Panel
        GameObject pauseObj = CreateUIElement("PausePanel", uiParent.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        Image pauseOverlay = pauseObj.AddComponent<Image>();
        pauseOverlay.color = new Color(0.04f, 0.06f, 0.08f, 0.88f);

        GameObject pauseCard = CreateUIElement("Card", pauseObj.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(500, 420));
        Image pauseCardBg = pauseCard.AddComponent<Image>();
        pauseCardBg.color = new Color(0.12f, 0.16f, 0.22f, 0.98f);

        GameObject pauseTitleObj = CreateUIElement("TitleText", pauseCard.transform, new Vector2(0.5f, 0.86f), new Vector2(0.5f, 0.86f), Vector2.zero, new Vector2(440, 44));
        TextMeshProUGUI pauseTitleTMP = pauseTitleObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(pauseTitleTMP);
        pauseTitleTMP.text = "EXPLORATION PAUSED";
        pauseTitleTMP.fontSize = 24;
        pauseTitleTMP.fontStyle = FontStyles.Bold;
        pauseTitleTMP.alignment = TextAlignmentOptions.Center;
        pauseTitleTMP.color = Color.white;

        GameObject resumeBtn = CreateButton("ResumeButton", pauseCard.transform, new Vector2(0.5f, 0.65f), new Vector2(0.5f, 0.65f), Vector2.zero, new Vector2(300, 48), "RESUME", new Color(0.08f, 0.55f, 0.90f));
        GameObject restartBtn = CreateButton("RestartButton", pauseCard.transform, new Vector2(0.5f, 0.48f), new Vector2(0.5f, 0.48f), Vector2.zero, new Vector2(300, 48), "RESTART EXPLORATION", new Color(0.22f, 0.30f, 0.40f));
        GameObject quitBtn = CreateButton("QuitButton", pauseCard.transform, new Vector2(0.5f, 0.31f), new Vector2(0.5f, 0.31f), Vector2.zero, new Vector2(300, 48), "QUIT TO DESKTOP", new Color(0.72f, 0.20f, 0.20f));

        uiManager.pausePanel = pauseObj;
        uiManager.pauseResumeButton = resumeBtn.GetComponent<Button>();
        uiManager.pauseRestartButton = restartBtn.GetComponent<Button>();
        uiManager.pauseQuitButton = quitBtn.GetComponent<Button>();
    }

    private static GameObject CreateUIElement(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta)
    {
        GameObject go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        RectTransform rt = go.GetComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.anchoredPosition = anchoredPos;
        rt.sizeDelta = sizeDelta;
        return go;
    }

    private static GameObject CreateButton(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta, string label, Color buttonColor)
    {
        GameObject btnObj = CreateUIElement(name, parent, anchorMin, anchorMax, anchoredPos, sizeDelta);
        Image img = btnObj.AddComponent<Image>();
        img.color = buttonColor;
        Button btn = btnObj.AddComponent<Button>();

        ColorBlock cb = btn.colors;
        cb.normalColor = buttonColor;
        cb.highlightedColor = Color.Lerp(buttonColor, Color.white, 0.25f);
        cb.pressedColor = Color.Lerp(buttonColor, Color.black, 0.2f);
        btn.colors = cb;

        GameObject textObj = CreateUIElement("Text", btnObj.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        TextMeshProUGUI tmp = textObj.AddComponent<TextMeshProUGUI>();
        ApplyFont(tmp);
        tmp.text = label;
        tmp.fontSize = 18;
        tmp.fontStyle = FontStyles.Bold;
        tmp.alignment = TextAlignmentOptions.Center;
        tmp.color = Color.white;

        return btnObj;
    }

    private static void ApplyFont(TextMeshProUGUI tmp)
    {
        if (defaultFontAsset != null)
        {
            tmp.font = defaultFontAsset;
        }
    }

    private static void EnsureEventSystem()
    {
        if (Object.FindAnyObjectByType<UnityEngine.EventSystems.EventSystem>() == null)
        {
            GameObject es = new GameObject("EventSystem");
            es.AddComponent<UnityEngine.EventSystems.EventSystem>();
            es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }
    }
    #endregion

    #region Helpers
    private static GameObject CreateBox(string name, Transform parent, Vector3 localPos, Vector3 size, Material mat)
    {
        GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
        box.name = name;
        box.transform.SetParent(parent);
        box.transform.localPosition = localPos;
        box.transform.localScale = size;
        if (mat != null)
        {
            box.GetComponent<Renderer>().material = mat;
        }
        return box;
    }

    private static void AddSceneToBuildSettings(string scenePath)
    {
        var existingScenes = EditorBuildSettings.scenes;
        foreach (var s in existingScenes)
        {
            if (s.path == scenePath) return;
        }

        var newScenes = new EditorBuildSettingsScene[existingScenes.Length + 1];
        newScenes[0] = new EditorBuildSettingsScene(scenePath, true);
        for (int i = 0; i < existingScenes.Length; i++)
        {
            newScenes[i + 1] = existingScenes[i];
        }
        EditorBuildSettings.scenes = newScenes;
    }
    #endregion
}
