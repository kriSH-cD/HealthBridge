using UnityEngine;

/// <summary>
/// First-Person Player Controller for HealthBridge Hospital exploration.
/// Handles smooth WASD movement, mouse look, gravity, and sprint.
/// Suspends movement input while UI panels (Welcome, Interaction, Pause) are open.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement Settings")]
    [Tooltip("Normal walking speed in units/sec.")]
    public float walkSpeed = 4.5f;

    [Tooltip("Sprint speed when holding Left Shift.")]
    public float runSpeed = 7.5f;

    [Tooltip("Gravity acceleration force.")]
    public float gravity = -18f;

    [Tooltip("Jump force height in meters.")]
    public float jumpHeight = 1.2f;

    [Header("Look Settings")]
    [Tooltip("Reference to the player's camera for vertical pitching.")]
    public Transform playerCamera;

    [Tooltip("Mouse sensitivity multiplier.")]
    public float lookSensitivity = 2.0f;

    [Tooltip("Maximum upward look angle.")]
    public float maxLookUpAngle = 80f;

    [Tooltip("Maximum downward look angle.")]
    public float maxLookDownAngle = -80f;

    [Header("Head Bobbing (Visual Polish)")]
    public bool enableHeadBob = true;
    public float bobFrequency = 8.0f;
    public float bobAmount = 0.04f;

    // Internal components and state
    private CharacterController characterController;
    private float verticalRotation = 0f;
    private Vector3 velocity = Vector3.zero;
    private float defaultCameraY;
    private float bobTimer = 0f;

    private void Awake()
    {
        characterController = GetComponent<CharacterController>();

        // Auto-assign camera if not already linked
        if (playerCamera == null)
        {
            Camera cam = GetComponentInChildren<Camera>();
            if (cam != null)
            {
                playerCamera = cam.transform;
            }
        }

        if (playerCamera != null)
        {
            defaultCameraY = playerCamera.localPosition.y;
        }
    }

    private void Update()
    {
        // If UI or Pause menu is active, skip input processing
        if (UIManager.Instance != null && UIManager.Instance.IsUIBlockingInput())
        {
            // Still apply gravity so player doesn't float if dialogue opens mid-air
            ApplyGravityOnly();
            return;
        }

        HandleMouseLook();
        HandleMovement();
        HandleHeadBob();
    }

    /// <summary>
    /// Rotates the player body horizontally (yaw) and camera vertically (pitch).
    /// </summary>
    private void HandleMouseLook()
    {
        if (playerCamera == null) return;

        float mouseX = Input.GetAxis("Mouse X") * lookSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * lookSensitivity;

        // Rotate player body on the Y axis
        transform.Rotate(Vector3.up * mouseX);

        // Clamp camera vertical pitch
        verticalRotation -= mouseY;
        verticalRotation = Mathf.Clamp(verticalRotation, maxLookDownAngle, maxLookUpAngle);
        playerCamera.localRotation = Quaternion.Euler(verticalRotation, 0f, 0f);
    }

    /// <summary>
    /// Processes WASD movement, sprint, jump, and applies gravity through CharacterController.
    /// </summary>
    private void HandleMovement()
    {
        bool isGrounded = characterController.isGrounded;

        if (isGrounded && velocity.y < 0f)
        {
            // Small downward grounding pressure
            velocity.y = -2f;
        }

        // Read movement input (WASD / Arrow Keys)
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        // Determine current speed (Walk or Sprint)
        bool isRunning = Input.GetKey(KeyCode.LeftShift);
        float currentSpeed = isRunning ? runSpeed : walkSpeed;

        // Calculate direction relative to player orientation
        Vector3 move = transform.right * horizontal + transform.forward * vertical;
        if (move.magnitude > 1f) move.Normalize();

        characterController.Move(move * (currentSpeed * Time.deltaTime));

        // Jump handling
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
        }

        // Apply downward gravity
        velocity.y += gravity * Time.deltaTime;
        characterController.Move(velocity * Time.deltaTime);
    }

    /// <summary>
    /// Applies gravity alone when movement inputs are locked by menus.
    /// </summary>
    private void ApplyGravityOnly()
    {
        if (characterController.isGrounded && velocity.y < 0f)
        {
            velocity.y = -2f;
        }
        velocity.y += gravity * Time.deltaTime;
        characterController.Move(velocity * Time.deltaTime);
    }

    /// <summary>
    /// Adds a gentle camera bob while walking for immersive first-person feedback.
    /// </summary>
    private void HandleHeadBob()
    {
        if (!enableHeadBob || playerCamera == null) return;

        float moveSpeed = new Vector2(Input.GetAxis("Horizontal"), Input.GetAxis("Vertical")).magnitude;

        if (characterController.isGrounded && moveSpeed > 0.1f)
        {
            bobTimer += Time.deltaTime * bobFrequency;
            float newY = defaultCameraY + Mathf.Sin(bobTimer) * bobAmount;
            playerCamera.localPosition = new Vector3(playerCamera.localPosition.x, newY, playerCamera.localPosition.z);
        }
        else
        {
            bobTimer = 0f;
            float smoothY = Mathf.Lerp(playerCamera.localPosition.y, defaultCameraY, Time.deltaTime * 8f);
            playerCamera.localPosition = new Vector3(playerCamera.localPosition.x, smoothY, playerCamera.localPosition.z);
        }
    }
}
