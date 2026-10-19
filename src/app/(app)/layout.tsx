import { MobileNav, Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { isDemo } from "@/lib/config";
import { requireRepo } from "@/lib/repo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const repo = await requireRepo();
  const couple = await repo.getCouple();
  return (
    <div className="mx-auto flex max-w-[1440px] gap-4 p-4">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-4 pb-24 md:pb-0">
        <Topbar me={repo.me} coupleName={couple?.name ?? null} demo={isDemo} />
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
