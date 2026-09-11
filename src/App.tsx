import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";
import i18n from "@/i18n";

import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Feed from "./pages/Feed";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import SpotDetail from "./pages/SpotDetail";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import ResetPassword from "./pages/ResetPassword";
import InstallBanner from "./components/InstallBanner";

// Lazy load secondary/heavy pages so they don't bloat the initial bundle
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Publish = lazy(() => import("./pages/Publish"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const LeadMagnet = lazy(() => import("./pages/LeadMagnet"));
const Contatti = lazy(() => import("./pages/Contatti"));
const InstallaApp = lazy(() => import("./pages/InstallaApp"));
const SearchPage = lazy(() => import("./pages/Search"));
const Invite = lazy(() => import("./pages/Invite"));
const SpotMap = lazy(() => import("./pages/SpotMap"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const FlyFishingRegion = lazy(() => import("./pages/FlyFishingRegion"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminSpots = lazy(() => import("./pages/admin/AdminSpots"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminBlogEditor = lazy(() => import("./pages/admin/AdminBlogEditor"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));

let lastNetworkToast = 0;
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err: any) => {
      const msg = String(err?.message || err || '');
      const isNet =
        !navigator.onLine ||
        /Failed to fetch|NetworkError|network error|timeout|ECONNRESET|ENOTFOUND/i.test(msg);
      if (!isNet) return;
      const now = Date.now();
      if (now - lastNetworkToast < 10_000) return;
      lastNetworkToast = now;
      toast.warning(i18n.t('network.weakSignal'), {
        description: i18n.t('network.retrying'),
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, err: any) => {
        const msg = String(err?.message || err || '');
        const isNet = /Failed to fetch|NetworkError|timeout/i.test(msg);
        return isNet && failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
};

const LazyFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  <Route path="/" element={<Feed />} />
                  <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/register" element={<Navigate to="/auth" replace />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                  <Route path="/mappa" element={<SpotMap />} />
                  <Route path="/map" element={<Navigate to="/mappa" replace />} />
                  <Route path="/spot/:spotId" element={<SpotDetail />} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/publish" element={<ProtectedRoute><Publish /></ProtectedRoute>} />
                <Route path="/post/:postId" element={<PostDetail />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogArticle />} />
                <Route path="/contatti" element={<Contatti />} />
                <Route path="/fly-fishing-italy" element={<FlyFishingRegion />} />
                <Route path="/fly-fishing-italy/:region" element={<FlyFishingRegion />} />
                <Route path="/fly-fishing-guide-italy" element={<LeadMagnet />} />
                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
                <Route path="/admin/spots" element={<AdminRoute><AdminSpots /></AdminRoute>} />
                <Route path="/admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/audit-log" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
                <Route path="/admin/system" element={<AdminRoute><AdminSystem /></AdminRoute>} />
                <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
                <Route path="/admin/blog/nuovo" element={<AdminRoute><AdminBlogEditor /></AdminRoute>} />
                <Route path="/admin/blog/:id/modifica" element={<AdminRoute><AdminBlogEditor /></AdminRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/installa-app" element={<InstallaApp />} />
                <Route path="/cerca" element={<SearchPage />} />
                <Route path="/invito/:username" element={<Invite />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <InstallBanner />
          </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
