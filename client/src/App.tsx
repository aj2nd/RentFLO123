import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import AdminDashboard from "@/pages/AdminDashboard";
import OwnerDashboard from "@/pages/OwnerDashboard";
import TenantDashboard from "@/pages/TenantDashboard";
import { Navigation } from "@/components/Navigation";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return (
    <>
      <Navigation />
      <Component />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      
      {/* Protected Routes */}
      <Route path="/admin">
        <PrivateRoute component={AdminDashboard} />
      </Route>
      <Route path="/owner">
        <PrivateRoute component={OwnerDashboard} />
      </Route>
      <Route path="/tenant">
        <PrivateRoute component={TenantDashboard} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
