import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendUrl = `${BACKEND_URL}/api/${path.join("/")}`;

  // Forward cookies from the browser to the backend
  const cookieHeader = request.headers.get("cookie") ?? "";

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  const backendRes = await fetch(backendUrl, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: body || undefined,
  });

  const responseText = await backendRes.text();

  const response = new NextResponse(responseText, {
    status: backendRes.status,
    headers: {
      "Content-Type":
        backendRes.headers.get("content-type") ?? "application/json",
    },
  });

  // Re-set cookies from the backend onto the frontend domain
  // so Next.js middleware can read them
  const rawCookies: string[] =
    typeof (backendRes.headers as any).getSetCookie === "function"
      ? (backendRes.headers as any).getSetCookie()
      : backendRes.headers.get("set-cookie")
      ? [backendRes.headers.get("set-cookie") as string]
      : [];

  for (const cookie of rawCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
