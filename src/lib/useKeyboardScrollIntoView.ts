import { useEffect } from 'react';
import { isNative } from './capacitor';

/**
 * Scrolls the focused input/textarea into view when the keyboard opens on native.
 * Works together with android:windowSoftInputMode="adjustResize" in AndroidManifest.xml.
 */
export function useKeyboardScrollIntoView() {
  useEffect(() => {
    if (!isNative()) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      // Wait for keyboard animation to finish before scrolling
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);
}
