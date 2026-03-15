'use client';
import {
  Box, Container, Grid, Card, CardContent, Typography, TextField,
  Button, Avatar, Divider, Alert, Snackbar, Chip, Skeleton,
  IconButton, Tooltip,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import { useAuth } from '@/lib/auth';
import { Stream } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();
  const [myStreams, setMyStreams] = useState<Stream[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '', avatar: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user]);

  // Load streams
  useEffect(() => {
    if (!user) return;
    setForm({ username: user.username, bio: (user as any).bio || '', avatar: user.avatar || '' });
    fetchMyStreams();
  }, [user]);

  async function fetchMyStreams() {
    try {
      const res = await fetch('/api/streams');
      const data = await res.json();
      const mine = (data.streams || []).filter((s: Stream) => s.hostId === user?.id);
      setMyStreams(mine);
    } catch {}
    finally { setStreamsLoading(false); }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, username: form.username, bio: form.bio, avatar: form.avatar }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSnackbar({ open: true, message: data.error || 'Failed to save', severity: 'error' });
        return;
      }
      // Update auth context + localStorage instantly — no reload needed
      updateUser(data.user);
      setForm({ username: data.user.username, bio: data.user.bio || '', avatar: data.user.avatar || '' });
      setSnackbar({ open: true, message: 'Profile updated!', severity: 'success' });
      setEditing(false);
    } catch {
      setSnackbar({ open: true, message: 'Failed to save changes', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!user) return;
    setForm({ username: user.username, bio: (user as any).bio || '', avatar: user.avatar || '' });
    setEditing(false);
  }

  if (authLoading || !user) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        </Container>
      </Box>
    );
  }

  const totalViewers = myStreams.reduce((a, b) => a + b.viewerCount, 0);
  const totalLikes = myStreams.reduce((a, b) => a + (b.likes || 0), 0);
  const liveCount = myStreams.filter((s) => s.isLive).length;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* Profile Header Card */}
        <Card sx={{ mb: 3, border: '1px solid rgba(255,255,255,0.08)', overflow: 'visible' }}>
          {/* Banner */}
          <Box sx={{ height: 120, background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #3B82F6 100%)', borderRadius: '12px 12px 0 0' }} />

          <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative', mt: -5 }}>
                <Avatar
                  src={editing ? form.avatar : user.avatar}
                  sx={{
                    width: 90, height: 90,
                    fontSize: '2rem', fontWeight: 700,
                    border: '4px solid #13131A',
                    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                  }}
                >
                  {user.username[0]?.toUpperCase()}
                </Avatar>
                {liveCount > 0 && (
                  <Chip
                    size="small"
                    icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: '#fff !important' }} />}
                    label="LIVE"
                    sx={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#EF4444', color: '#fff', fontWeight: 700, height: 18, fontSize: '0.6rem' }}
                  />
                )}
              </Box>

              {/* Edit / Save buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editing ? (
                  <>
                    <Button variant="outlined" size="small" startIcon={<CancelOutlinedIcon />}
                      onClick={handleCancel} disabled={saving}
                      sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}>
                      Cancel
                    </Button>
                    <Button variant="contained" size="small" startIcon={<SaveOutlinedIcon />}
                      onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />}
                    onClick={() => setEditing(true)}
                    sx={{ borderColor: 'rgba(124,58,237,0.4)', color: '#A78BFA' }}>
                    Edit Profile
                  </Button>
                )}
              </Box>
            </Box>

            {editing ? (
              /* Edit mode */
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Username" size="small"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    helperText="3-20 characters"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Bio" size="small" multiline rows={3}
                    placeholder="Tell viewers about yourself..."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    inputProps={{ maxLength: 200 }}
                    helperText={`${form.bio.length}/200`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Profile Picture</Typography>
                  {/* Preview new avatar immediately after upload */}
                  {form.avatar && (
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={form.avatar} sx={{ width: 56, height: 56, background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                        {user.username[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: '#6EE7B7' }}>
                        ✓ New photo ready — click Save Changes to apply
                      </Typography>
                    </Box>
                  )}
                  <CloudinaryUploader
                    type="image"
                    label="Upload profile picture"
                    onUpload={(result) => setForm({ ...form, avatar: result.url })}
                  />
                </Grid>
              </Grid>
            ) : (
              /* View mode */
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>{user.username}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Joined {format(new Date(user.createdAt), 'MMMM yyyy')}
                    </Typography>
                  </Box>
                </Box>
                {(user as any).bio ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                    {(user as any).bio}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                    No bio yet — click Edit Profile to add one
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Streams', value: myStreams.length, icon: <VideocamOutlinedIcon />, color: '#7C3AED' },
            { label: 'Total Viewers', value: totalViewers.toLocaleString(), icon: <VisibilityOutlinedIcon />, color: '#3B82F6' },
            { label: 'Total Likes', value: totalLikes, icon: <FavoriteOutlinedIcon />, color: '#EC4899' },
            { label: 'Live Now', value: liveCount, icon: <FiberManualRecordIcon />, color: '#EF4444' },
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

        {/* My Streams */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>My Streams</Typography>

        {streamsLoading ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : myStreams.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 3 }}>
            <VideocamOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No streams yet</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Go to your dashboard to create your first stream
            </Typography>
            <Button component={Link} href="/dashboard" variant="contained">Go to Dashboard</Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {myStreams.map((stream) => (
              <Grid item xs={12} sm={6} md={4} key={stream.id}>
                <Card
                  component={Link}
                  href={`/stream/${stream.id}`}
                  sx={{ textDecoration: 'none', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(124,58,237,0.2)' } }}
                >
                  {/* Thumbnail */}
                  <Box sx={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#1A1A24' }}>
                    {stream.thumbnailUrl && (
                      <Box component="img" src={stream.thumbnailUrl}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {stream.isLive && (
                      <Chip size="small"
                        icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: '#fff !important' }} />}
                        label="LIVE"
                        sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', color: '#fff', fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>

                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>{stream.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={stream.category} size="small"
                        sx={{ height: 18, fontSize: '0.65rem', color: '#A78BFA', backgroundColor: 'rgba(124,58,237,0.15)' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <VisibilityOutlinedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stream.viewerCount}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <FavoriteOutlinedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stream.likes || 0}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatDistanceToNow(new Date(stream.createdAt), { addSuffix: true })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

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