import { NextRequest, NextResponse } from 'next/server';

const CDN = 'https://livepeercdn.studio';

// "4_0/index.m3u8" → "4_0/"
// "index.m3u8" or null → ""
function getFolder(path: string | null): string {
  if (!path) return '';
  const slash = path.lastIndexOf('/');
  return slash >= 0 ? path.substring(0, slash + 1) : '';
}

// Get the base URL of a manifest URL
// "https://mdw-prod-catalyst-0.lp-playback.studio/hls/video+abc/4_0/index.m3u8"
// → "https://mdw-prod-catalyst-0.lp-playback.studio/hls/video+abc/4_0/"
function getBaseUrl(url: string): string {
  const slash = url.lastIndexOf('/');
  return url.substring(0, slash + 1);
}

function parseLine(line: string): { segPath: string; segTkn: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  if (trimmed.startsWith('http')) {
    const [urlPart, ...rest] = trimmed.split('?');
    const query = rest.join('?');
    const tknMatch = query.match(/(?:^|&)tkn=([^&]+)/);
    return { segPath: trimmed, segTkn: tknMatch ? tknMatch[1] : '' };
  } else {
    const [pathPart, queryPart] = trimmed.split('?');
    const tknMatch = queryPart?.match(/(?:^|&)tkn=([^&]+)/);
    return { segPath: pathPart, segTkn: tknMatch ? tknMatch[1] : '' };
  }
}

function buildProxyUrl(playbackId: string, absoluteUrl: string, segTkn: string): string {
  return `/api/hls-proxy?playbackId=${playbackId}&url=${encodeURIComponent(absoluteUrl)}${segTkn ? `&tkn=${segTkn}` : ''}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playbackId = searchParams.get('playbackId');
  const urlParam = searchParams.get('url');     // full upstream URL (for segments/sub-manifests)
  const path = searchParams.get('path');        // legacy: relative path from playbackId base
  const tkn = searchParams.get('tkn') || '';

  if (!playbackId) {
    return NextResponse.json({ error: 'playbackId required' }, { status: 400 });
  }

  try {
    // Determine the upstream URL to fetch
    let targetUrl: string;
    if (urlParam) {
      targetUrl = urlParam;
    } else if (path) {
      targetUrl = `${CDN}/hls/${playbackId}/${path}${tkn ? `?tkn=${tkn}` : ''}`;
    } else {
      targetUrl = `${CDN}/hls/${playbackId}/index.m3u8`;
    }

    const isM3U8 = targetUrl.includes('.m3u8');
    console.log('[HLS Proxy] Fetching:', targetUrl);

    // Follow redirects — upstream.url gives us the FINAL URL after all redirects
    const upstream = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      console.error('[HLS Proxy] Failed:', upstream.status, upstream.url);
      return new NextResponse(null, { status: upstream.status });
    }

    const finalUrl = upstream.url;
    console.log('[HLS Proxy] Final URL:', finalUrl);

    if (isM3U8) {
      const text = await upstream.text();
      console.log('[HLS Proxy] Raw manifest:\n', text.substring(0, 800));

      // Base URL from the FINAL (post-redirect) URL — correct base for relative paths
      const finalBase = getBaseUrl(finalUrl);

      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;

          const parsed = parseLine(line);
          if (!parsed) return line;

          let { segPath, segTkn } = parsed;
          const effectiveTkn = segTkn || tkn;

          // Resolve to absolute URL using the actual base after redirect
          const absoluteUrl = segPath.startsWith('http')
            ? segPath
            : finalBase + segPath;

          console.log('[HLS Proxy] Rewriting:', absoluteUrl, 'tkn:', effectiveTkn);
          return buildProxyUrl(playbackId, absoluteUrl, effectiveTkn);
        })
        .join('\n');

      console.log('[HLS Proxy] Rewritten manifest:\n', rewritten.substring(0, 800));

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Binary — .ts segment, proxy bytes through
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'video/MP2T',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    console.error('[HLS Proxy] Error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
