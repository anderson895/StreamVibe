const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY!;
const BASE_URL = 'https://livepeer.studio/api';

const headers = {
  'Authorization': `Bearer ${LIVEPEER_API_KEY}`,
  'Content-Type': 'application/json',
};

// Create a new live stream
export async function createStream(name: string) {
  const res = await fetch(`${BASE_URL}/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      profiles: [
        { name: '720p', bitrate: 2000000, fps: 30, width: 1280, height: 720 },
        { name: '480p', bitrate: 1000000, fps: 30, width: 854, height: 480 },
        { name: '360p', bitrate: 500000, fps: 30, width: 640, height: 360 },
      ],
      record: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.errors?.[0] || `Livepeer error: ${res.status}`);
  }

  return res.json();
}

// Get stream details
export async function getStream(streamId: string) {
  const res = await fetch(`${BASE_URL}/stream/${streamId}`, { headers });
  if (!res.ok) throw new Error('Failed to get stream');
  return res.json();
}

// Delete/terminate a stream
export async function deleteStream(streamId: string) {
  const res = await fetch(`${BASE_URL}/stream/${streamId}`, {
    method: 'DELETE',
    headers,
  });
  return res.ok;
}

// Get playback info from Livepeer API
export async function getPlaybackInfo(playbackId: string) {
  const res = await fetch(`${BASE_URL}/playback/${playbackId}`, { headers });
  if (!res.ok) throw new Error('Failed to get playback info');
  return res.json();
}

// CORRECT Livepeer CDN URL — always use livepeercdn.studio
export function getHLSUrl(playbackId: string) {
  return `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;
}

// Get thumbnail URL
export function getThumbnailUrl(playbackId: string) {
  return `https://livepeercdn.studio/hls/${playbackId}/720p0.png`;
}

export { LIVEPEER_API_KEY };