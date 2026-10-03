import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/laboratories/:path*', '/reservations/:path*', '/requests/:path*', '/inspections/:path*', '/reports/:path*', '/users/:path*'],
};

