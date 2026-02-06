import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

function MobileMenuTrigger() {
  const { isMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <div className="sticky top-0 z-10 flex h-12 items-center border-b bg-background px-4 md:hidden">
      <SidebarTrigger className="-ml-1" aria-label="Abrir menu" />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <MobileMenuTrigger />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
