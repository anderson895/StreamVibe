# 🎬 StreamVibe — Live Streaming Platform

A full-featured live streaming platform built with **Next.js 14**, **Redis**, **Cloudinary**, and **Livepeer**.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | Material UI v5 (MUI) |
| Database/Cache | Redis (RedisLabs) |
| Media/Images | Cloudinary |
| Live Streaming | Livepeer (FREE) |
| Language | TypeScript |

---

## ⚙️ Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure `.env.local`
```env
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Stream_Upload

# Redis
REDIS_URL=redis://default:your_password@your_host:port

# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret

# Livepeer (free at livepeer.studio)
LIVEPEER_API_KEY=your_livepeer_api_key
```

### 3. Run
```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── streams/          # CRUD streams (Redis)
│   │   │   └── [id]/
│   │   ├── chat/             # Chat messages
│   │   ├── livepeer/         # Livepeer live stream API
│   │   ├── upload/           # Cloudinary upload signature
│   │   └── debug/            # Redis data viewer
│   ├── browse/               # Browse all streams
│   ├── dashboard/            # Creator dashboard
│   ├── stream/[id]/          # Watch stream page
│   └── page.tsx              # Homepage
├── components/
│   ├── Navbar.tsx
│   ├── StreamCard.tsx
│   ├── ChatPanel.tsx
│   ├── VideoPlayer.tsx       # HLS player (Livepeer)
│   └── CloudinaryUploader.tsx
├── lib/
│   ├── redis.ts
│   ├── cloudinary.ts
│   ├── livepeer.ts
│   └── theme.ts
└── types/
    └── index.ts
```

---

## 📺 Features

- **Homepage** — Featured live stream hero, category filters, live/all streams grid
- **Browse** — Search, filter, sort streams
- **Watch Page** — HLS live video player, real-time chat, host info
- **Dashboard** — Create streams, Go Live with Livepeer, OBS setup guide

---

## 🎥 How to Go Live

1. Dashboard → **Create Stream** (fill title, category, thumbnail)
2. Click **"Go Live"** — Livepeer creates a live stream
3. Copy **RTMP URL** and **Stream Key**
4. Open **OBS Studio** → Settings → Stream → Custom
   - Server: `rtmp://rtmp.livepeer.com/live`
   - Stream Key: *(paste from dashboard)*
5. Click **Start Streaming** in OBS
6. Viewers open the stream page — **live video plays automatically!**

---

## 🔌 Redis Key Schema

| Key | Type | Data |
|---|---|---|
| `stream:{id}` | String | Stream JSON |
| `streams:all` | List | All stream IDs |
| `streams:live` | Set | Live stream IDs |
| `chat:{streamId}` | List | Chat messages |
| `viewers:{streamId}` | String | Viewer count |

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add all `.env.local` variables in Vercel dashboard
4. Deploy!

> ⚠️ Remove `/api/debug` route before deploying to production.
