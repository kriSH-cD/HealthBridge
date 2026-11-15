import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { ScrollToTopButton } from '../components/ScrollToTopButton';
import { Navbar } from '../components/Navbar';
import { BrowserRouter } from 'react-router-dom';

// Simple consumer component to test hook values
const ThemeConsumer = () => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="is-dark-val">{isDark ? 'true' : 'false'}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-dark-btn" onClick={() => setTheme('dark')}>Set Dark</button>
      <button data-testid="set-light-btn" onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
};

describe('Dark Mode System (ThemeContext)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('initializes in light mode by default and saves to localStorage on toggle', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('light');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle to dark mode
    fireEvent.click(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('sehatsetu_theme')).toBe('dark');

    // Toggle back to light mode
    fireEvent.click(screen.getByTestId('toggle-btn'));

    expect(screen.getByTestId('theme-val').textContent).toBe('light');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('sehatsetu_theme')).toBe('light');
  });

  it('restores theme from localStorage if previously stored', () => {
    localStorage.setItem('sehatsetu_theme', 'dark');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('allows explicit setTheme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark-btn'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByTestId('set-light-btn'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('Navbar Theme Toggle Button', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders interactive dark mode toggle button in Navbar and toggles state on click', () => {
    render(
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <Navbar />
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('theme-toggle-btn');
    expect(toggleBtn).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click to activate dark mode
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('sehatsetu_theme')).toBe('dark');

    // Click again to deactivate dark mode
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('sehatsetu_theme')).toBe('light');
  });
});

describe('Auto Scroll To Top Button (30% scroll trigger)', () => {
  let scrollToMock;

  beforeEach(() => {
    scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders button and stays hidden when page scroll is under 30%', () => {
    // Mock dimensions: 1000px total scrollable height
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
    // scrollHeight - clientHeight = 1000px
    // 200px scrolled = 20% (< 30%)
    Object.defineProperty(window, 'pageYOffset', { value: 200, configurable: true });

    render(
      <LanguageProvider>
        <ScrollToTopButton />
      </LanguageProvider>
    );

    const btnWrapper = screen.getByTestId('scroll-to-top').parentElement;
    expect(btnWrapper).toHaveClass('opacity-0');
    expect(btnWrapper).toHaveClass('pointer-events-none');
  });

  it('becomes visible when page is scrolled 30% or more', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
    // 350px scrolled = 35% (>= 30%)
    Object.defineProperty(window, 'pageYOffset', { value: 350, configurable: true });

    render(
      <LanguageProvider>
        <ScrollToTopButton />
      </LanguageProvider>
    );

    const btnWrapper = screen.getByTestId('scroll-to-top').parentElement;
    expect(btnWrapper).toHaveClass('opacity-100');
    expect(btnWrapper).toHaveClass('pointer-events-auto');
  });

  it('dynamically reacts to scroll events crossing the 30% threshold', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 100, configurable: true }); // 10%

    render(
      <LanguageProvider>
        <ScrollToTopButton />
      </LanguageProvider>
    );

    const btn = screen.getByTestId('scroll-to-top');
    const btnWrapper = btn.parentElement;
    expect(btnWrapper).toHaveClass('opacity-0');

    // User scrolls past 30% (e.g. 400px = 40%)
    act(() => {
      Object.defineProperty(window, 'pageYOffset', { value: 400, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(btnWrapper).toHaveClass('opacity-100');

    // User scrolls back up to 15% (150px)
    act(() => {
      Object.defineProperty(window, 'pageYOffset', { value: 150, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(btnWrapper).toHaveClass('opacity-0');
  });

  it('triggers smooth scroll to top when clicked', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 500, configurable: true }); // 50%

    render(
      <LanguageProvider>
        <ScrollToTopButton />
      </LanguageProvider>
    );

    const btn = screen.getByTestId('scroll-to-top');
    fireEvent.click(btn);

    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    });
  });
});

