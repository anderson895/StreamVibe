'use client';
import {
  Box, Button, Typography, LinearProgress, Alert, Paper, Chip,
  CircularProgress,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VideoFileOutlinedIcon from '@mui/icons-material/VideoFileOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { useState, useRef, useCallback } from 'react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Stream_Upload';

interface UploadResult {
  publicId: string;
  url: string;
  resourceType: 'video' | 'image';
}

interface Props {
  onUpload: (result: UploadResult) => void;
  type: 'video' | 'image';
  label?: string;
}

export default function CloudinaryUploader({ onUpload, type, label }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!CLOUD_NAME) {
      setError('Cloudinary cloud name not configured');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', type === 'video' ? 'stream-recordings' : 'stream-thumbnails');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        const result: UploadResult = {
          publicId: data.public_id,
          url: data.secure_url,
          resourceType: type,
        };
        setUploaded(result);
        onUpload(result);
      } else {
        setError('Upload failed. Please try again.');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Network error during upload.');
    };

    xhr.send(formData);
  }, [type, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept={type === 'video' ? 'video/*' : 'image/*'}
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {uploaded ? (
        <Box
          sx={{
            p: 2, borderRadius: 2,
            border: '1px solid rgba(16,185,129,0.3)',
            backgroundColor: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} sx={{ color: 'success.main' }}>
              Uploaded successfully
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
              {uploaded.publicId}
            </Typography>
          </Box>
          <Button size="small" variant="outlined" sx={{ borderColor: 'rgba(16,185,129,0.4)', color: 'success.main' }}
            onClick={() => { setUploaded(null); if (inputRef.current) inputRef.current.value = ''; }}>
            Replace
          </Button>
        </Box>
      ) : (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          sx={{
            p: 4, borderRadius: 2, cursor: uploading ? 'default' : 'pointer',
            border: `2px dashed ${dragging ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`,
            backgroundColor: dragging ? 'rgba(124,58,237,0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s',
            textAlign: 'center',
            '&:hover': !uploading ? {
              border: '2px dashed rgba(124,58,237,0.5)',
              backgroundColor: 'rgba(124,58,237,0.04)',
            } : {},
          }}
        >
          {uploading ? (
            <Box>
              <CircularProgress size={36} sx={{ mb: 1.5, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Uploading to Cloudinary... {progress}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2 }} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: 2, mx: 'auto', mb: 1.5,
                  background: 'rgba(124,58,237,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {type === 'video'
                  ? <VideoFileOutlinedIcon sx={{ color: 'primary.light', fontSize: 28 }} />
                  : <ImageOutlinedIcon sx={{ color: 'primary.light', fontSize: 28 }} />
                }
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary', mb: 0.5 }}>
                {label || `Drop ${type} here or click to browse`}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {type === 'video' ? 'MP4, MOV, AVI up to 2GB' : 'JPG, PNG, WEBP up to 10MB'}
              </Typography>
            </>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
