import {
  Moon,
  Sun,
  Menu,
  LogOut,
  Puzzle,
  Rss,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import API from "@/hooks/useApi";
import { INTEGRATION_ICONS } from "@/config/integrationIcons";

export function AppHeader({ onMenuToggle }) {
  const [darkMode, setDarkMode] = useState(false);
  const [stores, setStores] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  // Integration panel states
  const [intOpen, setIntOpen] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [intLoading, setIntLoading] = useState(false);

  const { user, logout, switchStore, activeShopName } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = user?.userType === "super_admin";
  const isStoreAdmin = user?.userType === "store_admin";

  // Load profile
  useEffect(() => {
    API.get("/settings/profile")
      .then(({ data }) => setProfile(data))
      .catch(console.error);
  }, [user?.userId]);

  // Load stores
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

  // Fetch integrations
  const fetchIntegrations = async () => {
    setIntLoading(true);

    try {
      const { data } = await API.get("/integrations");
      setIntegrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIntLoading(false);
    }
  };

  const handleIntOpen = () => {
    const opening = !intOpen;

    setIntOpen(opening);

    if (opening) {
      fetchIntegrations();
    }
  };

  // Initials
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
    : profile?.companyName ||
      profile?.companyUrl ||
      profile?.email ||
      "";

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : isStoreAdmin
    ? "Store Admin"
    : "User";

  const hideSidebar =
    location.pathname === "/competitor-price" ||
    location.pathname === "/campaign";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center justify-between h-full px-4">

        {/* LEFT */}
        <div className="flex items-center gap-3">

          {!hideSidebar && (
            <button
              onClick={onMenuToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
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
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* Optimization Center */}
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
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Optimization Center
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Access advanced analytics and pricing intelligence tools.
                      </p>
                    </div>

                    <button
                      onClick={() => setIntOpen(false)}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="grid grid-cols-2 gap-3">

                    {intLoading ? (
                      <p className="col-span-2 text-center text-xs text-muted-foreground py-6">
                        Loading modules...
                      </p>
                    ) : integrations.length === 0 ? (
                      <p className="col-span-2 text-center text-xs text-muted-foreground py-6">
                        No modules available
                      </p>
                    ) : (
                      integrations.map((item) => {
                        const meta = INTEGRATION_ICONS[item.id];
                        const Icon = meta?.Icon;

                        return (
                          <div
                            key={item.id}
                            className="border border-border rounded-xl p-3 hover:border-primary/40 hover:bg-accent/40 transition-all"
                          >

                            {/* Icon */}
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
                                  "text-[10px] px-2 py-0.5 rounded-full",
                                  item.connected
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {item.connected ? "Active" : "Available"}
                              </span>
                            </div>

                            {/* Name */}
                            <p
                              onClick={() => {
                                navigate(item.path);
                                setIntOpen(false);
                              }}
                              className="text-xs font-semibold cursor-pointer hover:text-primary"
                            >
                              {item.name}
                            </p>

                            {/* Description */}
                            <p className="text-[10px] text-muted-foreground mt-1 min-h-[38px]">
                              {item.desc}
                            </p>

                            {/* Category */}
                            <p className="text-[10px] text-primary font-medium mt-2">
                              {item.category}
                            </p>

                            {/* Button */}
                            <button
                              onClick={() => {
                                navigate(item.path);
                                setIntOpen(false);
                              }}
                              className="w-full mt-3 text-[11px] py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                              {item.connected
                                ? "Open Dashboard"
                                : "Open Dashboard"}
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

          {/* Dark Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-muted-foreground hover:text-foreground"
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Profile */}
          <div className="relative">

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center"
            >
              {initials}
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-50 py-1">

                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium text-foreground">
                      {displayName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {roleLabel}
                    </p>
                  </div>

                  {isSuperAdmin && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
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
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm hover:bg-accent",
                              activeShopName === store.companyName &&
                                "bg-accent font-medium"
                            )}
                          >
                            {store.companyName}
                          </button>
                        ))
                      )}

                      <div className="my-1 border-t" />
                    </>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
