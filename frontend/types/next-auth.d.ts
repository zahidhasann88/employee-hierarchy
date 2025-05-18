import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      username?: string;
      role?: 'admin' | 'manager' | 'user';
    } & DefaultSession['user'];
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    role?: 'admin' | 'manager' | 'user';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    role?: 'admin' | 'manager' | 'user';
  }
} 