import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { isAuthenticated } from "./lib/auth";
import AdminPage from "@epm/components/web/pages/AdminPage";
import LogoutPage from "@epm/components/web/pages/LogoutPage";
import MatchesPage from "@epm/components/web/pages/MatchesPage";
import MessagesInboxPage from "@epm/components/web/pages/MessagesInboxPage";
import MessageThreadPage from "@epm/components/web/pages/MessageThreadPage";
import NotificationsPage from "@epm/components/web/pages/NotificationsPage";
import PitchBrowsePage from "@epm/components/web/pages/PitchBrowsePage";
import PitchEditPage from "@epm/components/web/pages/PitchEditPage";
import PitchMyPage from "@epm/components/web/pages/PitchMyPage";
import PitchNewPage from "@epm/components/web/pages/PitchNewPage";
import ProfilePage from "@epm/components/web/pages/ProfilePage";
import SignInPage from "@epm/components/web/pages/SignInPage";
import SignUpPage from "@epm/components/web/pages/SignUpPage";

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignUpPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signin"
            element={
              <PublicOnlyRoute>
                <SignInPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logout"
            element={
              <ProtectedRoute>
                <LogoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pitches/new"
            element={
              <ProtectedRoute>
                <PitchNewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pitches/my"
            element={
              <ProtectedRoute>
                <PitchMyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pitches/:id/edit"
            element={
              <ProtectedRoute>
                <PitchEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pitches/browse"
            element={
              <ProtectedRoute>
                <PitchBrowsePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <MatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesInboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:id"
            element={
              <ProtectedRoute>
                <MessageThreadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
