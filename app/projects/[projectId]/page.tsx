export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Saved Project
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Project {projectId}
      </h1>
      <p className="mt-4 max-w-lg text-base leading-7 text-zinc-600">
        Placeholder for a saved renovation project detail page.
      </p>
    </main>
  );
}
