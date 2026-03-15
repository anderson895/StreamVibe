export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  thumbnailPublicId?: string;
  videoUrl?: string;
  videoPublicId?: string;
  streamKey: string;
  isLive: boolean;
  viewerCount: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  tags: string[];
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  peakViewers?: number;
  likes?: number;

  // Livepeer fields
  livepeerStreamId?: string | null;
  livepeerPlaybackId?: string;
  livepeerStreamKey?: string | null;
  livepeerRtmpUrl?: string;
  livepeerHlsUrl?: string;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'donation';
  donationAmount?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  followers: number;
  following: number;
  isStreamer: boolean;
  createdAt: string;
}

export type StreamCategory =
  | 'Gaming'
  | 'Music'
  | 'Just Chatting'
  | 'Art & Creative'
  | 'Sports'
  | 'Education'
  | 'Technology'
  | 'Cooking'
  | 'Travel'
  | 'Fitness'
  | 'Other';

export const STREAM_CATEGORIES: StreamCategory[] = [
  'Gaming',
  'Music',
  'Just Chatting',
  'Art & Creative',
  'Sports',
  'Education',
  'Technology',
  'Cooking',
  'Travel',
  'Fitness',
  'Other',
];
