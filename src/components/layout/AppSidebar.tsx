import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Rss as RssIcon,
  Package,
  Type,
  FolderTree,
  Sliders,
  ClipboardCheck,
  Settings,
  ChevronLeft,
  Rss,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Output Feed", icon: RssIcon, path: "/output-feed" },
  { title: "Feed Product List", icon: Package, path: "/feed-products" },
  { title: "Title Optimization", icon: Type, path: "/title-optimization" },
  { title: "Google Category", icon: FolderTree, path: "/google-category" },
  { title: "Field Optimization", icon: Sliders, path: "/field-optimization" },
  { title: "Feed Audit", icon: ClipboardCheck, path: "/feed-audit" },
  { title: "Manage Feed Setup", icon: Settings, path: "/manage-feed-setup" },
];

interface AppSidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function AppSidebar({ open, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shrink-0",
        open ? "w-64" : "w-[70px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Rss className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <span className="text-lg font-bold text-foreground truncate">
              DigitalDataFeed
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            !open && "ml-0 mx-auto mt-2"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              !open && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {open && <span className="truncate">{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
