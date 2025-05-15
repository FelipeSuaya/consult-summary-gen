
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LoggingService } from './lib/logging.ts'

// Registrar el inicio de la aplicación
LoggingService.info('app', 'Aplicación iniciada', {
  timestamp: new Date().toISOString(),
  environment: import.meta.env.MODE
}).catch(error => {
  console.error('Error al registrar inicio de la aplicación:', error)
})

createRoot(document.getElementById("root")!).render(<App />);
