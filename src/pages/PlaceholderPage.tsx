export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">{title}</h1>
      <p className="text-slate-500 max-w-md">
        This is a placeholder for the {title} page. Full implementation would go here along with actual feature code.
      </p>
    </div>
  );
}
