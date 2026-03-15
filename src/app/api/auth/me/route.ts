import { NextRequest, NextResponse } from 'next/server';
import redis, { USER_KEY } from '@/lib/redis';

const USERS_USERNAME_KEY = (username: string) => `user:username:${username.toLowerCase()}`;

export async function PATCH(req: NextRequest) {
  try {
    const { id, username, bio, avatar } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const raw = await redis.get(USER_KEY(id));
    if (!raw) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = JSON.parse(raw);

    // If username changed, check availability and update index
    if (username && username !== existing.username) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
      }
      const taken = await redis.get(USERS_USERNAME_KEY(username));
      if (taken && taken !== id) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
      // Remove old username index, add new one
      await redis.del(USERS_USERNAME_KEY(existing.username));
      await redis.set(USERS_USERNAME_KEY(username), id, 'EX', 86400 * 365);
    }

    const updated = {
      ...existing,
      username: username || existing.username,
      bio: bio !== undefined ? bio : existing.bio,
      avatar: avatar !== undefined ? avatar : existing.avatar,
    };

    await redis.set(USER_KEY(id), JSON.stringify(updated), 'EX', 86400 * 365);

    // Return without password
    const { password: _, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}