import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.scheduledPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }
  if (post.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "Só é possível cancelar posts com status SCHEDULED." },
      { status: 409 }
    );
  }

  await prisma.scheduledPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
