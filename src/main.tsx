import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'                 <-- COMENTA ESTA LÍNEA (PONLE //)
//import { DivaLab } from './dev/DivaLab' // <-- AGREGA ESTA LÍNEA

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}   {/* <-- COMENTA EL APP REAL */}
    <DivaLab />       {/* <-- ACTIVA EL LABORATORIO */}
  </StrictMode>,
)