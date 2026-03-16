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

      <div className="ml-auto flex items-center gap-2">
       

        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-muted-foreground hover:text-foreground">
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Avatar + logout */}
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
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      
      <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-50 py-1">
        
        {/* User info */}
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">{isSuperAdmin ? 'Super Admin' : 'Store Admin'}</p>
        </div>

        {/* Store list — super_admin only */}
        {isSuperAdmin && (
          <>
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
              Switch Store
            </div>
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
          </>
        )}

        {/* Logout */}
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
    </header>
  );
}
