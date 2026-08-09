import { lazy, Suspense, type ComponentType } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

/**
 * Chargement différé des pages.
 *
 * Auparavant, les 24 pages étaient importées statiquement via le barrel
 * `@/pages`, ce qui produisait un chunk unique de 2 329 kB (662 kB gzip) :
 * tout visiteur de la page d'accueil téléchargeait le back-office, le
 * générateur de CV, recharts, xlsx, jspdf et emoji-mart avant le premier rendu.
 *
 * Les pages exposant des exports nommés, on remappe vers `default` — c'est ce
 * qu'attend `React.lazy`.
 */
function lazyNamed<T extends string>(
  loader: () => Promise<Record<T, ComponentType<any>>>,
  name: T,
) {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}

const Landing = lazyNamed(() => import("@/pages/Landing"), "Landing");
const Login = lazyNamed(() => import("@/pages/Login"), "Login");
const ForgotPassword = lazyNamed(() => import("@/pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyNamed(() => import("@/pages/ResetPassword"), "ResetPassword");
const AuthCallback = lazyNamed(() => import("@/pages/AuthCallback"), "AuthCallback");

const Dashboard = lazyNamed(() => import("@/pages/Dashboard"), "Dashboard");
const Offres = lazyNamed(() => import("@/pages/Offres"), "Offres");
const OffreDetail = lazyNamed(() => import("@/pages/OffreDetail"), "OffreDetail");
const CVBuilder = lazyNamed(() => import("@/pages/CVBuilder"), "CVBuilder");
const Chatbot = lazyNamed(() => import("@/pages/Chatbot"), "Chatbot");
const Favoris = lazyNamed(() => import("@/pages/Favoris"), "Favoris");
const Retours = lazyNamed(() => import("@/pages/Retours"), "Retours");
const Profile = lazyNamed(() => import("@/pages/Profile"), "Profile");
const Messagerie = lazyNamed(() => import("@/pages/Messagerie"), "Messagerie");
const FeedbackPage = lazyNamed(() => import("@/pages/Feedback"), "FeedbackPage");
const FeedbackDetail = lazyNamed(() => import("@/pages/FeedbackDetail"), "FeedbackDetail");

const AdminDashboard = lazyNamed(() => import("@/pages/admin/AdminDashboard"), "AdminDashboard");
const AdminUsers = lazyNamed(() => import("@/pages/admin/AdminUsers"), "AdminUsers");
const AdminUserDetails = lazyNamed(() => import("@/pages/admin/AdminUserDetails"), "AdminUserDetails");
const AdminOffres = lazyNamed(() => import("@/pages/admin/AdminOffres"), "AdminOffres");
const AdminOffreForm = lazyNamed(() => import("@/pages/admin/AdminOffreForm"), "AdminOffreForm");
const AdminFeedback = lazyNamed(() => import("@/pages/admin/AdminFeedback"), "AdminFeedback");
const AdminFeedbackDetail = lazyNamed(() => import("@/pages/admin/AdminFeedbackDetail"), "AdminFeedbackDetail");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected routes with dashboard layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/offres" element={<Offres />} />
                  <Route path="/offres/:id" element={<OffreDetail />} />
                  <Route path="/cv" element={<CVBuilder />} />
                  <Route path="/chatbot" element={<Chatbot />} />
                  <Route path="/favoris" element={<Favoris />} />
                  <Route path="/retours" element={<Retours />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messagerie" element={<Messagerie />} />
                  <Route path="/feedback" element={<FeedbackPage />} />
                  <Route path="/feedback/:id" element={<FeedbackDetail />} />

                  {/* Admin routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users/:id"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminUserDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/offres"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminOffres />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/offres/new"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminOffreForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/offres/:id/edit"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminOffreForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/feedback"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminFeedback />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/feedback/:id"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminFeedbackDetail />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
