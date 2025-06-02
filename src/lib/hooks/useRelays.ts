import { useState, useEffect } from 'react';
import { RelayInfo } from '../types';

export function useRelays() {
  const [relays, setRelays] = useState<RelayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Popular relays list
  const popularRelays = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://relay.nostr.bg',
    'wss://relay.nostr.land',
    'wss://relay.nostr.ws'
  ];

  // Check relay status
  const checkRelayStatus = async (url: string): Promise<RelayInfo> => {
    const startTime = Date.now();
    try {
      const ws = new WebSocket(url);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          const responseTime = Date.now() - startTime;
          ws.close();
          resolve({
            url,
            status: 'online',
            response_time: responseTime,
            last_checked: new Date().toISOString(),
            users_count: 0 // This would need to be fetched from the relay
          });
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            url,
            status: 'offline',
            response_time: 0,
            last_checked: new Date().toISOString(),
            users_count: 0
          });
        };
      });
    } catch (error) {
      return {
        url,
        status: 'offline',
        response_time: 0,
        last_checked: new Date().toISOString(),
        users_count: 0
      };
    }
  };

  // Initialize relays
  useEffect(() => {
    const initializeRelays = async () => {
      setLoading(true);
      try {
        const relayStatuses = await Promise.all(
          popularRelays.map(relay => checkRelayStatus(relay))
        );
        setRelays(relayStatuses);
      } catch (error) {
        setError('Failed to initialize relays');
      } finally {
        setLoading(false);
      }
    };

    initializeRelays();
  }, []);

  // Periodically check relay status
  useEffect(() => {
    const interval = setInterval(async () => {
      const updatedRelays = await Promise.all(
        relays.map(relay => checkRelayStatus(relay.url))
      );
      setRelays(updatedRelays);
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [relays]);

  // Get online relays
  const getOnlineRelays = () => {
    return relays.filter(relay => relay.status === 'online');
  };

  // Get fastest relays
  const getFastestRelays = (count: number = 3) => {
    return [...relays]
      .filter(relay => relay.status === 'online')
      .sort((a, b) => a.response_time - b.response_time)
      .slice(0, count);
  };

  // Add custom relay
  const addRelay = async (url: string) => {
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      throw new Error('Invalid relay URL');
    }

    const status = await checkRelayStatus(url);
    setRelays(prev => [...prev, status]);
  };

  // Remove relay
  const removeRelay = (url: string) => {
    setRelays(prev => prev.filter(relay => relay.url !== url));
  };

  return {
    relays,
    loading,
    error,
    getOnlineRelays,
    getFastestRelays,
    addRelay,
    removeRelay
  };
} 