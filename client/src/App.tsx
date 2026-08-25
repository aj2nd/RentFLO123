/**
 * Design integration: the supplied tenant dashboard image owns its full-screen
 * canvas, so only the top shell navigation is suppressed on /tenant while the
 * shared tenant bottom navigation remains available across every tenant page.
 */
import { Switch, Route, Redirect, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

const NotFound = lazy(() => import("@/pages/not-found"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Setup = lazy(() => import("@/pages/Setup"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminMaintenance = lazy(() => import("@/pages/AdminMaintenance"));
const AdminMessages = lazy(() => import("@/pages/AdminMessages"));
const OwnerImageDashboard = lazy(() => import("@/pages/OwnerImageDashboard"));
const TenantDashboard = lazy(() => import("@/pages/TenantDashboard"));
const Ledger = lazy(() => import("@/pages/Ledger"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Refund = lazy(() => import("@/pages/Refund"));
const Support = lazy(() => import("@/pages/Support"));
const About = lazy(() => import("@/pages/About"));
const Verify = lazy(() => import("@/pages/Verify"));
const AgreementPage = lazy(() => import("@/pages/Agreement"));
const Messages = lazy(() => import("@/pages/Messages"));
const Maintenance = lazy(() => import("@/pages/Maintenance"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const NotificationsPage = lazy(() => import("@/pages/Notifications"));
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
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
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
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ConditionalLegalFooter />
          </TooltipProvider>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
