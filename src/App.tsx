import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import VerifyEmail from './pages/public/VerifyEmail';
import Privacy from './pages/public/Privacy';
import Terms from './pages/public/Terms';
import Contact from './pages/public/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/user/Dashboard';
import Profile from './pages/user/Profile';
import AccountMonitor from './pages/user/AccountMonitor';
import ModuleStore from './pages/user/ModuleStore';
import Crypto from './pages/user/Crypto';
import Investments from './pages/user/Investments';
import CreditCards from './pages/user/credit-cards/CreditCards';
import CreditCardDetail from './pages/user/credit-cards/CreditCardDetail';
import Subscriptions from './pages/user/subscriptions/Subscriptions';
import SharedSubscriptions from './pages/user/subscriptions/SharedSubscriptions';
import Loans from './pages/user/loans/Loans';
import LoanDetail from './pages/user/loans/LoanDetail';
import LoanSimulator from './pages/user/loans/LoanSimulator';
import LoanRequest from './pages/user/loans/LoanRequest';
import Portfolio from './pages/user/portfolio/Portfolio';
import PortfolioDetail from './pages/user/portfolio/PortfolioDetail';
import AdminHome from './pages/admin/AdminHome';
import AdminRequests from './pages/admin/AdminRequests';
import AdminActiveLoans from './pages/admin/AdminActiveLoans';
import AdminLoanDetail from './pages/admin/AdminLoanDetail';
import AdminPayments from './pages/admin/AdminPayments';
import AdminBanks from './pages/admin/AdminBanks';
import AdminMigration from './pages/admin/AdminMigration';
import AdminReferrals from './pages/admin/AdminReferrals';
import AdminUsers from './pages/admin/AdminUsers';

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