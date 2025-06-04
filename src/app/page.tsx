'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Bitcoin, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { nip19 } from 'nostr-tools';
import { QRCodeCanvas } from 'qrcode.react';

// Add domain configuration
const NIP05_DOMAIN = process.env.NEXT_PUBLIC_NIP05_DOMAIN || 'yourdomain.com';

// QR Code with Icon component
function QRCodeWithIcon({ value, icon: Icon, color }: { value: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; color: string }) {
  return (
    <div
      className="relative w-48 h-48"
      aria-label={`QR code for ${value.startsWith('lightning:') ? 'Lightning Network' : 'Bitcoin'} donation`}
    >
      <QRCodeCanvas value={value} size={200} className="w-48 h-48" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-full p-2 shadow-sm">
          <Icon className={`w-5 h-5 ${color}`} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Reset copy feedback after 3 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate input
    if (!username || !publicKey) {
      setError('Please enter both username and Public Key');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters long and contain only letters, numbers, and underscores');
      return;
    }

    if (!publicKey.startsWith('npub')) {
      setError('Public Key must start with npub');
      return;
    }

    // Convert npub to hex
    let hexPublicKey: string;
    try {
      const { type, data } = nip19.decode(publicKey);
      if (type !== 'npub') {
        setError('Invalid Public Key format');
        return;
      }
      hexPublicKey = data as string;
    } catch {
      setError('Unable to decode Public Key');
      return;
    }

    try {
      // Call API endpoint
      const response = await fetch('/api/nip05', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          publicKey: hexPublicKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register NIP-05 address');
      return;
    }

      setMessage(`Successfully saved ${username}@${NIP05_DOMAIN}!`);
      setUsername('');
      setPublicKey('');
    } catch (error) {
      console.error('Error:', error);
      // Handle the error appropriately
      setError('An error occurred while processing your request');
    }
  };

  const handleFetchPublicKey = async () => {
    setError('');

    try {
      // Check if window.nostr exists
      if (!window.nostr) {
        setError('Please install a Nostr extension like Alby and try again');
        return;
      }

      // Fetch public key (hex)
      const hexPublicKey = await window.nostr.getPublicKey();

      if (!hexPublicKey) {
        setError('Unable to fetch Public Key');
        return;
      }

      // Convert hex to npub for display
      try {
        const npub = nip19.npubEncode(hexPublicKey);
        setPublicKey(npub);
        console.log('Fetched public_key (hex):', hexPublicKey, 'npub:', npub);
      } catch {
        setError('Unable to encode Public Key');
        return;
      }
    } catch {
      setError('Error fetching public key, please try again');
    }
  };

  const handleCopyAddress = (address: string) => {
    // Remove prefix (lightning: or bitcoin:)
    const cleanAddress = address.replace(/^(lightning:|bitcoin:)/, '');
    navigator.clipboard.writeText(cleanAddress).then(() => {
      setIsCopied(true);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 p-8 flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-8 mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 text-left">Manage NIP-05 Identity</h1>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Add NIP-05 Identity</CardTitle>
              <CardDescription>Enter your username and Public Key (npub) or fetch from Alby</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., alice"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public Key (npub)</Label>
                  <Input
                    id="publicKey"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="e.g., npub1..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Save
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={handleFetchPublicKey}>
                    Fetch Public Key from Alby
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Support the Project</CardTitle>
              <CardDescription>Donate to support our work using Lightning Network or Bitcoin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="lightning" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lightning">Lightning Network</TabsTrigger>
                  <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
                </TabsList>
                <TabsContent value="lightning">
                  <div className="flex flex-col items-center space-y-2">
                    <CardDescription className="text-center">
                      Scan QR code to donate via Lightning wallet
                    </CardDescription>
                    <QRCodeWithIcon
                      value="lightning:scruffybagpipe81@walletofsatoshi.com"
                      icon={Zap}
                      color="text-purple-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyAddress('lightning:scruffybagpipe81@walletofsatoshi.com')}
                      aria-live="polite"
                    >
                      {isCopied ? 'Copied!' : 'Copy Address'}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="bitcoin">
                  <div className="flex flex-col items-center space-y-2">
                    <CardDescription className="text-center">
                      Scan QR code to donate via Bitcoin wallet
                    </CardDescription>
                    <QRCodeWithIcon
                      value="bitcoin:bc1q5c6n4w3xgchehhfgvpsmxrwdkvjnfs8p7kend6"
                      icon={Bitcoin}
                      color="text-orange-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyAddress('bitcoin:bc1q5c6n4w3xgchehhfgvpsmxrwdkvjnfs8p7kend6')}
                      aria-live="polite"
                    >
                      {isCopied ? 'Copied!' : 'Copy Address'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}