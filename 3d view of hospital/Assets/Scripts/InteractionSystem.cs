using UnityEngine;

/// <summary>
/// Attached to the Player.
/// Casts a ray from the camera forward to detect nearby HospitalInteractable objects.
/// Displays on-screen HUD prompt and triggers interaction upon pressing 'E'.
/// </summary>
public class InteractionSystem : MonoBehaviour
{
    [Header("Detection Settings")]
    [Tooltip("Camera used to cast interaction raycast.")]
    public Camera playerCamera;

    [Tooltip("Maximum reach distance in meters to interact with objects.")]
    public float interactionDistance = 3.8f;

    [Tooltip("Layer mask specifying which layers can be interacted with.")]
    public LayerMask interactableLayer = ~0; // Default to all layers

    // Current focused target
    private HospitalInteractable currentInteractable;

    private void Awake()
    {
        if (playerCamera == null)
        {
            playerCamera = GetComponentInChildren<Camera>();
            if (playerCamera == null)
            {
                playerCamera = Camera.main;
            }
        }
    }

    private void Update()
    {
        // Don't interact while in pause menu or reading another modal
        if (UIManager.Instance != null && UIManager.Instance.IsUIBlockingInput())
        {
            ClearCurrentInteractable();
            return;
        }

        CheckForInteractable();
        HandleInteractionInput();
    }

    /// <summary>
    /// Casts raycast from center of camera viewport forward.
    /// </summary>
    private void CheckForInteractable()
    {
        if (playerCamera == null) return;

        Ray ray = new Ray(playerCamera.transform.position, playerCamera.transform.forward);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, interactionDistance, interactableLayer))
        {
            HospitalInteractable interactable = hit.collider.GetComponentInParent<HospitalInteractable>();

            if (interactable != null)
            {
                if (currentInteractable != interactable)
                {
                    // Switch to new target
                    if (currentInteractable != null) currentInteractable.OnLoseFocus();

                    currentInteractable = interactable;
                    currentInteractable.OnFocus();

                    if (UIManager.Instance != null)
                    {
                        UIManager.Instance.ShowPrompt(currentInteractable.interactionPrompt);
                    }
                }
                return;
            }
        }

        // Nothing detected or lost focus
        ClearCurrentInteractable();
    }

    /// <summary>
    /// Resets the current interactable state and clears prompt.
    /// </summary>
    private void ClearCurrentInteractable()
    {
        if (currentInteractable != null)
        {
            currentInteractable.OnLoseFocus();
            currentInteractable = null;

            if (UIManager.Instance != null)
            {
                UIManager.Instance.HidePrompt();
            }
        }
    }

    /// <summary>
    /// Listens for the 'E' key to trigger interaction.
    /// </summary>
    private void HandleInteractionInput()
    {
        if (currentInteractable != null && Input.GetKeyDown(KeyCode.E))
        {
            currentInteractable.Interact();
        }
    }

    private void OnDrawGizmosSelected()
    {
        if (playerCamera != null)
        {
            Gizmos.color = Color.cyan;
            Gizmos.DrawRay(playerCamera.transform.position, playerCamera.transform.forward * interactionDistance);
        }
    }
}
