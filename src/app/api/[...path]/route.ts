import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL || 'http://localhost:5000';

async function handler(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(lower)) {
        headers.set(key, value);
      }
    });

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
      const body = await req.arrayBuffer();
      if (body.byteLength > 0) {
        options.body = body;
      }
    }

    const backendRes = await fetch(targetUrl, options);

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await backendRes.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('API Proxy error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'API Proxy Error' },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
