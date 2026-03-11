import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import FeedOptimization from "@/pages/FeedOptimization";
import CategoryMapping from "@/pages/CategoryMapping";
import FeedRules from "@/pages/FeedRules";
import FeedAudit from "@/pages/FeedAudit";
import Exports from "@/pages/Exports";
import Integrations from "@/pages/Integrations";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/feed-optimization" element={<FeedOptimization />} />
            <Route path="/category-mapping" element={<CategoryMapping />} />
            <Route path="/feed-rules" element={<FeedRules />} />
            <Route path="/feed-audit" element={<FeedAudit />} />
            <Route path="/exports" element={<Exports />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
