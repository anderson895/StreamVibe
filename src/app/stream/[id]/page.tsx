'use client';
import {
  Box, Container, Grid, Typography, Chip, Avatar, Button,
  IconButton, Divider, Skeleton, Tooltip,
} from '@mui/material';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ChatPanel from '@/components/ChatPanel';
import VideoPlayer from '@/components/VideoPlayer';
import { Stream, ChatMessage } from '@/types';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

export default function StreamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [stream, setStream] = useState<Stream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const fetchStream = useCallback(async () => {
    try {
      const res = await fetch(`/api/streams/${id}`);
      if (!res.ok) {
        const allRes = await fetch('/api/streams');
        const allData = await allRes.json();
        const found = allData.streams?.find((s: Stream) => s.id === id);
        if (found) { setStream(found); setViewerCount(found.viewerCount); }
        return;
      }
      const data = await res.json();
      setStream(data.stream);
      setViewerCount(data.stream.viewerCount || 0);
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?streamId=${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([
        { id: '1', streamId: id, userId: 'u1', username: 'StreamFan99', message: 'This is amazing!', timestamp: new Date().toISOString(), type: 'message' },
        { id: '2', streamId: id, userId: 'u2', username: 'CoolViewer', message: 'Love this stream!', timestamp: new Date().toISOString(), type: 'message' },
      ]);
    }
  }, [id]);

  useEffect(() => {
    fetchStream();
    fetchMessages();
    const interval = setInterval(() => { fetchStream(); fetchMessages(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchStream, fetchMessages]);

  useEffect(() => {
    if (!stream?.isLive) return;
    const interval = setInterval(() => {
      setViewerCount((prev) => Math.max(0, prev + Math.floor(Math.random() * 20) - 8));
    }, 5000);
    return () => clearInterval(interval);
  }, [stream]);

  const handleSendMessage = async (msg: string) => {
    // Only logged-in users can send — guest protection (ChatPanel also enforces this in UI)
    if (!user) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      streamId: id,
      userId: user.id,
      username: user.username,
      message: msg,
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    setMessages((prev) => [...prev, newMsg]);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMsg }),
      });
    } catch {}
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={9}>
              <Skeleton variant="rectangular" sx={{ borderRadius: 2, aspectRatio: '16/9' }} />
              <Skeleton variant="text" width="60%" sx={{ mt: 2, height: 40 }} />
              <Skeleton variant="text" width="40%" />
            </Grid>
            <Grid item xs={12} md={3}>
              <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!stream) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h4">Stream not found</Typography>
          <Button component={Link} href="/" variant="contained">Go Home</Button>
        </Box>
      </Box>
    );
  }

  const hlsUrl = stream.livepeerHlsUrl || undefined;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}
          sx={{ mb: 2, color: 'text.secondary' }} size="small">
          Back
        </Button>

        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            <VideoPlayer
              hlsUrl={hlsUrl}
              videoUrl={!hlsUrl ? stream.videoUrl : undefined}
              thumbnailUrl={stream.thumbnailUrl}
              isLive={stream.isLive}
              title={stream.title}
            />

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 0.75 }}>{stream.title}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {stream.isLive && (
                      <Chip size="small"
                        icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
                        label="LIVE"
                        sx={{ backgroundColor: '#EF4444', color: '#fff', fontWeight: 700 }}
                      />
                    )}
                    <Chip label={stream.category} size="small" color="primary" />
                    {stream.tags?.map((tag) => (
                      <Chip key={tag} label={`#${tag}`} size="small"
                        sx={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }} />
                    ))}
                    {stream.isLive && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {viewerCount.toLocaleString()} watching
                        </Typography>
                      </Box>
                    )}
                    {stream.startedAt && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Started {formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title={liked ? 'Unlike' : 'Like'}>
                    <IconButton onClick={() => setLiked(!liked)} sx={{ color: liked ? 'secondary.main' : 'text.secondary' }}>
                      {liked ? <FavoriteOutlinedIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy stream link">
                    <IconButton sx={{ color: 'text.secondary' }}
                      onClick={() => navigator.clipboard.writeText(window.location.href)}>
                      <ShareOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={stream.hostAvatar} sx={{ width: 48, height: 48 }}>
                    {stream.hostName[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={700}>{stream.hostName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {stream.isLive ? `${viewerCount.toLocaleString()} watching now` : 'Currently offline'}
                    </Typography>
                  </Box>
                </Box>
                <Button variant="contained" size="small" sx={{ borderRadius: 6, px: 3 }}>Follow</Button>
              </Box>

              {stream.description && (
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', lineHeight: 1.8 }}>
                  {stream.description}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ height: { md: 'calc(100vh - 160px)' }, minHeight: 500, position: { md: 'sticky' }, top: { md: 80 } }}>
              <ChatPanel streamId={id} messages={messages} onSend={handleSendMessage} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}