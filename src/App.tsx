import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; 
import CreditCards from './pages/CreditCards';
import CreditCardDetail from './pages/CreditCardDetail';
import Portfolio from './pages/Portfolio';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas (El Guardián envuelve todo lo que está adentro) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Pantallas en construcción del Sidebar */}
          <Route path="/credit-cards" element={<CreditCards />} />
          <Route path="/credit-cards/:id" element={<CreditCardDetail />} />
          <Route 
            path="/loans" 
            element={<div className="p-8 text-emerald-400 text-2xl font-bold">🏦 Módulo de Préstamos (En construcción)</div>} 
          />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route 
            path="/crypto" 
            element={<div className="p-8 text-emerald-400 text-2xl font-bold">🪙 Módulo de Cripto (En construcción)</div>} 
          />
        </Route>
        
        {/* Ruta comodín para URLs que de verdad no existen */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;