import { PostScheduler } from "@/components/PostScheduler";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Agendamento de Instagram — Gestorsoluções
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Agende posts para publicação automática via Instagram Graph API.
        </p>
        <PostScheduler />
      </main>
    </div>
  );
}
