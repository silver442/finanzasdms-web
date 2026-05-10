import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; 
import CreditCards from './pages/CreditCards';
import CreditCardDetail from './pages/CreditCardDetail';
import Portfolio from './pages/Portfolio';
import Crypto from './pages/Crypto';
import Loans from './pages/Loans';
import Register from './pages/Register';
import Landing from './pages/Landing';
import AdminRequests from './pages/AdminRequests';
import AdminActiveLoans from './pages/AdminActiveLoans';
import AdminMigration from './pages/AdminMigration';
import AdminPayments from './pages/AdminPayments';
import AdminBanks from './pages/AdminBanks';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors theme="dark" position="top-right" />
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas Protegidas (El Guardián envuelve todo lo que está adentro) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Pantallas en construcción del Sidebar */}
          <Route path="/credit-cards" element={<CreditCards />} />
          <Route path="/credit-cards/:id" element={<CreditCardDetail />} />
          <Route 
            path="/loans" 
            element={<Loans/>} />
          <Route path="/portfolio" element={<Portfolio />} />
          
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/active-loans" element={<AdminActiveLoans />} />
          <Route path="/admin/migration" element={<AdminMigration />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/banks" element={<AdminBanks />} />
        </Route>
        
        {/* Ruta comodín para URLs que de verdad no existen */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;