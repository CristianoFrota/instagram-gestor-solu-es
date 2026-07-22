"use client";

import { FormEvent, useEffect, useState } from "react";

type PostStatus = "SCHEDULED" | "PUBLISHED" | "FAILED";

type ScheduledPost = {
  id: string;
  caption: string;
  imageUrl: string;
  scheduledFor: string;
  status: PostStatus;
  errorMessage: string | null;
};

const statusLabel: Record<PostStatus, string> = {
  SCHEDULED: "Agendado",
  PUBLISHED: "Publicado",
  FAILED: "Falhou",
};

export function PostScheduler() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPosts() {
    const res = await fetch("/api/posts");
    if (res.ok) {
      setPosts(await res.json());
    }
  }

  useEffect(() => {
    fetch("/api/posts").then(async (res) => {
      if (res.ok) {
        setPosts(await res.json());
      }
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageUrl, scheduledFor }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao agendar post.");
      }
      setCaption("");
      setImageUrl("");
      setScheduledFor("");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadPosts();
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            URL da imagem (pública)
          </label>
          <input
            type="url"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Legenda
          </label>
          <textarea
            required
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Data/hora de publicação
          </label>
          <input
            type="datetime-local"
            required
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {submitting ? "Agendando..." : "Agendar post"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Posts agendados
        </h2>
        {posts.length === 0 && (
          <p className="text-sm text-zinc-500">Nenhum post agendado ainda.</p>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">
                {new Date(post.scheduledFor).toLocaleString("pt-BR")} —{" "}
                {statusLabel[post.status]}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {post.caption}
              </span>
              {post.errorMessage && (
                <span className="text-red-600">{post.errorMessage}</span>
              )}
            </div>
            {post.status === "SCHEDULED" && (
              <button
                onClick={() => handleCancel(post.id)}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline"
              >
                Cancelar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
