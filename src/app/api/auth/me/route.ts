import { NextRequest, NextResponse } from 'next/server';
import redis, { USER_KEY, STREAM_KEY, STREAMS_LIST_KEY } from '@/lib/redis';

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
      await redis.del(USERS_USERNAME_KEY(existing.username));
      await redis.set(USERS_USERNAME_KEY(username), id, 'EX', 86400 * 365);
    }

    const newUsername = username || existing.username;
    const newAvatar = avatar !== undefined ? avatar : existing.avatar;

    const updated = {
      ...existing,
      username: newUsername,
      bio: bio !== undefined ? bio : existing.bio,
      avatar: newAvatar,
    };

    await redis.set(USER_KEY(id), JSON.stringify(updated), 'EX', 86400 * 365);

    // Update hostName + hostAvatar on ALL streams owned by this user
    const allStreamIds = await redis.lrange(STREAMS_LIST_KEY, 0, -1);
    if (allStreamIds.length > 0) {
      const pipeline = redis.pipeline();
      allStreamIds.forEach((sid) => pipeline.get(STREAM_KEY(sid)));
      const results = await pipeline.exec();

      const updatePipeline = redis.pipeline();
      let hasUpdates = false;

      results?.forEach(([err, val], i) => {
        if (err || !val) return;
        try {
          const stream = JSON.parse(val as string);
          if (stream.hostId !== id) return;

          const updatedStream = {
            ...stream,
            hostName: newUsername,
            hostAvatar: newAvatar || stream.hostAvatar,
          };
          updatePipeline.set(
            STREAM_KEY(allStreamIds[i]),
            JSON.stringify(updatedStream),
            'EX',
            86400 * 7
          );
          hasUpdates = true;
        } catch {}
      });

      if (hasUpdates) await updatePipeline.exec();
    }

    // Return without password
    const { password: _, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}