import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'          // <--- Asegúrate de que esto esté descomentado
// import { DivaLab } from './dev/DivaLab'  <--- Comenta o borra esto

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />                      {/* <--- ¡Aquí debe decir App, no DivaLab! */}
  </StrictMode>,
)