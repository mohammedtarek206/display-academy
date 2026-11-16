export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-primary/30">
      {children}
    </div>
  );
}
