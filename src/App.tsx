import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; 
import CreditCards from './pages/CreditCards';
import CreditCardDetail from './pages/CreditCardDetail';
import Subscriptions from './pages/Subscriptions';
import SharedSubscriptions from './pages/SharedSubscriptions';
import Portfolio from './pages/Portfolio';
import PortfolioDetail from './pages/PortfolioDetail';
import Crypto from './pages/Crypto';
import Loans from './pages/Loans';
import LoanDetail from './pages/LoanDetail';
import AdminLoanDetail from './pages/AdminLoanDetail';
import Register from './pages/Register';
import Landing from './pages/Landing';
import AdminRequests from './pages/AdminRequests';
import AdminActiveLoans from './pages/AdminActiveLoans';
import AdminMigration from './pages/AdminMigration';
import AdminPayments from './pages/AdminPayments';
import AdminBanks from './pages/AdminBanks';
import Profile from './pages/Profile';
import AdminHome from './pages/AdminHome';
import AdminReferrals from './pages/AdminReferrals';
import AdminUsers from './pages/AdminUsers';
import Investments from './pages/Investments';
import LoanSimulator from './pages/LoanSimulator';
import LoanRequest from './pages/LoanRequest';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AccountMonitor from './pages/AccountMonitor';
import ModuleStore from './pages/ModuleStore';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';

type FlagKey = 'hasCreditCardsModule' | 'hasLoansModule' | 'hasCryptoModule' | 'hasStockMarketModule' | 'hasCompoundInterestModule' | 'hasSubscriptionsModule' | 'hasMakeMoneyModule';

function getFlag(key: FlagKey): boolean {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (key === 'hasLoansModule' || key === 'hasMakeMoneyModule') return parsed[key] !== false;
    return parsed[key] === true;
  } catch { return false; }
}

function ModuleRoute({ flag }: { flag: FlagKey }) {
  return getFlag(flag) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors theme="dark" position="top-right" />
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Rutas Protegidas (El Guardián envuelve todo lo que está adentro) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Pantallas en construcción del Sidebar */}
          <Route element={<ModuleRoute flag="hasCreditCardsModule" />}>
            <Route path="/credit-cards" element={<CreditCards />} />
            <Route path="/credit-cards/:id" element={<CreditCardDetail />} />
          </Route>
          <Route element={<ModuleRoute flag="hasSubscriptionsModule" />}>
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/subscriptions/shared" element={<SharedSubscriptions />} />
          </Route>
          <Route element={<ModuleRoute flag="hasLoansModule" />}>
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/simulator" element={<LoanSimulator />} />
            <Route path="/loans/request" element={<LoanRequest />} />
            <Route path="/loans/:id" element={<LoanDetail />} />
          </Route>
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<PortfolioDetail />} />

          <Route element={<ModuleRoute flag="hasCryptoModule" />}>
            <Route path="/crypto" element={<Crypto />} />
          </Route>
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/active-loans" element={<AdminActiveLoans />} />
          <Route path="/admin/loans/:id" element={<AdminLoanDetail />} />
          <Route path="/admin/migration" element={<AdminMigration />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/banks" element={<AdminBanks />} />
          <Route path="/admin/home" element={<AdminHome />} />
          <Route path="/admin/referrals" element={<AdminReferrals />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/profile" element={<Profile />} />
          <Route element={<ModuleRoute flag="hasMakeMoneyModule" />}>
            <Route path="/investments" element={<Investments />} />
          </Route>
          <Route path="/monitor-cuentas" element={<AccountMonitor />} />
          <Route path="/tienda" element={<ModuleStore />} />
        </Route>
        
        {/* Ruta comodín para URLs que de verdad no existen */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;