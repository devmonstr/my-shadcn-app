interface Nostr {
     getPublicKey(): Promise<string>;
   }

   interface Window {
     nostr?: Nostr;
   }