import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.calendarPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
