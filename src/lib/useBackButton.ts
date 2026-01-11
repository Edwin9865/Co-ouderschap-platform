import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { isNative } from './capacitor';

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNative()) return;

    const handler = App.addListener('backButton', ({ canGoBack }) => {
      const rootPaths = ['/dashboard', '/helper-families', '/families'];
      const isOnRootPath = rootPaths.includes(location.pathname);

      if (!canGoBack || isOnRootPath) {
        App.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, [navigate, location]);
}
