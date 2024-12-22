"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex w-full">
          <SidebarTrigger />
          <main className="flex-1 w-full overflow-y-auto">
            <div className="w-full p-6 mx-auto">{children}</div>
          </main>
        </main>
      </SidebarProvider>
    </>
  );
}
