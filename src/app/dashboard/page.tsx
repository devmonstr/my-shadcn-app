
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Trash2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { nip19 } from 'nostr-tools';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [username, setUsername] = useState('');
  const [lightningAddress, setLightningAddress] = useState('');
  const [relays, setRelays] = useState<string[]>([]);
  const [newRelay, setNewRelay] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [npubKey, setNpubKey] = useState('');
  const router = useRouter();

  // Fetch public key from sessionStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = sessionStorage.getItem('public_key');
      setPublicKey(key);
      if (key) {
        try {
          const npub = nip19.npubEncode(key);
          setNpubKey(npub);
        } catch {
          setError('Unable to convert Public Key');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      if (publicKey) {
        console.log('Fetching data for public_key:', publicKey);
        const { data, error } = await supabase
          .from('registered_users')
          .select('username, lightning_address, relays')
          .eq('public_key', publicKey);

        if (error) {
          console.error('Error fetching user data:', error.message);
          setError('Error fetching user data');
        } else if (data.length === 0) {
          setError('User data not found. Please register NIP-05 first.');
        } else if (data.length > 1) {
          setError('Multiple user records found. Please contact the administrator.');
        } else {
          setUsername(data[0].username || '');
          setLightningAddress(data[0].lightning_address || '');
          setRelays(Array.isArray(data[0].relays) ? data[0].relays : []);
        }
      }
    }
    fetchUserData();
  }, [publicKey]);

  const handleAddRelay = () => {
    if (!newRelay) {
      setError('Please enter a Relay URL');
      return;
    }
    if (!newRelay.match(/^wss?:\/\//)) {
      setError('Relay URL must start with wss:// or ws://');
      return;
    }
    if (relays.includes(newRelay)) {
      setError('This Relay already exists');
      return;
    }
    setRelays([...relays, newRelay]);
    setNewRelay('');
  };

  const handleRemoveRelay = (index: number) => {
    setRelays(relays.filter((_, i) => i !== index));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!username) {
      setError('Please enter a username');
      return;
    }

    if (!publicKey) {
      setError('Public Key not found. Please log in again.');
      return;
    }

    // Check for duplicate username
    console.log('Checking for duplicate username:', username);
    const { data: existingUser } = await supabase
      .from('registered_users')
      .select('username')
      .eq('username', username)
      .neq('public_key', publicKey);

    if (existingUser && existingUser.length > 0) {
      setError('This username is already taken');
      return;
    }

    // Update profile
    console.log('Updating profile for public_key:', publicKey);
    const { data, error: updateError } = await supabase
      .from('registered_users')
      .update({
        username,
        lightning_address: lightningAddress || null,
        relays: relays.length > 0 ? relays : null,
        metadata_updated_at: new Date().toISOString(),
      })
      .eq('public_key', publicKey)
      .select();

    if (updateError) {
      console.error('Update error:', updateError.message);
      setError(`Error: ${updateError.message}`);
    } else if (data && data.length > 0) {
      setMessage('Profile updated successfully!');
    } else {
      setError('Unable to update. No user found with this Public Key.');
    }
  };

  const handleDeleteUser = async () => {
    if (!publicKey) {
      setError('Public Key not found. Please log in again.');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    console.log('Deleting user with public_key:', publicKey);
    const { error: deleteError } = await supabase
      .from('registered_users')
      .delete()
      .eq('public_key', publicKey);

    if (deleteError) {
      console.error('Delete error:', deleteError.message);
      setError(`Error: ${deleteError.message}`);
    } else {
      sessionStorage.removeItem('public_key');
      router.push('/login');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('Copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    }).catch(() => {
      setError('Failed to copy');
    });
  };

  // Return null if not logged in
  if (!publicKey) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          {/* Profile Edit Form */}
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit NIP-05 Profile</CardTitle>
              <CardDescription>Manage your username and profile information</CardDescription>
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
              <div className="space-y-2">
                <Label>Public Key (npub)</Label>
                <div className="flex items-center space-x-2">
                  <Input value={npubKey} disabled className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(npubKey)}
                    aria-label="Copy npub key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Public Key (hex)</Label>
                <div className="flex items-center space-x-2">
                  <Input value={publicKey} disabled className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(publicKey)}
                    aria-label="Copy hex key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                  <Label htmlFor="lightningAddress">Lightning Address</Label>
                  <Input
                    id="lightningAddress"
                    value={lightningAddress}
                    onChange={(e) => setLightningAddress(e.target.value)}
                    placeholder="e.g., alice@getalby.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relays</Label>
                  {relays.length === 0 && (
                    <p className="text-sm text-gray-500">No relays added</p>
                  )}
                  {relays.map((relay, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={relay} disabled />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveRelay(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newRelay}
                      onChange={(e) => setNewRelay(e.target.value)}
                      placeholder="e.g., wss://relay.damus.io"
                    />
                    <Button type="button" onClick={handleAddRelay}>
                      Add
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Update
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="w-full max-w-md border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Actions in this section are irreversible</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}