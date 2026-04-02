import BottomNav from "@/components/BottomNav";

export default function CitizenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] relative pb-28 overflow-x-hidden border-x border-gray-100/50">
      {children}
      <BottomNav />
    </div>
  );
}
