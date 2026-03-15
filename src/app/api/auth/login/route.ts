import { NextRequest, NextResponse } from 'next/server';
import redis, { USER_KEY } from '@/lib/redis';

const USERS_EMAIL_KEY = (email: string) => `user:email:${email.toLowerCase()}`;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'streamvibe_salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Look up user by email
    const userId = await redis.get(USERS_EMAIL_KEY(email));
    if (!userId) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const raw = await redis.get(USER_KEY(userId));
    if (!raw) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = JSON.parse(raw);
    const hashedPassword = await hashPassword(password);

    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return user without password
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
