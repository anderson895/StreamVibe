import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Chip, IconButton, Tooltip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  hlsUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  isLive?: boolean;
  title?: string;
}

type PlayerStatus = 'loading' | 'active' | 'waiting' | 'error';

function getPlaybackId(url: string): string | null {
  const match = url.match(/\/hls\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

export default function VideoPlayer({ hlsUrl, videoUrl, thumbnailUrl, isLive = false, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [muted, setMuted] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const initPlayer = useCallback(async (src: string) => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('loading');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Non-HLS video (Cloudinary etc.)
    if (!src.includes('.m3u8') && !src.includes('livepeer')) {
      video.src = src;
      video.onloadeddata = () => setStatus('active');
      video.onerror = () => setStatus('error');
      return;
    }

    // Get playback ID and use our server-side proxy
    const playbackId = getPlaybackId(src);
    if (!playbackId) { setStatus('error'); return; }

    // Use our proxy API to avoid redirect issues
    const proxyUrl = `/api/hls-proxy?playbackId=${playbackId}`;
    console.log('[VideoPlayer] Using proxy:', proxyUrl);

    try {
      const Hls = (await import('hls.js')).default;

      // Safari native HLS
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxyUrl;
        video.onloadedmetadata = () => { setStatus('active'); video.play().catch(() => {}); };
        video.onerror = () => setStatus('waiting');
        return;
      }

      if (!Hls.isSupported()) { setStatus('error'); return; }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        startLevel: -1,
        capLevelToPlayerSize: true,
      });

      hlsRef.current = hls;
      hls.loadSource(proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[VideoPlayer] Manifest loaded!');
        setStatus('active');
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        console.warn('[VideoPlayer] HLS error:', data.type, data.details, data.fatal);
        if (data.fatal) {
          hls.destroy();
          hlsRef.current = null;
          setStatus('waiting');
        }
      });

    } catch (e) {
      console.error('[VideoPlayer] Error:', e);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const src = hlsUrl || videoUrl;
    if (!src) { setStatus('waiting'); return; }
    initPlayer(src);
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [hlsUrl, videoUrl, retryCount]);

  // Auto-retry every 8s
  useEffect(() => {
    if (status !== 'waiting' || !isLive) return;
    const timer = setTimeout(() => setRetryCount((p) => p + 1), 8000);
    return () => clearTimeout(timer);
  }, [status, isLive, retryCount]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative', paddingTop: '56.25%',
        backgroundColor: '#050508', borderRadius: 3, overflow: 'hidden',
        border: isLive ? '2px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isLive ? '0 0 40px rgba(239,68,68,0.1)' : 'none',
      }}
    >
      <video
        ref={videoRef}
        muted={muted}
        autoPlay
        playsInline
        controls={!isLive && status === 'active'}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'contain', backgroundColor: '#000',
          display: status === 'active' ? 'block' : 'none',
        }}
      />

      {status !== 'active' && thumbnailUrl && (
        <Box component="img" src={thumbnailUrl} alt={title}
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }}
        />
      )}

      {status === 'loading' && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress sx={{ color: '#7C3AED' }} size={48} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Connecting to stream...
          </Typography>
        </Box>
      )}

      {status === 'waiting' && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiberManualRecordIcon sx={{ color: '#7C3AED', fontSize: 36 }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={600} sx={{ color: '#fff', mb: 0.5 }}>
              {isLive ? 'Connecting to live stream...' : 'Stream is offline'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {isLive ? 'Auto-retrying...' : 'This stream has ended'}
            </Typography>
          </Box>
          {isLive && (
            <Tooltip title="Retry now">
              <IconButton onClick={() => setRetryCount((p) => p + 1)}
                sx={{ color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {status === 'error' && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Unable to load stream</Typography>
          <IconButton onClick={() => setRetryCount((p) => p + 1)} sx={{ color: '#A78BFA' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      )}

      {isLive && status === 'active' && (
        <Chip size="small"
          icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
          label="LIVE"
          sx={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#EF4444', color: '#fff', fontWeight: 700, zIndex: 10 }}
        />
      )}

      {isLive && status === 'active' && (
        <Box sx={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 1, zIndex: 10 }}>
          <IconButton size="small" onClick={() => setMuted(!muted)}
            sx={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            {muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={() => containerRef.current?.requestFullscreen?.()}
            sx={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}