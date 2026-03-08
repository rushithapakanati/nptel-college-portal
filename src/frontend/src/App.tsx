import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AppProvider } from "./context/AppContext";
import CollegeSelectPage from "./pages/CollegeSelectPage";
import DeanDashboard from "./pages/DeanDashboard";
import HODDashboard from "./pages/HODDashboard";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";

// ── Root route ────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

// ── Home ──────────────────────────────────────────────────────────────────────
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

// ── College select ────────────────────────────────────────────────────────────
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
  component: StudentDashboard,
});

// ── HOD dashboard ─────────────────────────────────────────────────────────────
const hodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/college/$collegeName/hod/$branch",
  component: HODDashboard,
});

// ── Dean dashboard ────────────────────────────────────────────────────────────
const deanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/college/$collegeName/dean",
  component: DeanDashboard,
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
