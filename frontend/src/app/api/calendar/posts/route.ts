import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

async function requireAuth(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/auth/me`,
      { headers: { Cookie: cookieHeader } }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAuth(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (!clientId || !month || !year)
    return NextResponse.json({ error: "clientId, month, and year are required" }, { status: 400 });

  const date = new Date(Number(year), Number(month) - 1, 1);
  const posts = await prisma.calendarPost.findMany({
    where: {
      clientId,
      date: { gte: startOfMonth(date), lte: endOfMonth(date) },
    },
    include: { platforms: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, date, description, platforms } = await request.json();

  if (!clientId || !date)
    return NextResponse.json({ error: "clientId and date are required" }, { status: 400 });

  const postDate = new Date(date);

  const existing = await prisma.calendarPost.findFirst({
    where: { clientId, date: postDate },
  });

  let post;
  if (existing) {
    await prisma.calendarPlatform.deleteMany({ where: { postId: existing.id } });
    post = await prisma.calendarPost.update({
      where: { id: existing.id },
      data: {
        description: description ?? "",
        updatedAt: new Date(),
        platforms: {
          create: (platforms ?? []).map((p: { name: string; url: string }) => ({
            name: p.name,
            url: p.url,
          })),
        },
      },
      include: { platforms: true },
    });
  } else {
    post = await prisma.calendarPost.create({
      data: {
        id: crypto.randomUUID(),
        clientId,
        date: postDate,
        description: description ?? "",
        platforms: {
          create: (platforms ?? []).map((p: { name: string; url: string }) => ({
            id: crypto.randomUUID(),
            name: p.name,
            url: p.url,
          })),
        },
      },
      include: { platforms: true },
    });
  }

  return NextResponse.json(post, { status: 201 });
}
