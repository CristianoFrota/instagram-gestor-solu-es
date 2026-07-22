import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishImagePost } from "@/lib/instagram";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Chamado periodicamente (ex.: Vercel Cron, que usa GET) para publicar
 * posts cujo horário agendado já chegou. POST fica disponível para
 * disparo manual (ex.: curl) com a mesma autenticação.
 */
export async function GET(request: NextRequest) {
  return handlePublishDuePosts(request);
}

export async function POST(request: NextRequest) {
  return handlePublishDuePosts(request);
}

async function handlePublishDuePosts(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const duePosts = await prisma.scheduledPost.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
  });

  const results = [];
  for (const post of duePosts) {
    try {
      const { igMediaId } = await publishImagePost({
        imageUrl: post.imageUrl,
        caption: post.caption,
      });
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", igMediaId, errorMessage: null },
      });
      results.push({ id: post.id, status: "PUBLISHED" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "FAILED", errorMessage: message },
      });
      results.push({ id: post.id, status: "FAILED", error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
