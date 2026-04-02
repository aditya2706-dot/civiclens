import AuthorityNav from "@/components/AuthorityNav";

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 w-full relative pb-24 lg:pb-0 font-sans selection:bg-green-500/30 selection:text-green-200">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-red-500 z-[2000]" />
      {children}
      <AuthorityNav />
    </div>
  );
}
