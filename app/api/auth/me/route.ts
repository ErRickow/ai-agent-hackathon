import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  const sessionCookie = cookies().get('session');

  if (!sessionCookie) {
    return NextResponse.json({ user: null });
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie.value, secret);

    return NextResponse.json({ user: { id: payload.userId, email: payload.email } });

  } catch (error) {
    // Jika token tidak valid, anggap tidak login
    return NextResponse.json({ user: null });
  }
}