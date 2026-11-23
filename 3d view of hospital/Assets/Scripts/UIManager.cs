using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// Central UI Manager for HealthBridge Hospital.
/// Controls Welcome, Interaction, Pause, and HUD Prompt panels, as well as cursor lock states.
/// </summary>
public class UIManager : MonoBehaviour
{
    public static UIManager Instance { get; private set; }

    [Header("Panels")]
    [Tooltip("Welcome banner shown at game start.")]
    public GameObject welcomePanel;

    [Tooltip("Dialog modal displayed when interacting with hospital elements.")]
    public GameObject interactionPanel;

    [Tooltip("Pause menu toggled with Escape.")]
    public GameObject pausePanel;

    [Tooltip("HUD prompt banner indicating [E] to interact.")]
    public GameObject promptPanel;

    [Tooltip("Center screen reticle / crosshair.")]
    public GameObject crosshair;

    [Header("Interaction Modal Fields")]
    public TextMeshProUGUI interactionTitleText;
    public TextMeshProUGUI interactionCategoryText;
    public TextMeshProUGUI interactionDescriptionText;
    public Image interactionCategoryBadge;
    public Button interactionCloseButton;

    [Header("Prompt Fields")]
    public TextMeshProUGUI promptText;

    [Header("Welcome Fields")]
    public Button welcomeCloseButton;

    [Header("Pause Fields")]
    public Button pauseResumeButton;
    public Button pauseRestartButton;
    public Button pauseQuitButton;

    // State flags
    private bool isPaused = false;
    private bool isInteractionOpen = false;
    private bool isWelcomeOpen = false;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    private void Start()
    {
        // Hook up button listeners if assigned
        if (interactionCloseButton != null)
            interactionCloseButton.onClick.AddListener(CloseInformation);

        if (welcomeCloseButton != null)
            welcomeCloseButton.onClick.AddListener(CloseWelcomePanel);

        if (pauseResumeButton != null)
            pauseResumeButton.onClick.AddListener(ResumeGame);

        if (pauseRestartButton != null)
            pauseRestartButton.onClick.AddListener(RestartGame);

        if (pauseQuitButton != null)
            pauseQuitButton.onClick.AddListener(QuitGame);

        // Initial UI visibility
        if (interactionPanel != null) interactionPanel.SetActive(false);
        if (pausePanel != null) pausePanel.SetActive(false);
        if (promptPanel != null) promptPanel.SetActive(false);

        // Show welcome panel on start if available
        if (welcomePanel != null)
        {
            welcomePanel.SetActive(true);
            isWelcomeOpen = true;
            SetCursorLocked(false);
        }
        else
        {
            SetCursorLocked(true);
        }
    }

    private void Update()
    {
        // Listen for Escape key
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            if (isWelcomeOpen)
            {
                CloseWelcomePanel();
            }
            else if (isInteractionOpen)
            {
                CloseInformation();
            }
            else
            {
                TogglePause();
            }
        }
    }

    /// <summary>
    /// Displays the detailed hospital information dialog.
    /// </summary>
    public void ShowInformation(string title, string category, string description, Color themeColor)
    {
        if (interactionPanel == null) return;

        if (interactionTitleText != null) interactionTitleText.text = title;
        if (interactionCategoryText != null) interactionCategoryText.text = category.ToUpper();
        if (interactionDescriptionText != null) interactionDescriptionText.text = description;
        if (interactionCategoryBadge != null) interactionCategoryBadge.color = themeColor;

        interactionPanel.SetActive(true);
        isInteractionOpen = true;
        HidePrompt();

        // Release cursor for UI interaction
        SetCursorLocked(false);
    }

    /// <summary>
    /// Closes the hospital information dialog.
    /// </summary>
    public void CloseInformation()
    {
        if (interactionPanel != null) interactionPanel.SetActive(false);
        isInteractionOpen = false;

        // Restore gameplay cursor if not paused
        if (!isPaused && !isWelcomeOpen)
        {
            SetCursorLocked(true);
        }
    }

    /// <summary>
    /// Closes the initial welcome screen.
    /// </summary>
    public void CloseWelcomePanel()
    {
        if (welcomePanel != null) welcomePanel.SetActive(false);
        isWelcomeOpen = false;

        if (!isPaused && !isInteractionOpen)
        {
            SetCursorLocked(true);
        }
    }

    /// <summary>
    /// Displays a HUD prompt (e.g. "Press [E] to talk to Receptionist").
    /// </summary>
    public void ShowPrompt(string text)
    {
        if (isInteractionOpen || isPaused || isWelcomeOpen) return;

        if (promptText != null) promptText.text = text;
        if (promptPanel != null) promptPanel.SetActive(true);
    }

    /// <summary>
    /// Hides the HUD interaction prompt.
    /// </summary>
    public void HidePrompt()
    {
        if (promptPanel != null) promptPanel.SetActive(false);
    }

    /// <summary>
    /// Toggles the Pause menu.
    /// </summary>
    public void TogglePause()
    {
        isPaused = !isPaused;
        Time.timeScale = isPaused ? 0f : 1f;

        if (pausePanel != null) pausePanel.SetActive(isPaused);

        SetCursorLocked(!isPaused);
    }

    public void ResumeGame()
    {
        if (isPaused) TogglePause();
    }

    public void RestartGame()
    {
        Time.timeScale = 1f;
        UnityEngine.SceneManagement.SceneManager.LoadScene(UnityEngine.SceneManagement.SceneManager.GetActiveScene().buildIndex);
    }

    public void QuitGame()
    {
        Debug.Log("[UIManager] Quitting application...");
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit();
#endif
    }

    /// <summary>
    /// Controls whether the mouse cursor is locked and hidden for FPS view, or free for UI.
    /// </summary>
    public void SetCursorLocked(bool locked)
    {
        if (locked)
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            if (crosshair != null) crosshair.SetActive(true);
        }
        else
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
            if (crosshair != null) crosshair.SetActive(false);
        }
    }

    public bool IsUIBlockingInput()
    {
        return isPaused || isInteractionOpen || isWelcomeOpen;
    }

    public bool IsPaused() => isPaused;
    public bool IsInteractionOpen() => isInteractionOpen;
}
