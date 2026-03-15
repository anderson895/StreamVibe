'use client';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, Divider, Alert, Snackbar, IconButton, Tooltip,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import { Stream, STREAM_CATEGORIES } from '@/types';



interface LivepeerInfo {
  livepeerStreamId: string;
  streamKey: string;
  rtmpUrl: string;
  playbackId: string;
  hlsUrl: string;
}

interface StreamForm {
  title: string;
  description: string;
  category: string;
  tags: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [myStreams, setMyStreams] = useState<Stream[]>([]);
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [livepeerInfo, setLivepeerInfo] = useState<LivepeerInfo | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOBSGuide, setShowOBSGuide] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const [form, setForm] = useState<StreamForm>({
    title: '', description: '', category: '', tags: '',
    thumbnailUrl: '', thumbnailPublicId: '',
  });
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user]);

  useEffect(() => { if (user) fetchMyStreams(); }, [user]);

  useEffect(() => {
    if (!activeStream?.isLive) return;
    const interval = setInterval(() => {
      setViewerCount((prev) => Math.max(0, prev + Math.floor(Math.random() * 15) - 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [activeStream]);

  async function fetchMyStreams() {
    try {
      const res = await fetch('/api/streams');
      const data = await res.json();
      // Only show streams created by this host — exact match only
      const hostStreams = (data.streams || []).filter(
        (s: Stream) => s.hostId === (user?.id || '')
      );
      setMyStreams(hostStreams);
      const live = hostStreams.find((s: Stream) => s.isLive);
      if (live) {
        setActiveStream(live);
        setViewerCount(live.viewerCount || 0);
        if (live.livepeerStreamKey) {
          setLivepeerInfo({
            livepeerStreamId: live.livepeerStreamId!,
            streamKey: live.livepeerStreamKey,
            rtmpUrl: live.livepeerRtmpUrl || 'rtmp://rtmp.livepeer.com/live',
            playbackId: live.livepeerPlaybackId!,
            hlsUrl: live.livepeerHlsUrl!,
          });
        }
      }
    } catch {}
  }

  async function handleCreateStream() {
    if (!form.title || !form.category) {
      setSnackbar({ open: true, message: 'Title and category are required', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          hostId: user?.id || '',
          hostName: user?.username || '',
        }),
      });
      const data = await res.json();
      if (data.stream) {
        setMyStreams((prev) => [data.stream, ...prev]);
        setForm({ title: '', description: '', category: '', tags: '', thumbnailUrl: '', thumbnailPublicId: '' });
        setCreating(false);
        setSnackbar({ open: true, message: 'Stream created!', severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to create stream', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoLive(stream: Stream) {
    setLoading(true);
    try {
      const res = await fetch('/api/livepeer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: stream.id, title: stream.title }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Livepeer error');

      await fetch(`/api/streams/${stream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: true }),
      });

      const updatedStream: Stream = { ...stream, isLive: true, startedAt: new Date().toISOString() };
      setActiveStream(updatedStream);
      setLivepeerInfo(data);
      setViewerCount(0);
      setMyStreams((prev) => prev.map((s) => s.id === stream.id ? updatedStream : s));
      setShowOBSGuide(true);
      setSnackbar({ open: true, message: 'Stream ready! Open OBS to start broadcasting.', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to go live', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleEndStream() {
    if (!activeStream) return;
    setLoading(true);
    try {
      if (livepeerInfo?.livepeerStreamId) {
        await fetch('/api/livepeer', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ livepeerStreamId: livepeerInfo.livepeerStreamId, streamId: activeStream.id }),
        });
      }
      await fetch(`/api/streams/${activeStream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: false }),
      });
    } catch {}
    setMyStreams((prev) => prev.map((s) => s.id === activeStream.id ? { ...s, isLive: false } : s));
    setActiveStream(null);
    setLivepeerInfo(null);
    setViewerCount(0);
    setLoading(false);
    setSnackbar({ open: true, message: 'Stream ended.', severity: 'success' });
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${label} copied!`, severity: 'success' });
  }

  const totalViewers = myStreams.reduce((a, b) => a + b.viewerCount, 0);
  const totalLikes = myStreams.reduce((a, b) => a + (b.likes || 0), 0);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Creator Dashboard</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage your streams and channel</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)} sx={{ py: 1.5, px: 3 }}>
            Create Stream
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'My Streams', value: myStreams.length, icon: <OndemandVideoIcon />, color: '#7C3AED' },
            { label: 'Total Viewers', value: totalViewers.toLocaleString(), icon: <PeopleOutlineIcon />, color: '#3B82F6' },
            { label: 'Total Likes', value: totalLikes, icon: <FavoriteOutlinedIcon />, color: '#EC4899' },
            { label: 'Live Now', value: myStreams.filter((s) => s.isLive).length, icon: <FiberManualRecordIcon />, color: '#EF4444' },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${stat.color}20`, color: stat.color }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={800}>{stat.value}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Active Stream Banner */}
        {activeStream && (
          <Card sx={{ mb: 4, border: '1px solid rgba(239,68,68,0.4) !important', background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(124,58,237,0.06)) !important' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
                  label="LIVE"
                  sx={{ backgroundColor: '#EF4444', color: '#fff', fontWeight: 700 }}
                />
                <Typography variant="h6" fontWeight={700}>{activeStream.title}</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PeopleOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="h6" fontWeight={700}>{viewerCount.toLocaleString()}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>viewers</Typography>
                </Box>
              </Box>

              <LinearProgress variant="indeterminate" sx={{ borderRadius: 2, height: 4, mb: 3 }} />

              {livepeerInfo && (
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
                      RTMP URL — paste in OBS Server field
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 1.5, px: 1.5, py: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, color: '#A78BFA', fontSize: '0.78rem' }}>
                        {livepeerInfo.rtmpUrl}
                      </Typography>
                      <Tooltip title="Copy RTMP URL">
                        <IconButton size="small" onClick={() => copy(livepeerInfo.rtmpUrl, 'RTMP URL')}>
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
                      Stream Key — paste in OBS Stream Key field
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 1.5, px: 1.5, py: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, color: '#F9A8D4', fontSize: '0.78rem' }}>
                        {'●'.repeat(28)}
                      </Typography>
                      <Tooltip title="Copy Stream Key">
                        <IconButton size="small" onClick={() => copy(livepeerInfo.streamKey, 'Stream Key')}>
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              )}

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="outlined" size="small" startIcon={<InfoOutlinedIcon />}
                  onClick={() => setShowOBSGuide(true)}
                  sx={{ borderColor: 'rgba(124,58,237,0.4)', color: '#A78BFA' }}>
                  OBS Setup Guide
                </Button>
                <Button component={Link} href={`/stream/${activeStream.id}`}
                  variant="outlined" size="small" startIcon={<VisibilityOutlinedIcon />}>
                  View Stream Page
                </Button>
                <Button onClick={handleEndStream} variant="contained" color="error"
                  size="small" startIcon={<StopIcon />} disabled={loading} sx={{ ml: 'auto' }}>
                  End Stream
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Create Stream Form */}
        {creating && (
          <Card sx={{ mb: 4, border: '1px solid rgba(124,58,237,0.3) !important' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MovieFilterOutlinedIcon sx={{ color: 'primary.light' }} /> Create New Stream
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Stream Title" placeholder="What are you streaming today?"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {STREAM_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Description"
                    placeholder="Tell viewers what to expect..."
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Tags (comma-separated)" placeholder="gaming, fps, ranked"
                    value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Thumbnail</Typography>
                  <CloudinaryUploader type="image" label="Upload stream thumbnail (1280x720 recommended)"
                    onUpload={(result) => setForm({ ...form, thumbnailUrl: result.url, thumbnailPublicId: result.publicId })} />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={() => setCreating(false)} disabled={loading}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateStream}
                      disabled={loading || !form.title || !form.category}>
                      {loading ? 'Creating...' : 'Create Stream'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* My Streams */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>My Streams</Typography>
        <Grid container spacing={2}>
          {myStreams.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 3 }}>
                <VideocamOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>No streams yet</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Create your first stream to start broadcasting
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
                  Create Your First Stream
                </Button>
              </Box>
            </Grid>
          ) : (
            myStreams.map((stream) => (
              <Grid item xs={12} md={6} lg={4} key={stream.id}>
                <Card sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ width: 80, height: 45, borderRadius: 1.5, flexShrink: 0, backgroundColor: '#1A1A24', overflow: 'hidden', position: 'relative' }}>
                      {stream.thumbnailUrl && (
                        <Box component="img" src={stream.thumbnailUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      {stream.isLive && (
                        <Chip size="small" label="LIVE" sx={{ position: 'absolute', bottom: 2, left: 2, height: 16, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#EF4444', color: '#fff' }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{stream.title}</Typography>
                      <Chip label={stream.category} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', color: '#A78BFA', backgroundColor: 'rgba(124,58,237,0.15)' }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stream.viewerCount.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FavoriteOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stream.likes || 0}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button component={Link} href={`/stream/${stream.id}`} size="small" variant="outlined" sx={{ flex: 1 }}>View</Button>
                    {!stream.isLive ? (
                      <Button size="small" variant="contained" startIcon={<WifiTetheringIcon />}
                        onClick={() => handleGoLive(stream)}
                        disabled={loading || !!activeStream} sx={{ flex: 1 }}>
                        Go Live
                      </Button>
                    ) : (
                      <Button size="small" variant="contained" color="error"
                        startIcon={<StopIcon />} onClick={handleEndStream}
                        disabled={loading} sx={{ flex: 1 }}>
                        End
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      {/* OBS Guide Dialog */}
      <Dialog open={showOBSGuide} onClose={() => setShowOBSGuide(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#13131A', border: '1px solid rgba(255,255,255,0.08)' } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LiveTvIcon sx={{ color: 'primary.light' }} /> OBS Setup Guide
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Follow these steps to broadcast live with OBS Studio:
          </Typography>
          {[
            { step: '1', title: 'Open OBS Studio', desc: 'Download free from obsproject.com if not installed' },
            { step: '2', title: 'Go to Settings → Stream', desc: 'Click the Settings gear icon in OBS' },
            { step: '3', title: 'Set Service to "Custom..."', desc: 'Select Custom from the Service dropdown' },
            { step: '4', title: 'Paste Server URL', desc: livepeerInfo?.rtmpUrl || 'rtmp://rtmp.livepeer.com/live', isCode: true, copyValue: livepeerInfo?.rtmpUrl },
            { step: '5', title: 'Paste Stream Key', desc: 'Click the copy icon from the dashboard above', isCode: false },
            { step: '6', title: 'Click Apply → Start Streaming', desc: 'Viewers will see your live stream immediately!' },
          ].map((item) => (
            <Box key={item.step} sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography variant="caption" fontWeight={800} sx={{ color: '#fff' }}>{item.step}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{item.title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: (item as any).isCode ? '#A78BFA' : 'text.secondary', fontFamily: (item as any).isCode ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
                    {item.desc}
                  </Typography>
                  {(item as any).copyValue && (
                    <IconButton size="small" onClick={() => copy((item as any).copyValue, 'RTMP URL')}>
                      <ContentCopyIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowOBSGuide(false)} variant="contained" fullWidth>
            Got it, start streaming!
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
