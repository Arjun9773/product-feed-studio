import { Moon, Sun, Menu, LogOut, Puzzle, CheckCircle2,Rss } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import API from "@/hooks/useApi";
import { INTEGRATION_ICONS } from "@/config/integrationIcons";

export function AppHeader({ onMenuToggle }) {
  const [darkMode,     setDarkMode]     = useState(false);
  const [stores,       setStores]       = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile,      setProfile]      = useState(null);

  // Integration panel states
  const [intOpen,      setIntOpen]      = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [intLoading,   setIntLoading]   = useState(false);
  const [toggling,     setToggling]     = useState(null); // currently toggling id

  const { user, logout, switchStore, activeShopName } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.userType === "super_admin";
  const isStoreAdmin = user?.userType === "store_admin";

  // Load profile
  useEffect(() => {
    API.get("/settings/profile")
      .then(({ data }) => setProfile(data))
      .catch(console.error);
  }, [user?.userId]);

  // Load all stores for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      API.get("/auth/all-stores")
        .then(({ data }) => {
          setStores(data);
          if (!activeShopName && data.length > 0) {
            switchStore(data[0].companyId, data[0].companyName);
          }
        })
        .catch(console.error);
    }
  }, [isSuperAdmin]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleStoreSelect = (store) => {
    switchStore(store.companyId, store.companyName);
    setDropdownOpen(false);
    window.location.reload();
  };

  // Fetch integrations from API
  const fetchIntegrations = async () => {
    setIntLoading(true);
    try {
      const { data } = await API.get("/integrations");
      setIntegrations(data);
    } catch (err) {
      console.error("[integrations fetch]", err);
    } finally {
      setIntLoading(false);
    }
  };

  // Open panel + fetch every time (latest connected status)
  const handleIntOpen = () => {
    const opening = !intOpen;
    setIntOpen(opening);
    if (opening) {
      fetchIntegrations();
    }
  };

  // Toggle connected status
  const handleToggle = async (e, itemId) => {
    e.stopPropagation();
    setToggling(itemId);
    try {
      const { data } = await API.patch(`/integrations/${itemId}/toggle`);
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === itemId ? { ...int, connected: data.connected } : int
        )
      );
    } catch (err) {
      console.error("[integrations toggle]", err);
    } finally {
      setToggling(null);
    }
  };

  // Initials from DB profile
  const initials = profile?.companyName
    ? profile.companyName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile?.companyUrl
    ? profile.companyUrl.slice(0, 2).toUpperCase()
    : profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : "U";

  const displayName = isSuperAdmin
    ? activeShopName || "Select Store"
    : profile?.companyName || profile?.companyUrl || profile?.email || "";

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : isStoreAdmin
    ? "Store Admin"
    : "User";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur">

      <div className="flex items-center justify-between h-full px-4">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* Sidebar Toggle */}
          <button
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Rss className="h-5 w-5 text-primary-foreground" />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-foreground">
                DigitalDataFeed
              </p>
              <p className="text-[10px] text-muted-foreground">
                Feed Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          <div className="ml-auto flex items-center gap-2">

            {/* ── Tools & Intelligence button + panel ── */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleIntOpen}
                  className={cn(
                    "gap-2 text-muted-foreground hover:text-foreground",
                    intOpen && "bg-accent text-foreground"
                  )}
                >
                  <Puzzle className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">
                    Optimization Center
                  </span>
                </Button>

                {intOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIntOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-border bg-card shadow-xl z-50 p-4">
                      
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Optimization Center
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Access advanced analytics and pricing intelligence tools
                            to improve your product feed performance.
                          </p>
                        </div>

                        <button
                          onClick={() => setIntOpen(false)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Cards */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {intLoading ? (
                          <p className="col-span-2 text-xs text-muted-foreground text-center py-6">
                            Loading modules...
                          </p>
                        ) : integrations.length === 0 ? (
                          <p className="col-span-2 text-xs text-muted-foreground text-center py-6">
                            No modules available
                          </p>
                        ) : (
                          integrations.map((item) => {
                            const meta = INTEGRATION_ICONS[item.id];
                            const Icon = meta?.Icon;

                            return (
                              <div
                                key={item.id}
                                className="group border border-border rounded-xl p-3 bg-background/50 hover:border-primary/40 hover:bg-accent/40 transition-all duration-200"
                              >
                                {/* Icon + Status */}
                                <div className="flex items-start justify-between mb-3">
                                  <div
                                    className={cn(
                                      "h-9 w-9 rounded-xl flex items-center justify-center",
                                      meta?.bg ?? "bg-muted"
                                    )}
                                  >
                                    {Icon && (
                                      <Icon
                                        className={cn(
                                          "h-4 w-4",
                                          meta?.color ?? "text-muted-foreground"
                                        )}
                                      />
                                    )}
                                  </div>

                                  <span
                                    className={cn(
                                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                      item.connected
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {item.connected ? "Active" : "Available"}
                                  </span>
                                </div>

                                {/* Title */}
                                <p
                                  onClick={() => {
                                    navigate(item.path);
                                    setIntOpen(false);
                                  }}
                                  className="text-xs font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                                >
                                  {item.name}
                                </p>

                                {/* Description */}
                                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 min-h-[38px]">
                                  {item.desc}
                                </p>

                                {/* Category */}
                                <p className="text-[10px] text-primary font-medium mt-2">
                                  {item.category}
                                </p>

                                {/* Action Button */}
                                <button
                                  onClick={() => {
                                    navigate(item.path);
                                    setIntOpen(false);
                                  }}
                                  className="w-full mt-3 text-[11px] font-medium py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                >
                                  {item.connected
                                    ? "Open Dashboard"
                                    : "Explore Module"}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-muted-foreground hover:text-foreground"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Avatar + dropdown */}
              <div className="ml-2 relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {initials}
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-50 py-1">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium text-foreground">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">{roleLabel}</p>
                      </div>

                      {isSuperAdmin && (
                        <>
                          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                            Switch Store
                          </div>
                          {stores.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                              No stores yet
                            </p>
                          ) : (
                            stores.map((store) => (
                              <button
                                key={store._id}
                                onClick={() => handleStoreSelect(store)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                                  activeShopName === store.companyName
                                    ? "bg-accent font-medium"
                                    : ""
                                }`}
                              >
                                {store.companyName}
                              </button>
                            ))
                          )}
                          <div className="my-1 border-t" />
                        </>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
        </div>
      </div>
      
    </header>
  );
}
