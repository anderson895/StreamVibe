import { NextRequest, NextResponse } from 'next/server';
import redis, { USER_KEY } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

const USERS_EMAIL_KEY = (email: string) => `user:email:${email.toLowerCase()}`;
const USERS_USERNAME_KEY = (username: string) => `user:username:${username.toLowerCase()}`;

// Simple hash — in production use bcrypt, but for this app this is fine
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'streamvibe_salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check if email already taken
    const existingEmail = await redis.get(USERS_EMAIL_KEY(email));
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Check if username already taken
    const existingUsername = await redis.get(USERS_USERNAME_KEY(username));
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const id = uuidv4();
    const hashedPassword = await hashPassword(password);

    const user = {
      id,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      isStreamer: true,
      followers: 0,
      following: 0,
      createdAt: new Date().toISOString(),
    };

    // Store user + indexes
    await redis.set(USER_KEY(id), JSON.stringify(user), 'EX', 86400 * 365);
    await redis.set(USERS_EMAIL_KEY(email), id, 'EX', 86400 * 365);
    await redis.set(USERS_USERNAME_KEY(username), id, 'EX', 86400 * 365);

    // Return user without password
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
