import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const publicKey = sessionStorage.getItem('public_key');
    const expiry = sessionStorage.getItem('session_expiry');
    
    if (publicKey && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        setIsAuthenticated(true);
        setSessionExpiry(expiryTime);
      } else {
        // Session expired
        handleLogout();
      }
    } else if (publicKey) {
      // If we have a public key but no expiry, set a new expiry
      handleLogin(publicKey);
    } else {
      setIsAuthenticated(false);
      setSessionExpiry(null);
    }
  }, []);

  // Update session expiry on activity
  useEffect(() => {
    if (isAuthenticated) {
      const newExpiry = Date.now() + SESSION_DURATION;
      setSessionExpiry(newExpiry);
      sessionStorage.setItem('session_expiry', newExpiry.toString());
    }
  }, [isAuthenticated]);

  // Check session expiry periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (sessionExpiry && Date.now() >= sessionExpiry) {
        handleLogout();
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionExpiry]);

  const handleLogin = (publicKey: string) => {
    const expiry = Date.now() + SESSION_DURATION;
    sessionStorage.setItem('public_key', publicKey);
    sessionStorage.setItem('session_expiry', expiry.toString());
    setIsAuthenticated(true);
    setSessionExpiry(expiry);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('public_key');
    sessionStorage.removeItem('session_expiry');
    setIsAuthenticated(false);
    setSessionExpiry(null);
    router.push('/login');
  };

  return {
    isAuthenticated,
    handleLogin,
    handleLogout,
    sessionExpiry
  };
} 