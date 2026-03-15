import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { folder = 'stream-thumbnails', public_id } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const params: Record<string, string | number> = { timestamp, folder };
    if (public_id) params.public_id = public_id;

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Signature generation failed' }, { status: 500 });
  }
}
