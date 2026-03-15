import { NextRequest, NextResponse } from 'next/server';
import { createStream, deleteStream, getStream, getHLSUrl } from '@/lib/livepeer';
import redis, { STREAM_KEY, LIVE_STREAMS_KEY } from '@/lib/redis';
import { Stream } from '@/types';

// POST /api/livepeer — Create live stream
export async function POST(req: NextRequest) {
  try {
    const { streamId, title } = await req.json();

    if (!streamId) {
      return NextResponse.json({ error: 'streamId is required' }, { status: 400 });
    }

    // Create Livepeer stream
    const stream = await createStream(title || `Stream ${streamId}`);

    const livepeerStreamId = stream.id;
    const playbackId = stream.playbackId;
    const streamKey = stream.streamKey;
    const rtmpUrl = 'rtmp://rtmp.livepeer.com/live';
    const hlsUrl = getHLSUrl(playbackId);

    // Update Redis with Livepeer data
    const raw = await redis.get(STREAM_KEY(streamId));
    if (raw) {
      const redisStream: Stream = JSON.parse(raw);
      const updated = {
        ...redisStream,
        livepeerStreamId,
        livepeerPlaybackId: playbackId,
        livepeerStreamKey: streamKey,
        livepeerRtmpUrl: rtmpUrl,
        livepeerHlsUrl: hlsUrl,
        isLive: true,
        startedAt: new Date().toISOString(),
      };
      await redis.set(STREAM_KEY(streamId), JSON.stringify(updated), 'EX', 86400 * 7);
      await redis.sadd(LIVE_STREAMS_KEY, streamId);
    }

    return NextResponse.json({
      success: true,
      livepeerStreamId,
      playbackId,
      streamKey,
      rtmpUrl,
      hlsUrl,
    });
  } catch (err: any) {
    console.error('Livepeer create error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create Livepeer stream' },
      { status: 500 }
    );
  }
}

// DELETE /api/livepeer — End live stream
export async function DELETE(req: NextRequest) {
  try {
    const { livepeerStreamId, streamId } = await req.json();

    if (livepeerStreamId) {
      await deleteStream(livepeerStreamId);
    }

    if (streamId) {
      const raw = await redis.get(STREAM_KEY(streamId));
      if (raw) {
        const stream: Stream = JSON.parse(raw);
        const updated = {
          ...stream,
          isLive: false,
          endedAt: new Date().toISOString(),
          livepeerStreamId: null,
          livepeerStreamKey: null,
        };
        await redis.set(STREAM_KEY(streamId), JSON.stringify(updated), 'EX', 86400 * 7);
        await redis.srem(LIVE_STREAMS_KEY, streamId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Livepeer delete error:', err);
    return NextResponse.json({ error: 'Failed to end stream' }, { status: 500 });
  }
}

// GET /api/livepeer?livepeerStreamId=xxx — Get stream status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const livepeerStreamId = searchParams.get('livepeerStreamId');

    if (!livepeerStreamId) {
      return NextResponse.json({ error: 'livepeerStreamId required' }, { status: 400 });
    }

    const stream = await getStream(livepeerStreamId);

    return NextResponse.json({
      id: stream.id,
      isActive: stream.isActive,
      playbackId: stream.playbackId,
      hlsUrl: getHLSUrl(stream.playbackId),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get stream status' }, { status: 500 });
  }
}
