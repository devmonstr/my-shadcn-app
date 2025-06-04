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
import { useSession } from '@/lib/hooks/useSession';
import { toast } from 'sonner';
import { useNotifications } from '@/lib/context/NotificationContext';

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
  const { isAuthenticated, handleLogout, sessionExpiry } = useSession();
  const { addNotification } = useNotifications();

  // Check authentication and redirect if needed
  useEffect(() => {
    const checkAuth = () => {
      const key = sessionStorage.getItem('public_key');
      if (!key) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // Fetch public key and convert to npub
  useEffect(() => {
    if (isAuthenticated) {
      const key = sessionStorage.getItem('public_key');
      setPublicKey(key);
      if (key) {
        try {
          const npub = nip19.npubEncode(key);
          setNpubKey(npub);
        } catch {
          setError('Unable to convert Public Key');
        }
      }
    }
  }, [isAuthenticated]);

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

  // Show session expiry warning
  useEffect(() => {
    if (sessionExpiry) {
      const timeUntilExpiry = sessionExpiry - Date.now();
      if (timeUntilExpiry <= 5 * 60 * 1000) { // 5 minutes
        toast.warning('Your session will expire soon. Please save your changes.');
      }
    }
  }, [sessionExpiry]);

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

    try {
      // Check for duplicate username
      const { data: existingUser, error: checkError } = await supabase
        .from('registered_users')
        .select('username')
        .eq('username', username)
        .neq('public_key', publicKey);

      if (checkError) {
        throw new Error(`Error checking username: ${checkError.message}`);
      }

      if (existingUser && existingUser.length > 0) {
        setError('This username is already taken');
        return;
      }

      // Fetch user data
      const { data, error: fetchError } = await supabase
        .from('registered_users')
        .select('username, lightning_address, relays')
        .eq('public_key', publicKey);

      if (fetchError) {
        throw new Error(`Error fetching user data: ${fetchError.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No user found with this public key');
      }

      // Store old values before updating
      const oldData = data[0];
      console.log('Profile update successful, checking for changes...');
      console.log('Old data:', oldData);
      console.log('New values:', { username, lightningAddress, relays });

      // Add notification with update details
      const updatedFields = [];
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      // Compare username
      if (oldData.username !== username) {
        console.log('Username changed:', { old: oldData.username, new: username });
        updatedFields.push('username');
        oldValues.username = oldData.username || '';
        newValues.username = username;
      }

      // Compare relays
      const oldRelays = oldData.relays || [];
      const newRelays = relays || [];
      
      if (JSON.stringify(oldRelays.sort()) !== JSON.stringify(newRelays.sort())) {
        console.log('Relays changed:', { old: oldRelays, new: newRelays });
        updatedFields.push('relays');
        oldValues.relays = oldRelays.join(', ') || 'none';
        newValues.relays = newRelays.join(', ') || 'none';
      }

      // Compare lightning address
      if (oldData.lightning_address !== lightningAddress) {
        console.log('Lightning address changed:', { old: oldData.lightning_address, new: lightningAddress });
        updatedFields.push('lightning_address');
        oldValues.lightning_address = oldData.lightning_address || 'none';
        newValues.lightning_address = lightningAddress || 'none';
      }

      console.log('Updated fields:', updatedFields);
      console.log('Old values:', oldValues);
      console.log('New values:', newValues);

      // Update profile
      const { data: updatedData, error: updateError } = await supabase
        .from('registered_users')
        .update({
          username,
          lightning_address: lightningAddress,
          relays,
          metadata_updated_at: new Date().toISOString()
        })
        .eq('public_key', publicKey)
        .select();

      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }

      if (!updatedData || updatedData.length === 0) {
        throw new Error('No user found with this public key');
      }

      if (updatedFields.length > 0) {
        console.log('Adding notification with changes...');
        addNotification(
          'profile_update',
          'Your profile has been updated successfully',
          {
            updatedFields,
            oldValues,
            newValues
          }
        );
      } else {
        console.log('No changes detected, skipping notification');
      }

      toast.success('Profile updated successfully');
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('registered_users')
        .delete()
        .eq('public_key', publicKey);

      if (error) throw error;

      addNotification(
        'profile_update',
        'Your account has been deleted'
      );
      toast.success('Account deleted successfully');
      handleLogout();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Button variant="destructive" onClick={handleLogout} className="md:hidden">
              Logout
            </Button>
          </div>

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
                  <Input value={npubKey || ''} disabled className="flex-1" />
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
                  <Input value={publicKey || ''} disabled className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(publicKey || '')}
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
                    placeholder="Enter your username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lightning">Lightning Address</Label>
                  <Input
                    id="lightning"
                    value={lightningAddress}
                    onChange={(e) => setLightningAddress(e.target.value)}
                    placeholder="Enter your Lightning address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relays</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newRelay}
                      onChange={(e) => setNewRelay(e.target.value)}
                      placeholder="Enter relay URL (wss://...)"
                    />
                    <Button type="button" onClick={handleAddRelay}>
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
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
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button type="submit">Update Profile</Button>
                  <Button type="button" variant="destructive" onClick={handleDeleteUser}>
                    Delete Account
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}