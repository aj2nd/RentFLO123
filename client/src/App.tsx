import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Onboarding from "@/pages/Onboarding";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminMaintenance from "@/pages/AdminMaintenance";
import OwnerDashboard from "@/pages/OwnerDashboard";
import TenantDashboard from "@/pages/TenantDashboard";
import Ledger from "@/pages/Ledger";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import Support from "@/pages/Support";
import Verify from "@/pages/Verify";
import { Navigation } from "@/components/Navigation";
import { LegalFooter } from "@/components/LegalFooter";

function PrivateRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (!user?.role) {
    return <Redirect to="/onboarding" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleRedirects: Record<string, string> = {
      'ADMIN': '/admin',
      'OWNER': '/owner',
      'TENANT': '/tenant',
    };
    return <Redirect to={roleRedirects[user.role] || '/'} />;
  }

  return (
    <>
      <Navigation />
      <Component />
    </>
  );
}

function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <LandingPage />;
  }

  if (!user.role) {
    return <Redirect to="/onboarding" />;
  }

  const roleRedirects: Record<string, string> = {
    'ADMIN': '/admin',
    'OWNER': '/owner',
    'TENANT': '/tenant',
  };
  
  return <Redirect to={roleRedirects[user.role]} />;
}

function OnboardingRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (user?.role) {
    const roleRedirects: Record<string, string> = {
      'ADMIN': '/admin',
      'OWNER': '/owner',
      'TENANT': '/tenant',
    };
    return <Redirect to={roleRedirects[user.role]} />;
  }

  return <Onboarding />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardRedirect} />
      <Route path="/onboarding" component={OnboardingRoute} />
      
      {/* Protected Routes with Role Restrictions */}
      <Route path="/admin/maintenance">
        <PrivateRoute component={AdminMaintenance} allowedRoles={['ADMIN']} />
      </Route>
      <Route path="/admin">
        <PrivateRoute component={AdminDashboard} allowedRoles={['ADMIN']} />
      </Route>
      <Route path="/owner">
        <PrivateRoute component={OwnerDashboard} allowedRoles={['OWNER', 'ADMIN']} />
      </Route>
      <Route path="/tenant">
        <PrivateRoute component={TenantDashboard} allowedRoles={['TENANT', 'ADMIN']} />
      </Route>
      <Route path="/ledger">
        <PrivateRoute component={Ledger} allowedRoles={['ADMIN', 'OWNER', 'TENANT']} />
      </Route>
      
      {/* KYC Verification */}
      <Route path="/verify">
        <PrivateRoute component={Verify} allowedRoles={['TENANT', 'OWNER']} />
      </Route>
      
      {/* Legal Pages (Public) */}
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={Refund} />
      <Route path="/support" component={Support} />

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
        <LegalFooter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
