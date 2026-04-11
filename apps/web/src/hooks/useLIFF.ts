import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';

export const useLIFF = (liffId: string) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const initLIFF = async () => {
      try {
        await liff.init({ liffId });
        
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (idToken) {
          // Verify with backend
          const response = await api.post('/auth/line', { idToken });
          const { user, token } = response.data;
          setAuth(user, token);
          setIsReady(true);
        }
      } catch (err: any) {
        console.error('LIFF Init Error:', err);
        setError(err.message);
      }
    };

    if (liffId) {
      initLIFF();
    }
  }, [liffId, setAuth]);

  return { isReady, error, liff };
};
