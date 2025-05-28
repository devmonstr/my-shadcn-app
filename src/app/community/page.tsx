
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { nip19, Event, Filter } from 'nostr-tools';
import { SimplePool } from 'nostr-tools/pool';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  username: string;
  public_key: string;
  name: string | null;
  lightning_address: string | null;
  relays: string[] | null;
}

export default function CommunityMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [avatars, setAvatars] = useState<{ [pubkey: string]: string }>({});
  const [error, setError] = useState('');

  // Fetch all users from Supabase
  useEffect(() => {
    async function fetchUsers() {
      console.log('Fetching all users');
      const { data, error } = await supabase
        .from('registered_users')
        .select('username, public_key, name, lightning_address, relays');

      if (error) {
        console.error('Error fetching users:', error.message);
        setError('Error fetching user data');
      } else {
        setUsers(data || []);
      }
    }
    fetchUsers();
  }, []);

  // Fetch avatars from Nostr metadata
  useEffect(() => {
    if (users.length === 0) return;

    const pool = new SimplePool();
    const relays = ['wss://relay.damus.io', 'wss://nos.lol'];

    const filter: Filter = {
      kinds: [0],
      authors: users.map((user) => user.public_key),
    };

    const sub = pool.subscribe(
      relays,
      filter,
      {
        onevent(event: Event) {
          try {
            const metadata = JSON.parse(event.content);
            if (metadata.picture) {
              setAvatars((prev) => ({
                ...prev,
                [event.pubkey]: metadata.picture,
              }));
            }
          } catch (e) {
            console.error('Error parsing metadata for pubkey:', event.pubkey, e);
          }
        },
        oneose() {
          sub.close();
        },
      }
    );

    return () => {
      sub.close();
      pool.close(relays);
    };
  }, [users]);

  // Format relays as string
  const formatRelays = (relays: string[] | null) => {
    return relays && relays.length > 0 ? relays.join(', ') : '-';
  };

  // Convert public_key to npub
  const formatPublicKey = (hexKey: string) => {
    try {
      return nip19.npubEncode(hexKey);
    } catch {
      return hexKey.substring(0, 8) + '...';
    }
  };

  // Get avatar fallback (first letter of username or npub)
  const getAvatarFallback = (username: string, npub: string) => {
    return username ? username[0].toUpperCase() : npub[5]?.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">Community Members</h1>

          <Card>
            <CardHeader>
              <CardTitle>NIP-05 User List</CardTitle>
              <CardDescription>All registered members in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {users.length === 0 && !error && (
                <p className="text-sm text-gray-500">No registered users</p>
              )}
              {users.length > 0 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <Card key={user.public_key} className="max-w-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={avatars[user.public_key]} alt={user.username} />
                            <AvatarFallback>
                              {getAvatarFallback(user.username, formatPublicKey(user.public_key))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{user.username}</h3>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                              {formatPublicKey(user.public_key)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Name:</span> {user.name || '-'}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Lightning Address:</span>{' '}
                            {user.lightning_address || '-'}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Relays:</span>{' '}
                            <span className="truncate block max-w-[250px]">{formatRelays(user.relays)}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}