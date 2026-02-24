import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * ScrollToTopButton component
 * Toont een knop om terug naar boven te scrollen
 * - Wordt alleen zichtbaar na 300px scrollen
 * - Smooth scroll animatie
 * - Toegankelijk met keyboard en screen readers
 */
export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      scrollToTop();
    }
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          onKeyDown={handleKeyDown}
          className="fixed bottom-8 right-8 z-50 p-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Scroll naar boven"
          title="Scroll naar boven"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
