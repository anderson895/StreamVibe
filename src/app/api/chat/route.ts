import { NextRequest, NextResponse } from 'next/server';
import redis, { CHAT_KEY } from '@/lib/redis';
import { ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const MAX_MESSAGES = 200;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get('streamId');
    if (!streamId) return NextResponse.json({ error: 'streamId required' }, { status: 400 });

    const raw = await redis.lrange(CHAT_KEY(streamId), 0, MAX_MESSAGES - 1);
    const messages: ChatMessage[] = raw.map((r) => JSON.parse(r)).reverse();
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { streamId, userId, username, avatar, message, type = 'message', donationAmount } = body;

    if (!streamId || !userId || !username || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const chatMessage: ChatMessage = {
      id: uuidv4(),
      streamId,
      userId,
      username,
      avatar,
      message,
      type,
      donationAmount,
      timestamp: new Date().toISOString(),
    };

    await redis.lpush(CHAT_KEY(streamId), JSON.stringify(chatMessage));
    await redis.ltrim(CHAT_KEY(streamId), 0, MAX_MESSAGES - 1);
    await redis.expire(CHAT_KEY(streamId), 86400);

    return NextResponse.json({ message: chatMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
