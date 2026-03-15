'use client';
import {
  Box, Typography, IconButton, Avatar,
  TextField, InputAdornment, Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChatMessage } from '@/types';
import { useAuth } from '@/lib/auth';

interface Props {
  streamId: string;
  messages: ChatMessage[];
  onSend: (message: string) => void;
}

const COLORS = ['#A78BFA', '#F9A8D4', '#6EE7B7', '#FCD34D', '#93C5FD', '#FCA5A5'];

function getColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ChatPanel({ streamId, messages, onSend }: Props) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', height: '100%',
        backgroundColor: '#0D0D14',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
          Stream Chat
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {messages.length} messages
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Be the first to chat!
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <Box key={msg.id}>
              {msg.type === 'join' || msg.type === 'leave' ? (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', py: 0.5 }}>
                  {msg.username} {msg.type === 'join' ? 'joined the stream' : 'left the stream'}
                </Typography>
              ) : msg.type === 'donation' ? (
                <Box sx={{ my: 0.5, p: 1, borderRadius: 1.5, background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <Typography variant="caption" sx={{ color: '#F9A8D4', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DiamondOutlinedIcon sx={{ fontSize: 14 }} /> {msg.username} donated ${msg.donationAmount}!
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.primary' }}>{msg.message}</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.25 }}>
                  <Avatar src={msg.avatar} sx={{ width: 22, height: 22, fontSize: '0.65rem', flexShrink: 0 }}>
                    {msg.username[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography component="span" variant="caption" fontWeight={700} sx={{ color: getColor(msg.userId), mr: 0.75 }}>
                      {msg.username}
                    </Typography>
                    <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>
                      {msg.message}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ))
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input area */}
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {user ? (
          // Logged in — show chat input
          <TextField
            fullWidth
            size="small"
            placeholder="Send a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSend} disabled={!input.trim()}
                    sx={{ color: input.trim() ? 'primary.main' : 'text.disabled' }}>
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255,255,255,0.04)', fontSize: '0.85rem' } }}
          />
        ) : (
          // Guest — locked, show sign in prompt
          <Box
            sx={{
              textAlign: 'center', py: 1.5, px: 1,
              backgroundColor: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 2,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 20, color: '#A78BFA', mb: 0.5 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Sign in to join the chat
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                component={Link}
                href="/login"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.72rem', borderColor: 'rgba(124,58,237,0.4)', color: '#A78BFA', py: 0.5 }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/register"
                size="small"
                variant="contained"
                sx={{ fontSize: '0.72rem', py: 0.5 }}
              >
                Sign Up
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}