import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.scheduledPost.findMany({
    orderBy: { scheduledFor: "asc" },
  });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { caption, imageUrl, scheduledFor } = body ?? {};

  if (
    typeof caption !== "string" ||
    typeof imageUrl !== "string" ||
    typeof scheduledFor !== "string" ||
    !caption.trim() ||
    !imageUrl.trim()
  ) {
    return NextResponse.json(
      { error: "caption, imageUrl e scheduledFor são obrigatórios." },
      { status: 400 }
    );
  }

  const scheduledDate = new Date(scheduledFor);
  if (Number.isNaN(scheduledDate.getTime())) {
    return NextResponse.json(
      { error: "scheduledFor precisa ser uma data válida." },
      { status: 400 }
    );
  }

  const post = await prisma.scheduledPost.create({
    data: { caption, imageUrl, scheduledFor: scheduledDate },
  });

  return NextResponse.json(post, { status: 201 });
}
