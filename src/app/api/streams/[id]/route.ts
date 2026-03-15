import { NextRequest, NextResponse } from 'next/server';
import redis, { STREAM_KEY, LIVE_STREAMS_KEY, VIEWER_COUNT_KEY } from '@/lib/redis';
import { Stream } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await redis.get(STREAM_KEY(params.id));
    if (!raw) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }
    const stream: Stream = JSON.parse(raw);
    const viewers = await redis.get(VIEWER_COUNT_KEY(params.id));
    stream.viewerCount = parseInt(viewers || '0');
    return NextResponse.json({ stream });
  } catch {
    return NextResponse.json({ error: 'Failed to get stream' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const raw = await redis.get(STREAM_KEY(params.id));
    if (!raw) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });

    const stream: Stream = JSON.parse(raw);
    const updated = { ...stream, ...body, id: params.id };

    if (body.isLive === true && !stream.isLive) {
      updated.startedAt = new Date().toISOString();
      await redis.sadd(LIVE_STREAMS_KEY, params.id);
      await redis.set(VIEWER_COUNT_KEY(params.id), '0');
    }
    if (body.isLive === false && stream.isLive) {
      updated.endedAt = new Date().toISOString();
      await redis.srem(LIVE_STREAMS_KEY, params.id);
      await redis.del(VIEWER_COUNT_KEY(params.id));
    }

    await redis.set(STREAM_KEY(params.id), JSON.stringify(updated), 'EX', 86400 * 7);
    return NextResponse.json({ stream: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await redis.del(STREAM_KEY(params.id));
    await redis.srem(LIVE_STREAMS_KEY, params.id);
    await redis.del(VIEWER_COUNT_KEY(params.id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 });
  }
}
