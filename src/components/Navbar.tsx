'use client';
import {
  AppBar, Toolbar, Box, Typography, Button, IconButton,
  InputBase, Avatar, Menu, MenuItem, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  function handleLogout() {
    setAnchorEl(null);
    logout();
    router.push('/');
  }

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 2, px: { xs: 2, md: 3 } }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #7C3AED, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LiveTvIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #A78BFA, #F9A8D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: { xs: 'none', sm: 'block' } }}>
            StreamVibe
          </Typography>
        </Link>

        <Box sx={{ flex: 1, maxWidth: 500, mx: 'auto', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, px: 2, gap: 1, '&:hover': { border: '1px solid rgba(124,58,237,0.4)' }, '&:focus-within': { border: '1px solid #7C3AED', backgroundColor: 'rgba(124,58,237,0.05)' }, transition: 'all 0.2s' }}>
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <InputBase placeholder="Search streams, streamers..." sx={{ flex: 1, color: 'text.primary', fontSize: '0.9rem' }} />
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          <Button component={Link} href="/browse" color="inherit" size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>Browse</Button>
          {user && (
            <Button component={Link} href="/dashboard" color="inherit" size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>Dashboard</Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {!loading && (
            <>
              {user ? (
                <>
                  <Button component={Link} href="/dashboard" variant="contained" size="small" startIcon={<VideoCallOutlinedIcon />} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    Go Live
                  </Button>
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                    <Avatar src={user.avatar} sx={{ width: 34, height: 34, fontSize: '0.9rem', background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                      {user.username[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.08)', mt: 1, minWidth: 180 } }}>
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="body2" fontWeight={700}>{user.username}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    <MenuItem component={Link} href="/dashboard" onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1 }}>
                      <DashboardOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      Dashboard
                    </MenuItem>
                    <MenuItem component={Link} href="/profile" onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1 }}>
                      <PersonOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      My Profile
                    </MenuItem>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1, color: 'error.main' }}>
                      <LogoutIcon fontSize="small" />
                      Sign Out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button component={Link} href="/login" variant="outlined" size="small" sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}>Sign In</Button>
                  <Button component={Link} href="/register" variant="contained" size="small">Sign Up</Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}