import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/api/chat')) {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(sessionCookie.value, secret);
      
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-email', payload.email as string);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/chat/:path*',
};