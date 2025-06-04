import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_CONCURRENT_SESSIONS = 1; // Maximum number of concurrent sessions allowed
const MAX_NIP05_REQUESTS = 10; // Maximum number of NIP-05 requests per hour
const NIP05_REQUEST_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

export function useSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [nip05Requests, setNip05Requests] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const publicKey = sessionStorage.getItem('public_key');
    const expiry = sessionStorage.getItem('session_expiry');
    const sessionId = sessionStorage.getItem('session_id');
    
    if (publicKey && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        // Verify session ID
        const storedSessionId = localStorage.getItem(`session_${publicKey}`);
        if (storedSessionId === sessionId) {
          setIsAuthenticated(true);
          setSessionExpiry(expiryTime);
        } else {
          // Invalid session ID, possible session hijacking attempt
          handleLogout();
        }
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
    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    
    // Check for existing sessions
    const existingSessionId = localStorage.getItem(`session_${publicKey}`);
    if (existingSessionId) {
      // Force logout of existing session
      localStorage.removeItem(`session_${publicKey}`);
    }

    const expiry = Date.now() + SESSION_DURATION;
    sessionStorage.setItem('public_key', publicKey);
    sessionStorage.setItem('session_expiry', expiry.toString());
    sessionStorage.setItem('session_id', sessionId);
    localStorage.setItem(`session_${publicKey}`, sessionId);
    
    setIsAuthenticated(true);
    setSessionExpiry(expiry);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Clear all session data
      const publicKey = sessionStorage.getItem('public_key');
      if (publicKey) {
        localStorage.removeItem(`session_${publicKey}`);
      }
      
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear session storage
      sessionStorage.removeItem('public_key');
      sessionStorage.removeItem('session_expiry');
      sessionStorage.removeItem('session_id');
      
      setIsAuthenticated(false);
      setSessionExpiry(null);
      
      // Redirect to login page
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const verifyNip05Address = async (username: string, publicKey: string) => {
    // Check rate limiting
    const now = Date.now();
    const lastRequestTime = localStorage.getItem('last_nip05_request');
    if (lastRequestTime) {
      const timeSinceLastRequest = now - parseInt(lastRequestTime);
      if (timeSinceLastRequest < NIP05_REQUEST_WINDOW) {
        const requests = parseInt(localStorage.getItem('nip05_requests') || '0');
        if (requests >= MAX_NIP05_REQUESTS) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        localStorage.setItem('nip05_requests', (requests + 1).toString());
      } else {
        localStorage.setItem('nip05_requests', '1');
      }
    } else {
      localStorage.setItem('nip05_requests', '1');
    }
    localStorage.setItem('last_nip05_request', now.toString());

    // Verify public key format
    if (!/^[0-9a-f]{64}$/.test(publicKey)) {
      throw new Error('Invalid public key format');
    }

    // Store mapping
    const mappings = JSON.parse(localStorage.getItem('nip05_mappings') || '{}');
    mappings[username] = publicKey;
    localStorage.setItem('nip05_mappings', JSON.stringify(mappings));

    return {
      names: {
        [username]: publicKey
      }
    };
  };

  const getNip05Mapping = (username: string) => {
    const mappings = JSON.parse(localStorage.getItem('nip05_mappings') || '{}');
    return mappings[username];
  };

  return {
    isAuthenticated,
    handleLogin,
    handleLogout,
    sessionExpiry,
    verifyNip05Address,
    getNip05Mapping,
    isLoggingOut
  };
} 