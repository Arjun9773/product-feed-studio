/**
 * ClientChart component - Ensures charts render only on client
 * This prevents hydration mismatches in SSR environments
 */
import { useEffect, useState } from "react";

export function ClientChart({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full bg-muted animate-pulse rounded" />;
  }

  return <>{children}</>;
}
