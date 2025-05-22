
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LoggingService, enhanceLogging } from './lib/logging.ts'

// Activar el sistema de logging mejorado
enhanceLogging();

// Registrar el inicio de la aplicación
LoggingService.info('app', 'Aplicación iniciada', {
  timestamp: new Date().toISOString(),
  environment: import.meta.env.MODE,
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  screenSize: {
    width: window.screen.width,
    height: window.screen.height
  }
}).catch(error => {
  console.error('Error al registrar inicio de la aplicación:', error)
})

createRoot(document.getElementById("root")!).render(<App />);
