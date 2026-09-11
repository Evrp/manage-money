import { useEffect, useState } from "react";
import liff from "@line/liff";
import { useAuthStore } from "../store/auth.store";
import api from "../services/api";

export const useLIFF = (liffId: string) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const initLIFF = async () => {
      try {
        // Vite sets MODE to "development" when NODE_ENV=development. Do not
        // expose this bypass through a client-controlled environment variable.
        if (import.meta.env.MODE === "development") {
          const response = await api.post("/auth/development");
          const { user, accessToken } = response.data;
          setAuth(user, accessToken);
          setIsReady(true);
          return;
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (idToken) {
          // Verify with backend
          const response = await api.post("/auth/line", { idToken });
          const { user, accessToken } = response.data; // Backend returns accessToken
          setAuth(user, accessToken);
          setIsReady(true);
        }
      } catch (err: any) {
        console.error("LIFF Init Error:", err);

        // If it's an authentication error (expired token), force clear everything
        if (err.response?.status === 401 || err.message?.includes("expired")) {
          liff.logout();
          localStorage.removeItem("auth-storage");
          liff.login();
        } else {
          setError(err.message);
        }
      }
    };

    if (import.meta.env.MODE === "development" || liffId) {
      initLIFF();
    }
  }, [liffId, setAuth]);

  return { isReady, error, liff };
};
