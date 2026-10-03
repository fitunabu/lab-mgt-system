import type { DefaultSession, DefaultUser } from 'next-auth';

export type AppUserRole = 'ADMIN' | 'TECHNICAL_ASSISTANT' | 'TEACHER';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: AppUserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User extends DefaultUser {
    id: string;
    role: AppUserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: AppUserRole;
  }
}
