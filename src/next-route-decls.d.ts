declare module 'next/server' {
  export class NextRequest {
    json(): Promise<any>;
  }
  export class NextResponse {
    static json(body: any, init?: { status?: number }): any;
  }
}

declare module '@/auth' {
  export interface SessionUser {
    id: string;
    email?: string;
    name?: string;
  }
  export interface Session {
    user?: SessionUser;
  }
  export function auth(): Promise<Session | null>;
}

declare module '@/lib/prisma' {
  import { Shop, ThemeConfig } from '@prisma/client';

  export interface DecimalMock {
    mul(val: number): DecimalMock;
    sub(val: any): DecimalMock;
    lt(val: any): boolean;
    gt(val: any): boolean;
    toNumber(): number;
  }

  export interface Service {
    id: string;
    shopId: string;
    isActive: boolean;
    price: DecimalMock;
    duration: number;
  }

  export interface Booking {
    id: string;
    shopId: string;
    customerId: string;
    serviceId: string;
    staffId: string | null;
    bookingDate: Date;
    startTime: string;
    endTime: string;
    totalAmount: any;
    advanceAmount: any;
    paymentStatus: string;
    status: string;
  }

  export interface EscrowTransaction {
    id: string;
    bookingId: string;
    amount: DecimalMock;
    platformFee: DecimalMock;
    netAmount: DecimalMock;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    status: string;
  }

  export interface WalletTransaction {
    id: string;
  }

  export interface ShopWallet {
    id: string;
    balance: DecimalMock | any;
    reservedBalance: DecimalMock | any;
  }

  export interface WithdrawalRequest {
    id: string;
    shopId: string;
    amount: DecimalMock | any;
    status: string;
  }

  export interface TxClient {
    booking: {
      update(args: {
        where: { id: string };
        data: { paymentStatus: string; status: string };
      }): Promise<Booking>;
    };
    escrowTransaction: {
      create(args: {
        data: {
          bookingId: string;
          amount: any;
          platformFee: any;
          netAmount: any;
          razorpayOrderId: string;
          razorpayPaymentId: string;
          status: string;
        };
      }): Promise<EscrowTransaction>;
      update(args: {
        where: { id: string };
        data: { status: string; releasedAt?: Date };
      }): Promise<EscrowTransaction>;
    };
    shopWallet: {
      update(args: {
        where: { id: string };
        data: {
          balance: { increment: any } | any;
          totalEarned: { increment: any } | any;
        };
      }): Promise<ShopWallet>;
    };
    walletTransaction: {
      create(args: {
        data: {
          shopWalletId: string;
          escrowId: string;
          type: string;
          amount: any;
          description: string;
        };
      }): Promise<WalletTransaction>;
    };
  }

  export const prisma: {
    $transaction<T>(arg: any[] | ((tx: TxClient) => Promise<T>)): Promise<T | any>;
    shop: {
      findUnique(args: { where: { subdomain: string } }): Promise<Shop | null>;
    };
    shopWallet: {
      findUnique(args: { where: { shopId: string } }): Promise<ShopWallet | null>;
      update(args: { where: { id: string }; data: { balance: { decrement: any } | any } | any }): any;
    };
    withdrawalRequest: {
      create(args: { data: { shopId: string; amount: any; status: string; [key: string]: any } }): Promise<WithdrawalRequest>;
    };
    service: {
      findFirst(args: { where: { id: string; shopId: string; isActive: boolean } }): Promise<Service | null>;
    };
    booking: {
      findMany(args?: any): Promise<any[]>;
      findFirst(args: {
        where: {
          shopId: string;
          staffId?: string;
          bookingDate: Date;
          startTime: string;
          status: { in: string[] };
        };
      }): Promise<Booking | null>;
      create(args: {
        data: {
          shopId: string;
          customerId: string;
          serviceId: string;
          staffId: string | null;
          bookingDate: Date;
          startTime: string;
          endTime: string;
          totalAmount: any;
          advanceAmount: any;
          paymentStatus: string;
          status: string;
        };
      }): Promise<Booking>;
    };
  };
}

declare module 'razorpay' {
  export default class Razorpay {
    constructor(config: { key_id: string; key_secret: string });
    orders: {
      create(options: {
        amount: number;
        currency: string;
        receipt?: string;
      }): Promise<{ id: string }>;
    };
  }
}

declare module 'next/link' {
  import { ComponentType, AnchorHTMLAttributes } from 'react';
  const Link: ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;
  export default Link;
}

declare module 'next/navigation' {
  export function usePathname(): string;
  export function useRouter(): any;
  export function useSearchParams(): any;
}

declare module 'next/image' {
  import { ComponentType, ImgHTMLAttributes } from 'react';
  interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
  }
  const Image: ComponentType<ImageProps>;
  export default Image;
}

