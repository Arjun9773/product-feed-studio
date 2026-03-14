import { Bell, Search, Moon, Sun, Menu, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import API from "@/hooks/useApi";

export function AppHeader({ onMenuToggle }) {
  const [darkMode, setDarkMode] = useState(false);
  const [stores, setStores] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout, switchStore, activeShopName } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      API.get('/auth/all-stores').then(({ data }) => {
        setStores(data);
        // Auto-select first store if none selected yet
        if (!activeShopName && data.length > 0) {
          switchStore(data[0].store_id, data[0].shopName);
        }
      }).catch(console.error);
    }
  }, [isSuperAdmin]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStoreSelect = (store) => {
    switchStore(store.store_id, store.shopName);
    setDropdownOpen(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Display name: super_admin shows active store name, store_admin shows their shop
  const displayName = isSuperAdmin ? (activeShopName || 'Select Store') : (user?.shopName || user?.name);

  return (
    <header className="flex items-center h-16 px-6 border-b border-border bg-card shrink-0">
      <button
        onClick={onMenuToggle}
        className="mr-4 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, feeds, rules..."
          className="pl-10 bg-secondary border-0 h-10"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Store Switcher — super_admin only */}
        {isSuperAdmin && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors"
            >
              <span className="max-w-[160px] truncate">{displayName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border bg-card shadow-lg z-50 py-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Super Admin
                  </div>
                  <div className="my-1 border-t" />
                  {stores.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No stores yet</p>
                  ) : (
                    stores.map((store) => (
                      <button
                        key={store._id}
                        onClick={() => handleStoreSelect(store)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                          activeShopName === store.shopName ? 'bg-accent font-medium' : ''
                        }`}
                      >
                        {store.shopName}
                      </button>
                    ))
                  )}
                  <div className="my-1 border-t" />
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
        )}

        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-muted-foreground hover:text-foreground">
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Avatar + logout */}
        <div className="ml-2 flex items-center gap-1">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold cursor-default">
            {initials}
          </div>
          {!isSuperAdmin && (
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
