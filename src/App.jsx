import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import OutputFeed from "@/pages/OutputFeed";
import FeedProductList from "@/pages/FeedProductList";
import TitleOptimization from "@/pages/TitleOptimization";
import GoogleCategory from "@/pages/GoogleCategory";
import FieldOptimization from "@/pages/FieldOptimization";
import FeedAudit from "@/pages/FeedAudit";
import ManageFeedSetup from "@/pages/ManageFeedSetup";
import CustomLabels from "@/pages/CustomLabels";
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
            <Route path="/output-feed" element={<OutputFeed />} />
            <Route path="/feed-products" element={<FeedProductList />} />
            <Route path="/title-optimization" element={<TitleOptimization />} />
            <Route path="/google-category" element={<GoogleCategory />} />
            <Route path="/field-optimization" element={<FieldOptimization />} />
            <Route path="/feed-audit" element={<FeedAudit />} />
            <Route path="/manage-feed-setup" element={<ManageFeedSetup />} />
            <Route path="/custom-labels" element={<CustomLabels />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
