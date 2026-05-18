import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // ← default false (closed)
  const location = useLocation();

  const hideSidebar = location.pathname === "/competitor-price" || location.pathname === "/campaign"; // ← hide sidebar on competitor-price page

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">

      {/* Sidebar — offcanvas, hide only on competitor-price page */}
      {!hideSidebar && (
        <AppSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main content — full width எப்பவும் */}
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
