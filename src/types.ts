export interface AppConfig {
  title: string;
  name: string;
  dedication?: string;
  envelopeEnabled: boolean;
  envelopeText: string;
  envelopePhoto: string;
  polaroidEnabled: boolean;
  guestPassword?: string;
  guestAccessEnabled?: boolean;
  guestAccessUsed?: boolean;
  guestSessionId?: string;
  cardLocked?: boolean;
}

export interface DBItem {
  id: string;
  base64Data: string;
  order: number;
  text?: string;
}

export type AdminRole = 'master' | 'guest' | null;
