'use client';
import {
  Card, CardContent, CardMedia, Box, Typography, Chip, Avatar, IconButton,
} from '@mui/material';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Link from 'next/link';
import { Stream } from '@/types';

interface Props {
  stream: Stream;
}

export default function StreamCard({ stream }: Props) {
  return (
    <Card
      component={Link}
      href={`/stream/${stream.id}`}
      sx={{
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px rgba(124,58,237,0.2)',
        },
      }}
    >
      {/* Thumbnail */}
      <Box sx={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#1A1A24' }}>
        {stream.thumbnailUrl ? (
          <CardMedia
            component="img"
            image={stream.thumbnailUrl}
            alt={stream.title}
            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(135deg, #1E1030, #13131A)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 48 }}>📺</Typography>
          </Box>
        )}

        {/* LIVE badge */}
        {stream.isLive && (
          <Chip
            size="small"
            icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
            label="LIVE"
            sx={{
              position: 'absolute', top: 8, left: 8,
              backgroundColor: '#EF4444', color: '#fff',
              fontWeight: 700, fontSize: '0.7rem',
              height: 22,
            }}
          />
        )}

        {/* Viewer count */}
        <Chip
          size="small"
          icon={<PeopleOutlineIcon sx={{ fontSize: '14px !important', color: 'rgba(255,255,255,0.8) !important' }} />}
          label={stream.viewerCount.toLocaleString()}
          sx={{
            position: 'absolute', bottom: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)',
            fontSize: '0.75rem',
            height: 22,
          }}
        />
      </Box>

      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Avatar
            src={stream.hostAvatar}
            sx={{ width: 36, height: 36, flexShrink: 0, mt: 0.25 }}
          >
            {stream.hostName[0]?.toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ color: 'text.primary', mb: 0.25 }}
            >
              {stream.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {stream.hostName}
            </Typography>
            <Chip
              label={stream.category}
              size="small"
              sx={{
                mt: 0.5,
                height: 18,
                fontSize: '0.65rem',
                backgroundColor: 'rgba(124,58,237,0.15)',
                color: '#A78BFA',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
