import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Landing,
  Login,
  Dashboard,
  Offres,
  OffreDetail,
  CVBuilder,
  Chatbot,
  Favoris,
  Retours,
  Profile,
  AuthCallback,
  Messagerie,
  AdminDashboard,
  AdminUsers,
  AdminUserDetails,
  AdminOffres,
  AdminOffreForm,
  ForgotPassword,
  ResetPassword,
} from "@/pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
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
            </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
