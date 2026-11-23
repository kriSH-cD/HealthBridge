using UnityEngine;

/// <summary>
/// Attached to interactive objects in the hospital (Reception, Pharmacy, Doctor Room, Emergency, Info Desk).
/// Provides information to the player when approached and interacted with.
/// </summary>
public class HospitalInteractable : MonoBehaviour
{
    [Header("Display Information")]
    [Tooltip("The title shown at the top of the interaction panel.")]
    public string infoTitle = "Hospital Information";

    [Tooltip("Department or category (e.g., Reception, Pharmacy, Emergency).")]
    public string category = "General Services";

    [Tooltip("Detailed information displayed inside the dialog panel.")]
    [TextArea(4, 10)]
    public string infoDescription = "Welcome to HealthBridge Hospital. Our medical team is ready to serve you.";

    [Header("Interaction Settings")]
    [Tooltip("Prompt displayed on screen when player is looking at this object.")]
    public string interactionPrompt = "Press [E] to Interact";

    [Tooltip("Optional theme color for UI badge/header.")]
    public Color themeColor = new Color(0.12f, 0.53f, 0.90f); // Clean Medical Blue

    [Header("Visual Feedback (Optional)")]
    [Tooltip("Optional mesh renderer to highlight when in focus.")]
    public Renderer highlightRenderer;
    private Color originalColor;
    private Material targetMaterial;

    private void Start()
    {
        // Cache original material color if a highlight renderer is specified
        if (highlightRenderer != null)
        {
            targetMaterial = highlightRenderer.material;
            if (targetMaterial.HasProperty("_Color"))
            {
                originalColor = targetMaterial.color;
            }
        }
    }

    /// <summary>
    /// Called when the player presses the interact key (E) while focusing on this object.
    /// </summary>
    public void Interact()
    {
        if (UIManager.Instance != null)
        {
            UIManager.Instance.ShowInformation(infoTitle, category, infoDescription, themeColor);
        }
        else
        {
            Debug.Log($"[HospitalInteractable] Interacted with: {infoTitle}\n{infoDescription}");
        }
    }

    /// <summary>
    /// Called when the player starts aiming at this object.
    /// </summary>
    public void OnFocus()
    {
        if (targetMaterial != null && targetMaterial.HasProperty("_Color"))
        {
            // Light highlight tint
            targetMaterial.color = Color.Lerp(originalColor, Color.yellow, 0.35f);
        }
    }

    /// <summary>
    /// Called when the player stops aiming at this object.
    /// </summary>
    public void OnLoseFocus()
    {
        if (targetMaterial != null && targetMaterial.HasProperty("_Color"))
        {
            targetMaterial.color = originalColor;
        }
    }
}
