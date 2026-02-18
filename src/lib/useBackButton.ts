import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import { isNative } from './capacitor';

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackRef = useRef<number>(0);

  useEffect(() => {
    if (!isNative()) return;

    let remove: (() => void) | undefined;

    (async () => {
      const handler = await App.addListener('backButton', async ({ canGoBack }) => {
        const path = location.pathname;

        // ✅ hier bepaal je wanneer "exit gedrag" geldt
        // Gebruik startsWith zodat subroutes ook meetellen
        const isExitScreen =
          path === '/' ||
          path.startsWith('/dashboard') ||
          path.startsWith('/families') ||
          path.startsWith('/helper-families') ||
          path.startsWith('/register') ||
          path.startsWith('/login');

        if (!isExitScreen) {
          // Normaal terug navigeren binnen de app
          if (canGoBack) {
            navigate(-1);
          }
          return;
        }

        // ✅ Double tap to exit
        const now = Date.now();
        if (now - lastBackRef.current < 1200) {
          await App.exitApp();
          return;
        }

        lastBackRef.current = now;

        await Toast.show({
          text: 'Druk nogmaals op terug om de app te sluiten',
          duration: 'short',
        });
      });

      remove = () => handler.remove();
    })();

    return () => {
      remove?.();
    };
  }, [navigate, location.pathname]);
}
