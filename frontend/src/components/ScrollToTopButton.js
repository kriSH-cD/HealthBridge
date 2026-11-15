import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ScrollToTopButton = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const docElement = document.documentElement;
      const body = document.body;
      const scrollTop = window.pageYOffset || docElement.scrollTop || body.scrollTop || 0;
      const scrollHeight = Math.max(
        docElement.scrollHeight - docElement.clientHeight,
        body.scrollHeight - docElement.clientHeight,
        0
      );

      if (scrollHeight <= 0) {
        setIsVisible(false);
        setScrollProgress(0);
        return;
      }

      const progress = (scrollTop / scrollHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))));

      // Appears when 30% or more of the page is scrolled
      setIsVisible(progress >= 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const label = t('scroll_to_top') || 'Scroll to top';

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ease-in-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-8 scale-75 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={label}
        title={`${label} (${scrollProgress}%)`}
        data-testid="scroll-to-top"
        className="relative group flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl dark:shadow-blue-900/40 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200 active:scale-95 cursor-pointer"
      >
        {/* Circular SVG scroll progress indicator ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-blue-400/30 dark:text-blue-300/20"
            fill="none"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-white drop-shadow"
            fill="none"
            strokeDasharray={125.66} // 2 * pi * 20
            strokeDashoffset={125.66 - (125.66 * scrollProgress) / 100}
            strokeLinecap="round"
          />
        </svg>

        {/* Up Arrow Icon */}
        <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-1 relative z-10" />

        {/* Tooltip on hover */}
        <span className="absolute bottom-full mb-2 hidden sm:group-hover:block bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium py-1 px-2.5 rounded-md shadow-md whitespace-nowrap pointer-events-none border border-slate-700">
          {label} ({scrollProgress}%)
        </span>
      </button>
    </div>
  );
};

