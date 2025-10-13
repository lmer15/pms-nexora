import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { CurrentFacilityProvider } from "./context/CurrentFacilityContext";
import { FacilityProvider } from "./context/FacilityContext";
import { FacilityRefreshProvider } from "./context/FacilityRefreshContext";
import { FacilityProjectDataProvider } from "./context/FacilityProjectDataContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotesProvider } from "./context/NotesContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import ToastContainer from "./components/ToastContainer";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import AcceptInvitation from "./pages/AcceptInvitation";
import JoinFacility from "./pages/JoinFacility";
import Facilities from "./pages/Facilities";
import FacilityView from "./pages/Facility/FacilityView";
import TimeLog from "./pages/TimeLog";
import MenuSettings from "./pages/MenuSettings";
import Notes from "./pages/Notes";
import Meetings from "./pages/Meetings";
import GlobalAnalyticsPage from "./pages/analytics/global";
import FacilityAnalyticsPage from "./pages/analytics/facility/[facilityId]";
import MemberAnalyticsPage from "./pages/analytics/member/[memberId]";
import DashboardLayout from "./components/DashboardLayout";
import PrivateRoute from "./routes/PrivateRoute";
import LoadingAnimation from "./components/LoadingAnimation";

function App() {
  return (
    <ThemeProvider>
      <CurrentFacilityProvider>
        <FacilityProvider>
          <FacilityRefreshProvider>
            <FacilityProjectDataProvider>
              <SettingsProvider>
                <NotesProvider>
                  <ToastProvider>
                    <AppContent />
                    <ToastContainerWrapper />
                  </ToastProvider>
                </NotesProvider>
              </SettingsProvider>
            </FacilityProjectDataProvider>
          </FacilityRefreshProvider>
        </FacilityProvider>
      </CurrentFacilityProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/resources/analytics/global" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/resources/analytics/global" replace /> : <Register />}
      />
          <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
          <Route path="/join-facility/:linkId" element={<JoinFacility />} />
      <Route
        path="/Facilities"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Facilities />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/facility/:id"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <FacilityView />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/time-log"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <TimeLog />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/menu-settings"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <MenuSettings />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Notes />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/meetings"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Meetings />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/resources/analytics/global"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <GlobalAnalyticsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/resources/analytics/facility/:facilityId"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <FacilityAnalyticsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/resources/analytics/member/:memberId"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <MemberAnalyticsPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

const ToastContainerWrapper = () => {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onRemoveToast={removeToast} />;
};

export default App;
