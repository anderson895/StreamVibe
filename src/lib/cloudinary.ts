import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Stream_Upload';
export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export async function uploadStreamThumbnail(file: string, publicId?: string) {
  return cloudinary.uploader.upload(file, {
    upload_preset: UPLOAD_PRESET,
    folder: 'stream-thumbnails',
    public_id: publicId,
    resource_type: 'image',
    transformation: [{ width: 1280, height: 720, crop: 'fill' }],
  });
}

export async function uploadStreamVideo(file: string, streamId: string) {
  return cloudinary.uploader.upload(file, {
    upload_preset: UPLOAD_PRESET,
    folder: 'stream-recordings',
    public_id: `stream-${streamId}`,
    resource_type: 'video',
  });
}

export function getStreamUrl(publicId: string) {
  return cloudinary.url(publicId, { resource_type: 'video', secure: true });
}

export function getThumbnailUrl(publicId: string, width = 640, height = 360) {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    resource_type: 'image',
    secure: true,
  });
}
