import { NextRequest, NextResponse } from 'next/server';
import redis, { STREAM_KEY, STREAMS_LIST_KEY, LIVE_STREAMS_KEY } from '@/lib/redis';
import { Stream } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const liveOnly = searchParams.get('live') === 'true';
    const category = searchParams.get('category');

    const streamIds = liveOnly
      ? await redis.smembers(LIVE_STREAMS_KEY)
      : await redis.lrange(STREAMS_LIST_KEY, 0, -1);

    if (!streamIds.length) {
      return NextResponse.json({ streams: [] });
    }

    const pipeline = redis.pipeline();
    streamIds.forEach((id) => pipeline.get(STREAM_KEY(id)));
    const results = await pipeline.exec();

    let streams: Stream[] = [];
    results?.forEach(([err, val]) => {
      if (!err && val) {
        try { streams.push(JSON.parse(val as string)); } catch {}
      }
    });

    if (category) {
      streams = streams.filter((s) => s.category === category);
    }

    streams.sort((a, b) => b.viewerCount - a.viewerCount);

    return NextResponse.json({ streams });
  } catch (err) {
    console.error('GET /api/streams error:', err);
    return NextResponse.json({ streams: [], error: 'Failed to fetch streams' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, description, category, thumbnailUrl, thumbnailPublicId,
      hostId, hostName, hostAvatar, tags = [],
    } = body;

    if (!title || !category || !hostId || !hostName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = uuidv4();
    const streamKey = uuidv4().replace(/-/g, '').substring(0, 20);

    const stream: Stream = {
      id,
      title,
      description: description || '',
      category,
      thumbnailUrl: thumbnailUrl || '',
      thumbnailPublicId,
      streamKey,
      isLive: false,
      viewerCount: 0,
      hostId,
      hostName,
      hostAvatar,
      tags,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    await redis.set(STREAM_KEY(id), JSON.stringify(stream), 'EX', 86400 * 7);
    await redis.lpush(STREAMS_LIST_KEY, id);

    return NextResponse.json({ stream }, { status: 201 });
  } catch (err) {
    console.error('POST /api/streams error:', err);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}
