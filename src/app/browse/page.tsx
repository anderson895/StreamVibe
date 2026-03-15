'use client';
import {
  Box, Container, Typography, Grid, Chip, TextField, InputAdornment,
  Skeleton, FormControl, Select, MenuItem, InputLabel, Button,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import TuneIcon from '@mui/icons-material/Tune';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import StreamCard from '@/components/StreamCard';
import { Stream, STREAM_CATEGORIES } from '@/types';

export default function BrowsePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filtered, setFiltered] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('viewers');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [liveOnly, setLiveOnly] = useState(false);

  useEffect(() => {
    fetch('/api/streams')
      .then((r) => r.json())
      .then((d) => {
        setStreams(d.streams || []);
        setFiltered(d.streams || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...streams];
    if (liveOnly) result = result.filter((s) => s.isLive);
    if (category) result = result.filter((s) => s.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.hostName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
      );
    }
    if (sortBy === 'viewers') result.sort((a, b) => b.viewerCount - a.viewerCount);
    else if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === 'likes') result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    setFiltered(result);
  }, [streams, search, category, sortBy, liveOnly]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>Browse Streams</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Discover {streams.length} streams across {STREAM_CATEGORIES.length} categories
          </Typography>
        </Box>

        {/* Filters */}
        <Box
          sx={{
            display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center',
            p: 2, borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <TextField
            size="small"
            placeholder="Search streams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> }}
            sx={{ minWidth: 220 }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
              <MenuItem value="">All Categories</MenuItem>
              {STREAM_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="viewers">Most Viewers</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="likes">Most Liked</MenuItem>
            </Select>
          </FormControl>

          <Chip
            label="🔴 Live Only"
            onClick={() => setLiveOnly(!liveOnly)}
            sx={{
              cursor: 'pointer',
              ...(liveOnly
                ? { backgroundColor: '#EF4444', color: '#fff' }
                : { backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }),
            }}
          />

          <Box sx={{ ml: 'auto' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
              <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Category quick-select chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 0.5 }}>
          {STREAM_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              onClick={() => setCategory(cat === category ? '' : cat)}
              sx={{
                flexShrink: 0, cursor: 'pointer',
                ...(category === cat
                  ? { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: '#fff' }
                  : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }),
              }}
            />
          ))}
        </Box>

        {/* Results count */}
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {filtered.length} stream{filtered.length !== 1 ? 's' : ''} found
        </Typography>

        {/* Grid */}
        <Grid container spacing={2}>
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={i}>
                <Skeleton variant="rectangular" sx={{ borderRadius: 2, aspectRatio: '16/9', mb: 1 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" />
              </Grid>
            ))
            : filtered.length === 0
              ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>No streams found</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      Try adjusting your filters or search terms
                    </Typography>
                    <Button variant="outlined" onClick={() => { setSearch(''); setCategory(''); setLiveOnly(false); }}>
                      Clear Filters
                    </Button>
                  </Box>
                </Grid>
              )
              : filtered.map((stream) => (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={viewMode === 'list' ? 12 : 2} key={stream.id}>
                  <StreamCard stream={stream} />
                </Grid>
              ))
          }
        </Grid>
      </Container>
    </Box>
  );
}
