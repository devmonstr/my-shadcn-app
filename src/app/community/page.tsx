'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Search, User, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { nip19, Event, Filter } from 'nostr-tools';
import { SimplePool } from 'nostr-tools/pool';
import { toast } from 'sonner';

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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [avatars, setAvatars] = useState<{ [pubkey: string]: string }>({});
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all users from Supabase
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('registered_users')
          .select('username, public_key, name, lightning_address, relays');

        if (error) throw error;

        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Error fetching user data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Search functionality
  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.public_key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Fetch avatars from Nostr metadata
  useEffect(() => {
    if (users.length === 0) return;

    const pool = new SimplePool();
    const relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band', 'wss://relay.nostr.bg', 'wss://relay.nostr.land', 'wss://relay.nostr.ws'];

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

  // Copy to clipboard function
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Members</h1>
              <p className="text-gray-500 mt-1">Discover and connect with other Nostr users</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>NIP-05 User List</CardTitle>
              <CardDescription>
                {filteredUsers.length} {filteredUsers.length === 1 ? 'member' : 'members'} registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {currentUsers.map((user) => (
                      <Card
                        key={user.public_key}
                        className="group hover:shadow-lg transition-shadow duration-200"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={avatars[user.public_key]} alt={user.username} />
                              <AvatarFallback>
                                {getAvatarFallback(user.username, formatPublicKey(user.public_key))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold truncate">{user.username}</h3>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyToClipboard(formatPublicKey(user.public_key), 'Public key')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {formatPublicKey(user.public_key)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {user.name && (
                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">{user.name}</span>
                              </div>
                            )}
                            {user.lightning_address && (
                              <div className="flex items-center text-sm">
                                <span className="text-gray-600">{user.lightning_address}</span>
                              </div>
                            )}
                            {user.relays && user.relays.length > 0 && (
                              <div className="flex items-start text-sm">
                                <Globe className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                                <div className="flex flex-wrap gap-1">
                                  {user.relays.map((relay, index) => {
                                    const domain = relay.replace('wss://', '');
                                    const withoutRelay = domain.replace('relay.', '');
                                    const [mainName, extension] = withoutRelay.split('.');

                                    return (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs hover:opacity-80 transition-opacity bg-blue-100 text-blue-800 hover:bg-blue-200"
                                      >
                                        {mainName}.{extension}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-8">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-1">
                        {[...Array(totalPages)].map((_, index) => (
                          <Button
                            key={index}
                            variant={currentPage === index + 1 ? "default" : "outline"}
                            size="icon"
                            onClick={() => handlePageChange(index + 1)}
                            className="w-8 h-8"
                          >
                            {index + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}