'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const router = useRouter();
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  // Check login status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const publicKey = sessionStorage.getItem('public_key');
      if (publicKey) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  // Check lockout status
  useEffect(() => {
    const storedLockout = localStorage.getItem('login_lockout');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      if (Date.now() < lockoutTime) {
        setLockoutTime(lockoutTime);
      } else {
        localStorage.removeItem('login_lockout');
        setLockoutTime(null);
      }
    }
  }, []);

  // Focus login button on mount
  useEffect(() => {
    loginButtonRef.current?.focus();
  }, []);

  // Progress bar animation during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 100 / (10000 / 100); // 100% in 10 seconds
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleLogin = async () => {
    setError('');
    
    // Check if user is locked out
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Too many login attempts. Please try again in ${remainingTime} seconds.`);
      return;
    }

    setIsLoading(true);

    try {
      // Set timeout for login attempt
      const timeout = setTimeout(() => {
        setError('Login timed out. Please try again.');
        setIsLoading(false);
        setProgress(0);
      }, 10000); // 10 seconds

      // Check if window.nostr exists
      if (!window.nostr) {
        setError('Please install a Nostr extension like Alby and try again');
        setIsLoading(false);
        setProgress(0);
        clearTimeout(timeout);
        return;
      }

      // Get public key (hex)
      const publicKey = await window.nostr.getPublicKey();

      if (!publicKey) {
        setError('Unable to retrieve Public Key');
        setIsLoading(false);
        setProgress(0);
        clearTimeout(timeout);
        return;
      }

      // Store public key in sessionStorage
      sessionStorage.setItem('public_key', publicKey);
      console.log('Stored public_key (hex):', publicKey);

      // Reset login attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout');

      clearTimeout(timeout);
      setIsLoading(false);
      setProgress(0);

      // Redirect to Dashboard
      router.push('/dashboard');
    } catch {
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      // Implement lockout after 5 failed attempts
      if (newAttempts >= 5) {
        const lockoutDuration = 15 * 60 * 1000; // 15 minutes
        const lockoutEndTime = Date.now() + lockoutDuration;
        setLockoutTime(lockoutEndTime);
        localStorage.setItem('login_lockout', lockoutEndTime.toString());
        setError(`Too many failed attempts. Please try again in 15 minutes.`);
      } else {
        setError(`Login error. Please try again. (${5 - newAttempts} attempts remaining)`);
      }
      
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-0 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login with Nostr</CardTitle>
            <CardDescription>Use a Nostr Extension (e.g., Alby) to sign in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" aria-live="polite">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
              ref={loginButtonRef}
              aria-label={isLoading ? 'Logging in' : 'Login with Nostr'}
              aria-disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Loading" />
                  Logging in...
                </>
              ) : (
                'Login with Nostr'
              )}
            </Button>
            {isLoading && (
              <Progress value={progress} className="w-full" aria-label="Login progress" />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}