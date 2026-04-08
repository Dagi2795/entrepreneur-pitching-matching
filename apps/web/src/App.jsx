import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { isAuthenticated } from "./lib/auth";
import LogoutPage from "./pages/LogoutPage";
import PitchBrowsePage from "./pages/PitchBrowsePage";
import PitchEditPage from "./pages/PitchEditPage";
import PitchMyPage from "./pages/PitchMyPage";
import PitchNewPage from "./pages/PitchNewPage";
import ProfilePage from "./pages/ProfilePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import MatchesPage from "./pages/MatchesPage";
import MessagesInboxPage from "./pages/MessagesInboxPage";
import MessageThreadPage from "./pages/MessageThreadPage";

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
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
