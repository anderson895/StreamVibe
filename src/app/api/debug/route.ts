import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET() {
  try {
    const keys = await redis.keys('*');
    const data: Record<string, any> = {};

    for (const key of keys) {
      const type = await redis.type(key);

      if (type === 'string') {
        const raw = await redis.get(key);
        try {
          data[key] = JSON.parse(raw || '');
        } catch {
          data[key] = raw;
        }
      } else if (type === 'list') {
        const items = await redis.lrange(key, 0, -1);
        data[key] = items.map((item) => {
          try { return JSON.parse(item); } catch { return item; }
        });
      } else if (type === 'set') {
        data[key] = await redis.smembers(key);
      } else if (type === 'hash') {
        data[key] = await redis.hgetall(key);
      } else if (type === 'zset') {
        data[key] = await redis.zrange(key, 0, -1, 'WITHSCORES');
      }
    }

    // Organize by category
    const organized = {
      summary: {
        total_keys: keys.length,
        keys_list: keys.sort(),
      },
      streams: Object.fromEntries(
        Object.entries(data).filter(([k]) => k.startsWith('stream:'))
      ),
      streams_index: {
        'streams:all': data['streams:all'] || [],
        'streams:live': data['streams:live'] || [],
      },
      chat: Object.fromEntries(
        Object.entries(data).filter(([k]) => k.startsWith('chat:'))
      ),
      viewers: Object.fromEntries(
        Object.entries(data).filter(([k]) => k.startsWith('viewers:'))
      ),
      raw: data,
    };

    return NextResponse.json(organized, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch Redis data', details: String(err) },
      { status: 500 }
    );
  }
}
