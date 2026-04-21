import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Reno App
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950">
        Plan a home renovation with guided steps and explainable estimates.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
        Start with a room, choose a style, answer a few practical questions, and save a renovation plan you can revisit.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/upload"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          Start planning
        </Link>
        <Link
          href="/projects"
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          View saved projects
        </Link>
      </div>
    </main>
  );
}
