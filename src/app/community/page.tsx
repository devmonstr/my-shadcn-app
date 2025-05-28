'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { nip19 } from 'nostr-tools';

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
  const [error, setError] = useState('');

  // Fetch all users
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Public Key (npub)</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Lightning Address</TableHead>
                      <TableHead>Relays</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.public_key}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatPublicKey(user.public_key)}
                        </TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.lightning_address || '-'}</TableCell>
                        <TableCell>{formatRelays(user.relays)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}