/**
 * Design integration: the supplied tenant dashboard image owns its full-screen
 * canvas, so only the top shell navigation is suppressed on /tenant while the
 * shared tenant bottom navigation remains available across every tenant page.
 */
import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Onboarding from "@/pages/Onboarding";
import Setup from "@/pages/Setup";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminMaintenance from "@/pages/AdminMaintenance";
import AdminMessages from "@/pages/AdminMessages";
import OwnerImageDashboard from "@/pages/OwnerImageDashboard";
import TenantDashboard from "@/pages/TenantDashboard";
import Ledger from "@/pages/Ledger";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import Support from "@/pages/Support";
import About from "@/pages/About";
import Verify from "@/pages/Verify";
import AgreementPage from "@/pages/Agreement";
import Messages from "@/pages/Messages";
import Maintenance from "@/pages/Maintenance";
import ProfilePage from "@/pages/Profile";
import NotificationsPage from "@/pages/Notifications";
import { LegalFooter } from "@/components/LegalFooter";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navigation } from "@/components/Navigation";
import { BottomNav } from "@/components/BottomNav";

function SidebarContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`min-h-screen transition-all duration-300 ease-in-out ${!collapsed ? 'md:pl-64' : ''}`}
      style={{ paddingTop: "var(--topbar-h)" }}
    >
      {children}
    </div>
  );
}

function PrivateRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();
  const previewRole = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("preview") : null;
  const previewTenantMode = import.meta.env.DEV && (previewRole === "tenant" || (!previewRole && sessionStorage.getItem("rentflo:tenant-preview") === "1"));
  const previewOwnerMode = import.meta.env.DEV && (previewRole === "owner" || (!previewRole && sessionStorage.getItem("rentflo:owner-preview") === "1"));
  const previewMode = previewTenantMode || previewOwnerMode;

  useEffect(() => {
    if (previewRole === "tenant") {
      sessionStorage.setItem("rentflo:tenant-preview", "1");
      sessionStorage.removeItem("rentflo:owner-preview");
    }
    if (previewRole === "owner") {
      sessionStorage.setItem("rentflo:owner-preview", "1");
      sessionStorage.removeItem("rentflo:tenant-preview");
    }
  }, [previewRole]);

  if (isLoading && !previewMode) return <LoadingScreen />;

  if (!isAuthenticated && !previewMode) {
    window.location.href = "/api/login";
    return null;
  }

  if (!user?.role && !previewMode) {
    return <Redirect to="/onboarding" />;
  }

  if (allowedRoles && !previewMode && !allowedRoles.includes(user!.role)) {
    const roleRedirects: Record<string, string> = {
      'ADMIN': '/admin',
      'OWNER': '/owner',
      'TENANT': '/tenant',
    };
    return <Redirect to={roleRedirects[user.role] || '/'} />;
  }

  const isImageLedDashboard = location === "/tenant" || location === "/owner";

  return (
    <>
      {(!isImageLedDashboard || location === "/tenant" || location === "/owner") && <Navigation showMobileTopbarWhenOpenOnly={location === "/tenant" || location === "/owner"} />}
      {isImageLedDashboard ? <Component /> : <SidebarContent><Component /></SidebarContent>}
      {!isImageLedDashboard && <BottomNav />}
    </>
  );
}

function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const isManusPreview = import.meta.env.DEV;

  if (isManusPreview) {
    return <Redirect to="/owner?preview=owner" />;
  }
  
  if (isLoading) return <LoadingScreen />;
  
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

  if (isLoading) return <LoadingScreen />;

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
    return <Redirect to={roleRedirects[user.role] || '/'} />;
  }

  return <Onboarding />;
}

function SetupRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  if (!user?.role) {
    return <Redirect to="/onboarding" />;
  }

  if (user.role === 'ADMIN') {
    return <Redirect to="/admin" />;
  }

  return <Setup />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardRedirect} />
      <Route path="/onboarding" component={OnboardingRoute} />
      <Route path="/setup" component={SetupRoute} />

      <Route path="/admin/maintenance">
        <PrivateRoute component={AdminMaintenance} allowedRoles={['ADMIN']} />
      </Route>
      <Route path="/admin/messages">
        <PrivateRoute component={AdminMessages} allowedRoles={['ADMIN']} />
      </Route>
      <Route path="/admin">
        <PrivateRoute component={AdminDashboard} allowedRoles={['ADMIN']} />
      </Route>
      <Route path="/owner">
        <PrivateRoute component={OwnerImageDashboard} allowedRoles={['OWNER', 'ADMIN']} />
      </Route>
      <Route path="/tenant">
        <PrivateRoute component={TenantDashboard} allowedRoles={['TENANT', 'ADMIN']} />
      </Route>
      <Route path="/ledger">
        <PrivateRoute component={Ledger} allowedRoles={['ADMIN', 'OWNER', 'TENANT']} />
      </Route>
      <Route path="/verify">
        <PrivateRoute component={Verify} allowedRoles={['TENANT', 'OWNER']} />
      </Route>
      <Route path="/agreement">
        <PrivateRoute component={AgreementPage} allowedRoles={['TENANT', 'OWNER']} />
      </Route>
      <Route path="/messages">
        <PrivateRoute component={Messages} allowedRoles={['TENANT', 'OWNER', 'ADMIN']} />
      </Route>
      <Route path="/maintenance">
        <PrivateRoute component={Maintenance} allowedRoles={['TENANT', 'OWNER', 'ADMIN']} />
      </Route>
      <Route path="/profile">
        <PrivateRoute component={ProfilePage} allowedRoles={['TENANT', 'OWNER', 'ADMIN']} />
      </Route>
      <Route path="/notifications">
        <PrivateRoute component={NotificationsPage} allowedRoles={['TENANT', 'OWNER', 'ADMIN']} />
      </Route>

      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={Refund} />
      <Route path="/support" component={Support} />
      <Route path="/about" component={About} />

      <Route component={NotFound} />
    </Switch>
  );
}

function ConditionalLegalFooter() {
  const [location] = useLocation();
  const tenantPaths = ["/tenant", "/owner", "/ledger", "/verify", "/agreement", "/messages", "/maintenance", "/profile", "/notifications"];
  const pathname = location.split("?")[0];
  return tenantPaths.includes(pathname) ? null : <LegalFooter />;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <SidebarProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <ConditionalLegalFooter />
            </TooltipProvider>
          </SidebarProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
