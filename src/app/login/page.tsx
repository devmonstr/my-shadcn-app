// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  // Check login status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const publicKey = sessionStorage.getItem('public_key');
      if (publicKey) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleLogin = async () => {
    setError('');

    try {
      // Check if window.nostr exists
      if (!window.nostr) {
        setError('Please install a Nostr extension like Alby and try again');
        return;
      }

      // Get public key (hex)
      const publicKey = await window.nostr.getPublicKey();

      if (!publicKey) {
        setError('Unable to retrieve Public Key');
        return;
      }

      // Store public key in sessionStorage
      sessionStorage.setItem('public_key', publicKey);
      console.log('Stored public_key (hex):', publicKey);

      // Redirect to Dashboard
      router.push('/dashboard');
    } catch {
      setError('Login error. Please try again.');
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleLogin} className="w-full">
              Login with Nostr
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}