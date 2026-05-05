import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Fixed Header */}
      <AppHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Sidebar + Main Content */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Fixed Sidebar */}
        <AppSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
