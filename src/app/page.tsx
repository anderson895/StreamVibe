'use client';
import {
  Box, Typography, Container, Grid, Button, Chip, Skeleton,
  Divider, Avatar,
} from '@mui/material';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StreamCard from '@/components/StreamCard';
import { Stream, STREAM_CATEGORIES } from '@/types';

export default function HomePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchStreams();
  }, [category]);

  async function fetchStreams() {
    setLoading(true);
    try {
      const url = category ? `/api/streams?category=${category}` : '/api/streams';
      const res = await fetch(url);
      const data = await res.json();
      setStreams(data.streams || []);
    } catch {
      setStreams([]);
    } finally {
      setLoading(false);
    }
  }

  const liveStreams = streams.filter((s) => s.isLive);
  const featuredStream = liveStreams[0];
  const totalViewers = liveStreams.reduce((a, b) => a + b.viewerCount, 0);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />

      {/* Hero - Featured Stream */}
      {featuredStream && (
        <Box
          sx={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(124,58,237,0.12) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            py: { xs: 3, md: 5 },
          }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box
                  component={Link}
                  href={`/stream/${featuredStream.id}`}
                  sx={{
                    display: 'block', textDecoration: 'none',
                    borderRadius: 3, overflow: 'hidden',
                    position: 'relative', paddingTop: '56.25%',
                    backgroundColor: '#1A1A24',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.01)' },
                  }}
                >
                  {featuredStream.thumbnailUrl && (
                    <Box
                      component="img"
                      src={featuredStream.thumbnailUrl}
                      alt={featuredStream.title}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                  <Chip
                    size="small"
                    icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
                    label="LIVE"
                    sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', color: '#fff', fontWeight: 700 }}
                  />
                  <Box sx={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      {featuredStream.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <PeopleOutlineIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {featuredStream.viewerCount.toLocaleString()} watching
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box sx={{ pl: { md: 2 } }}>
                  <Chip
                    icon={<WhatshotIcon sx={{ fontSize: '16px !important', color: '#F97316 !important' }} />}
                    label="Featured Stream"
                    sx={{ mb: 2, background: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}
                  />
                  <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5, lineHeight: 1.2 }}>
                    {featuredStream.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar src={featuredStream.hostAvatar} sx={{ width: 40, height: 40 }}>
                      {featuredStream.hostName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{featuredStream.hostName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{featuredStream.category}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    {featuredStream.description || 'No description provided.'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                    {[
                      { label: 'Viewers', value: featuredStream.viewerCount.toLocaleString(), icon: <VisibilityOutlinedIcon sx={{ fontSize: 18, color: '#A78BFA' }} /> },
                      { label: 'Likes', value: (featuredStream.likes || 0).toString(), icon: <FavoriteOutlinedIcon sx={{ fontSize: 18, color: '#EC4899' }} /> },
                      { label: 'Category', value: featuredStream.category, icon: <CategoryOutlinedIcon sx={{ fontSize: 18, color: '#6EE7B7' }} /> },
                    ].map((stat) => (
                      <Box key={stat.label} sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                          {stat.icon}
                          <Typography variant="h6" fontWeight={700}>{stat.value}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    component={Link}
                    href={`/stream/${featuredStream.id}`}
                    variant="contained"
                    size="large"
                    startIcon={<LiveTvIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    Watch Now
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats bar */}
        <Box
          sx={{
            display: 'flex', gap: 4, mb: 4, p: 2,
            borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflowX: 'auto',
          }}
        >
          {[
            { label: 'Live Now', value: liveStreams.length, icon: <FiberManualRecordIcon sx={{ fontSize: 20, color: '#EF4444' }} /> },
            { label: 'Total Viewers', value: totalViewers.toLocaleString(), icon: <GroupsOutlinedIcon sx={{ fontSize: 20, color: '#3B82F6' }} /> },
            { label: 'Total Streams', value: streams.length, icon: <OndemandVideoIcon sx={{ fontSize: 20, color: '#A78BFA' }} /> },
            { label: 'Categories', value: STREAM_CATEGORIES.length, icon: <LocalOfferOutlinedIcon sx={{ fontSize: 20, color: '#6EE7B7' }} /> },
          ].map((s) => (
            <Box key={s.label} sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Category filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 0.5 }}>
          <Chip
            label="All"
            onClick={() => setCategory(null)}
            sx={{
              cursor: 'pointer',
              ...(category === null
                ? { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: '#fff' }
                : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }),
            }}
          />
          {STREAM_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setCategory(cat === category ? null : cat)}
              sx={{
                cursor: 'pointer', flexShrink: 0,
                ...(category === cat
                  ? { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: '#fff' }
                  : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }),
              }}
            />
          ))}
        </Box>

        {/* Section: Live Streams */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiberManualRecordIcon sx={{ color: '#EF4444', fontSize: 14 }} />
            <Typography variant="h6" fontWeight={700}>Live Now</Typography>
            <Chip label={liveStreams.length} size="small" sx={{ backgroundColor: '#EF4444', color: '#fff', height: 20, fontSize: '0.7rem' }} />
          </Box>
          <Button component={Link} href="/browse" size="small" endIcon={<ExploreOutlinedIcon />} sx={{ color: 'text.secondary' }}>
            View all
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 5 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={i}>
                <Skeleton variant="rectangular" sx={{ borderRadius: 2, aspectRatio: '16/9', mb: 1 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" />
              </Grid>
            ))
            : liveStreams.slice(0, 6).map((stream) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={stream.id}>
                <StreamCard stream={stream} />
              </Grid>
            ))}
        </Grid>

        {/* All Streams */}
        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ color: 'primary.light' }} />
          <Typography variant="h6" fontWeight={700}>All Streams</Typography>
        </Box>

        <Grid container spacing={2}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rectangular" sx={{ borderRadius: 2, aspectRatio: '16/9', mb: 1 }} />
                <Skeleton variant="text" width="80%" />
              </Grid>
            ))
            : streams.map((stream) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={stream.id}>
                <StreamCard stream={stream} />
              </Grid>
            ))}
        </Grid>
      </Container>
    </Box>
  );
}
