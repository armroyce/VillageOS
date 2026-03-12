import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import SuperLogin from './pages/SuperLogin';
import Dashboard from './pages/Dashboard';
import Families from './pages/Families';
import FamilyNew from './pages/FamilyNew';
import FamilyDetail from './pages/FamilyDetail';
import MemberNew from './pages/MemberNew';
import Tax from './pages/Tax';
import TaxCollect from './pages/TaxCollect';
import Expenses from './pages/Expenses';
import ExpenseNew from './pages/ExpenseNew';
import Roles from './pages/Roles';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SuperDashboard from './pages/super/SuperDashboard';
import SuperVillages from './pages/super/SuperVillages';

function ProtectedRoute({ children, superOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (superOnly && !user.is_super_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

function VillageLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function SuperLayout({ children }) {
  return (
    <ProtectedRoute superOnly>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/super/login" element={<SuperLogin />} />

      {/* Village routes */}
      <Route path="/dashboard" element={<VillageLayout><Dashboard /></VillageLayout>} />
      <Route path="/families" element={<VillageLayout><Families /></VillageLayout>} />
      <Route path="/families/new" element={<VillageLayout><FamilyNew /></VillageLayout>} />
      <Route path="/families/:id" element={<VillageLayout><FamilyDetail /></VillageLayout>} />
      <Route path="/members/new/:familyId" element={<VillageLayout><MemberNew /></VillageLayout>} />
      <Route path="/tax" element={<VillageLayout><Tax /></VillageLayout>} />
      <Route path="/tax/collect" element={<VillageLayout><TaxCollect /></VillageLayout>} />
      <Route path="/expenses" element={<VillageLayout><Expenses /></VillageLayout>} />
      <Route path="/expenses/new" element={<VillageLayout><ExpenseNew /></VillageLayout>} />
      <Route path="/roles" element={<VillageLayout><Roles /></VillageLayout>} />
      <Route path="/users" element={<VillageLayout><Users /></VillageLayout>} />
      <Route path="/audit" element={<VillageLayout><Audit /></VillageLayout>} />
      <Route path="/reports" element={<VillageLayout><Reports /></VillageLayout>} />
      <Route path="/settings" element={<VillageLayout><Settings /></VillageLayout>} />

      {/* Super admin routes */}
      <Route path="/super/dashboard" element={<SuperLayout><SuperDashboard /></SuperLayout>} />
      <Route path="/super/villages" element={<SuperLayout><SuperVillages /></SuperLayout>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={user ? (user.is_super_admin ? '/super/dashboard' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
