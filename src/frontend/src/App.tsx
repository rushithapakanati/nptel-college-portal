import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { AppProvider } from "./context/AppContext";
// Small pages kept in the main bundle — needed immediately on load
import CollegeSelectPage from "./pages/CollegeSelectPage";
import LoginPage from "./pages/LoginPage";
import PortalPage from "./pages/PortalPage";
import YearSelectPage from "./pages/YearSelectPage";

// Heavy dashboard pages — lazy-loaded to reduce initial bundle size
const DeanDashboard = lazy(() => import("./pages/DeanDashboard"));
const HODDashboard = lazy(() => import("./pages/HODDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));

// ── Suspense fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    </div>
  );
}

// ── Root route ────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

// ── Year select (homepage) ────────────────────────────────────────────────────
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: YearSelectPage,
});

// ── Portal (college selection) ────────────────────────────────────────────────
const portalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal",
  component: PortalPage,
});

// ── College select (role selection) ──────────────────────────────────────────
const collegeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/college/$collegeName",
  component: CollegeSelectPage,
});

// ── Login ─────────────────────────────────────────────────────────────────────
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/college/$collegeName/login/$role",
  component: LoginPage,
});

// ── Student dashboard ─────────────────────────────────────────────────────────
const studentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/college/$collegeName/student",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <StudentDashboard />
    </Suspense>
  ),
});

// ── HOD dashboard ─────────────────────────────────────────────────────────────
const hodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/college/$collegeName/hod/$branch",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HODDashboard />
    </Suspense>
  ),
});

// ── Dean dashboard ────────────────────────────────────────────────────────────
const deanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/college/$collegeName/dean",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DeanDashboard />
    </Suspense>
  ),
});

// ── Catch-all → home ──────────────────────────────────────────────────────────
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});

// ── Router ────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  homeRoute,
  portalRoute,
  collegeRoute,
  loginRoute,
  studentRoute,
  hodRoute,
  deanRoute,
  catchAllRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
