import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { CurrentFacilityProvider } from "./context/CurrentFacilityContext";
import { FacilityProvider } from "./context/FacilityContext";
import { FacilityRefreshProvider } from "./context/FacilityRefreshContext";
import { FacilityProjectDataProvider } from "./context/FacilityProjectDataContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Auth/Login";
import AcceptInvitation from "./pages/AcceptInvitation";
import JoinFacility from "./pages/JoinFacility";
import FacilityDashboard from "./pages/Dashboard/FacilityDashboard";
import Facilities from "./pages/Facilities";
import FacilityView from "./pages/Facility/FacilityView";
import TimeLog from "./pages/TimeLog";
import Users from "./pages/Users";
import MenuSettings from "./pages/MenuSettings";
import Notes from "./pages/Notes";
import Meetings from "./pages/Meetings";
import GlobalAnalyticsPage from "./pages/analytics/global";
import FacilityAnalyticsPage from "./pages/analytics/facility/[facilityId]";
import MemberAnalyticsPage from "./pages/analytics/member/[memberId]";
import DashboardLayout from "./components/DashboardLayout";
import PrivateRoute from "./routes/PrivateRoute";
import LoadingAnimation from "./components/LoadingAnimation";

export default function App() {
  return (
    <CurrentFacilityProvider>
      <FacilityProvider>
        <FacilityRefreshProvider>
          <FacilityProjectDataProvider>
            <AppContent />
          </FacilityProjectDataProvider>
        </FacilityRefreshProvider>
      </FacilityProvider>
    </CurrentFacilityProvider>
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
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
          <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
          <Route path="/join-facility/:linkId" element={<JoinFacility />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <FacilityDashboard />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
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
        path="/users"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Users />
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
