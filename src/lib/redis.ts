import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL!;

let redis: Redis;

declare global {
  var _redis: Redis | undefined;
}

if (process.env.NODE_ENV === 'production') {
  redis = new Redis(REDIS_URL);
} else {
  if (!global._redis) {
    global._redis = new Redis(REDIS_URL);
  }
  redis = global._redis;
}

export default redis;

// Helper: Stream keys
export const STREAM_KEY = (id: string) => `stream:${id}`;
export const STREAMS_LIST_KEY = 'streams:all';
export const LIVE_STREAMS_KEY = 'streams:live';
export const CHAT_KEY = (streamId: string) => `chat:${streamId}`;
export const VIEWER_COUNT_KEY = (streamId: string) => `viewers:${streamId}`;
export const USER_KEY = (id: string) => `user:${id}`;
