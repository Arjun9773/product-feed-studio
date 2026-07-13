import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();

  // Hide sidebar for campaign pages
  const hideSidebar =
    location.pathname === "/competitor-price" ||
    location.pathname.startsWith("/campaign");

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">

      {/* Sidebar */}
      {!hideSidebar && (
        <AppSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">

        <AppHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-6 overflow-auto pt-16 mt-4">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
