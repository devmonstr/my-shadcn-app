declare module 'lnurl' {
  export interface LNURLResponse {
    callback: string;
    maxSendable?: number;
    minSendable?: number;
    metadata?: string;
    tag?: string;
    status?: string;
    reason?: string;
  }

  export function encode(url: string): string;
  export function decode(lnurl: string): Promise<LNURLResponse>;
} 