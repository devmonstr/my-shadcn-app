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
import { AlertCircle, Copy, Search, User, Zap, Globe, ChevronLeft, ChevronRight, Bolt, Wallet } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { nip19, Event, Filter, nip57 } from 'nostr-tools';
import { SimplePool } from 'nostr-tools/pool';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeCanvas } from 'qrcode.react';
import { encode, decode } from 'lnurl';
import { cn } from '@/lib/utils';

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
  const itemsPerPage = 9; // 3 columns x 3 rows
  const [avatars, setAvatars] = useState<{ [pubkey: string]: string }>({});
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZapAmount, setSelectedZapAmount] = useState('1000');
  const [customZapAmount, setCustomZapAmount] = useState('');
  const [zapMessage, setZapMessage] = useState('');
  const [isZapping, setIsZapping] = useState(false);
  const [zapInvoice, setZapInvoice] = useState('');
  const [zapDialogOpen, setZapDialogOpen] = useState(false);
  const [selectedZapMethod, setSelectedZapMethod] = useState('qr');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

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

  // Generate Zap invoice
  const generateZapInvoice = async (user: User, amount: string) => {
    try {
      setIsGeneratingInvoice(true);
      setInvoiceError(null);
      setZapInvoice('');

      const lightningAddress = user.lightning_address;
      if (!lightningAddress) {
        throw new Error('ผู้ใช้ไม่มี Lightning address');
      }

      // Validate amount
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('กรุณาระบุจำนวน sats ที่ถูกต้อง');
      }

      // Create Zap event
      const zapEvent = {
        kind: 9734,
        created_at: Math.floor(Date.now() / 1000),
        content: zapMessage,
        tags: [
          ['p', user.public_key],
          ['amount', amount],
          ['relays', ...(user.relays || [])],
        ],
      };

      // Get LNURL from Lightning address
      const [username, domain] = lightningAddress.split('@');
      const lnurl = `https://${domain}/.well-known/lnurlp/${username}`;
      
      toast.loading('กำลังดึงข้อมูล LNURL...', { id: 'lnurl' });
      
      // Fetch LNURL data
      const lnurlResponse = await fetch(lnurl);
      if (!lnurlResponse.ok) {
        throw new Error(`ไม่สามารถเชื่อมต่อกับ ${domain} ได้`);
      }

      const lnurlData = await lnurlResponse.json();
      toast.dismiss('lnurl');

      if (!lnurlData.callback) {
        throw new Error('ไม่พบ callback URL ในข้อมูล LNURL');
      }

      // Validate amount limits
      const minSendable = lnurlData.minSendable / 1000;
      const maxSendable = lnurlData.maxSendable / 1000;
      
      if (amountNum < minSendable || amountNum > maxSendable) {
        throw new Error(`จำนวนต้องอยู่ระหว่าง ${minSendable} - ${maxSendable} sats`);
      }

      toast.loading('กำลังสร้าง Invoice...', { id: 'invoice' });

      // Generate invoice using LNURL callback
      const amountInMillisats = amountNum * 1000;
      const invoiceResponse = await fetch(
        `${lnurlData.callback}?amount=${amountInMillisats}&nostr=${encodeURIComponent(JSON.stringify(zapEvent))}`
      );

      if (!invoiceResponse.ok) {
        throw new Error('ไม่สามารถสร้าง Invoice ได้');
      }

      const invoiceData = await invoiceResponse.json();
      toast.dismiss('invoice');

      if (!invoiceData.pr) {
        throw new Error('ไม่พบ Lightning Invoice ในการตอบกลับ');
      }

      setZapInvoice(invoiceData.pr);
      toast.success('สร้าง Invoice สำเร็จ!', {
        description: `จำนวน ${amount} sats สำหรับ ${user.username}`,
      });

    } catch (error) {
      console.error('Error generating zap invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้าง Invoice';
      setInvoiceError(errorMessage);
      toast.error('ไม่สามารถสร้าง Invoice ได้', {
        description: errorMessage,
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Handle Zap with wallet
  const handleZapWithWallet = async (user: User) => {
    const amount = selectedZapAmount === 'custom' ? customZapAmount : selectedZapAmount;
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // Check if window.nostr is available (NIP-07)
      if (window.nostr) {
        const zapEvent = {
          kind: 9734,
          created_at: Math.floor(Date.now() / 1000),
          content: zapMessage,
          tags: [
            ['p', user.public_key],
            ['amount', amount],
            ['relays', ...(user.relays || [])],
          ],
        };

        // Sign and send the Zap event using NIP-07
        const signedEvent = await window.nostr.signEvent(zapEvent);
        
        // Convert signedEvent to Event type
        const event: Event = {
          ...signedEvent,
          pubkey: await window.nostr.getPublicKey(),
        };
        
        // Send the signed event to relays
        const pool = new SimplePool();
        const relays = user.relays || ['wss://relay.damus.io'];
        await pool.publish(relays, event);
        
        toast.success(`Zapped ${amount} sats to ${user.username}!`);
      } else {
        toast.error('No Nostr wallet found. Please install a Nostr wallet extension.');
      }
    } catch (error) {
      console.error('Error sending zap with wallet:', error);
      toast.error('Failed to send zap');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

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
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm">
                                  <Zap className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-600">{user.lightning_address}</span>
                                </div>
                                <Dialog open={zapDialogOpen} onOpenChange={setZapDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center space-x-1"
                                    >
                                      <Bolt className="h-4 w-4" />
                                      <span>Zap</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                                        <span className="animate-pulse">⚡</span> Zap {user.username}
                                      </DialogTitle>
                                      <DialogDescription className="text-center">
                                        ส่ง Lightning payment ไปยัง {user.username}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label className="text-lg font-semibold flex items-center gap-2">
                                          <span className="animate-pulse">💰</span> จำนวน Satoshis
                                        </Label>
                                        <RadioGroup
                                          value={selectedZapAmount}
                                          onValueChange={setSelectedZapAmount}
                                          className="grid grid-cols-4 gap-2"
                                        >
                                          {[
                                            { value: '1000', label: '1,000' },
                                            { value: '5000', label: '5,000' },
                                            { value: '10000', label: '10,000' },
                                            { value: 'custom', label: 'Custom' }
                                          ].map((option) => (
                                            <div key={option.value}>
                                              <RadioGroupItem
                                                value={option.value}
                                                id={option.value}
                                                className="peer sr-only"
                                              />
                                              <Label
                                                htmlFor={option.value}
                                                className={cn(
                                                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                                                  "peer-data-[state=checked]:border-orange-500 [&:has([data-state=checked])]:border-orange-500",
                                                  "transition-all duration-200 hover:scale-105"
                                                )}
                                              >
                                                {option.label}
                                              </Label>
                                            </div>
                                          ))}
                                        </RadioGroup>
                                        {selectedZapAmount === 'custom' && (
                                          <Input
                                            type="number"
                                            placeholder="Enter amount in sats"
                                            value={customZapAmount}
                                            onChange={(e) => setCustomZapAmount(e.target.value)}
                                            className="mt-2"
                                            min="1"
                                          />
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-lg font-semibold flex items-center gap-2">
                                          <span className="animate-pulse">💬</span> ข้อความ (ไม่บังคับ)
                                        </Label>
                                        <Input
                                          placeholder="เพิ่มข้อความกับ Zap ของคุณ"
                                          value={zapMessage}
                                          onChange={(e) => setZapMessage(e.target.value)}
                                          className="transition-all duration-200 focus:border-orange-500 focus:ring-orange-500"
                                        />
                                      </div>
                                      <Tabs defaultValue="qr" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                          <TabsTrigger value="qr">QR Code</TabsTrigger>
                                          <TabsTrigger value="wallet">Wallet</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="qr" className="space-y-4">
                                          <div className="flex flex-col items-center space-y-4">
                                            <div className="flex justify-center p-4 bg-white rounded-lg shadow-lg">
                                              {isGeneratingInvoice ? (
                                                <div className="w-[200px] h-[200px] flex flex-col items-center justify-center space-y-4">
                                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                                                  <p className="text-sm text-gray-500">กำลังสร้าง Invoice...</p>
                                                </div>
                                              ) : zapInvoice ? (
                                                <QRCodeCanvas 
                                                  value={zapInvoice} 
                                                  size={200}
                                                  className="rounded-lg"
                                                />
                                              ) : (
                                                <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                                                  เลือกจำนวนเพื่อสร้าง invoice
                                                </div>
                                              )}
                                            </div>
                                            {invoiceError && (
                                              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-600">{invoiceError}</p>
                                              </div>
                                            )}
                                            {zapInvoice && (
                                              <div className="text-center space-y-2">
                                                <p className="text-sm text-gray-500">สแกน QR Code เพื่อจ่าย Lightning</p>
                                                <p className="text-sm font-medium">
                                                  จำนวน: {selectedZapAmount === 'custom' ? customZapAmount : selectedZapAmount} sats
                                                </p>
                                                <p className="text-sm text-gray-500 break-all">
                                                  ถึง: {user.lightning_address}
                                                </p>
                                                <div className="flex gap-2 justify-center mt-2">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(zapInvoice);
                                                      toast.success('คัดลอก Invoice แล้ว');
                                                    }}
                                                  >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    คัดลอก Invoice
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      window.open(`lightning:${zapInvoice}`, '_blank');
                                                    }}
                                                  >
                                                    <Bolt className="h-4 w-4 mr-2" />
                                                    เปิด Wallet
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <Button
                                            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => generateZapInvoice(user, selectedZapAmount === 'custom' ? customZapAmount : selectedZapAmount)}
                                            disabled={isGeneratingInvoice}
                                          >
                                            {isGeneratingInvoice ? (
                                              <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                กำลังสร้าง Invoice...
                                              </>
                                            ) : (
                                              <>
                                                <span className="animate-pulse mr-2">⚡</span> สร้าง Invoice
                                              </>
                                            )}
                                          </Button>
                                        </TabsContent>
                                        <TabsContent value="wallet" className="space-y-4">
                                          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                                            <Wallet className="h-8 w-8 text-gray-400" />
                                          </div>
                                          <Button
                                            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
                                            onClick={() => handleZapWithWallet(user)}
                                          >
                                            <span className="animate-pulse mr-2">⚡</span> Zap ด้วย Wallet
                                          </Button>
                                        </TabsContent>
                                      </Tabs>
                                    </div>
                                  </DialogContent>
                                </Dialog>
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