#!/usr/bin/env node
// Publica no Instagram os posts de content/scheduled-posts.json cujo horário já chegou.
// Roda via GitHub Actions (.github/workflows/publish-instagram.yml) — sem depender de
// nenhum servidor/hosting ligado. As imagens precisam estar acessíveis publicamente por
// URL (usa raw.githubusercontent.com, portanto o repositório precisa ser público).

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const DATA_FILE = resolve("content/scheduled-posts.json");

const accessToken = process.env.META_ACCESS_TOKEN;
const igUserId = process.env.IG_USER_ID;
if (!accessToken || !igUserId) {
  console.error("META_ACCESS_TOKEN e IG_USER_ID precisam estar configurados (GitHub Actions secrets).");
  process.exit(1);
}

const repo = process.env.GITHUB_REPOSITORY;
const ref = process.env.GITHUB_REF_NAME || "main";
if (!repo) {
  console.error("GITHUB_REPOSITORY não encontrado (esperado rodar dentro do GitHub Actions).");
  process.exit(1);
}

function publicUrlFor(relativePath) {
  return `https://raw.githubusercontent.com/${repo}/${ref}/${relativePath}`;
}

async function publishImagePost({ imageUrl, caption }) {
  const createRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    throw new Error(`Falha ao criar container de mídia: ${JSON.stringify(createData)}`);
  }

  const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Falha ao publicar mídia: ${JSON.stringify(publishData)}`);
  }

  return { igMediaId: publishData.id };
}

const posts = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
const now = new Date();
let hadFailure = false;
let changed = false;

for (const post of posts) {
  if (post.status !== "SCHEDULED") continue;
  if (new Date(post.scheduledFor) > now) continue;

  const caption = readFileSync(resolve(post.captionPath), "utf-8").trim();
  const imageUrl = publicUrlFor(post.imagePath);

  console.log(`Publicando "${post.id}" (${imageUrl})...`);
  try {
    const { igMediaId } = await publishImagePost({ imageUrl, caption });
    post.status = "PUBLISHED";
    post.igMediaId = igMediaId;
    post.errorMessage = null;
    console.log(`OK: ${post.id} -> igMediaId ${igMediaId}`);
  } catch (err) {
    post.status = "FAILED";
    post.errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`ERRO: ${post.id} -> ${post.errorMessage}`);
    hadFailure = true;
  }
  changed = true;
}

if (changed) {
  writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2) + "\n");
  console.log("content/scheduled-posts.json atualizado.");
} else {
  console.log("Nenhum post pendente no horário.");
}

process.exit(hadFailure ? 1 : 0);
