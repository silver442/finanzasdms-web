import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { setupAxiosInterceptors } from './utils/axiosInterceptors'

setupAxiosInterceptors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID} locale="es">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
