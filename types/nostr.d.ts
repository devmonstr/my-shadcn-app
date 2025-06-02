interface Nostr {
     getPublicKey(): Promise<string>;
     signEvent(event: {
       kind: number;
       created_at: number;
       content: string;
       tags: string[][];
     }): Promise<{
       id: string;
       sig: string;
       kind: number;
       created_at: number;
       content: string;
       tags: string[][];
     }>;
   }

   interface Window {
     nostr?: Nostr;
   }