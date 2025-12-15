import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const IconSave = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTarget = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;

interface Props {
  pacienteData: any;
  userUid: string;
  notas: any[];
  onVerTest: (nota: any) => void;
  onNuevaPrueba: () => void; 
}

export const ExpedienteClinico: React.FC<Props> = ({ pacienteData, userUid, notas, onVerTest, onNuevaPrueba }) => {
  // Estado local para el formulario
  const [perfil, setPerfil] = useState({
      nombreReal: "",
      telefono: "",
      fechaNacimiento: "",
      contactoEmergencia: "",
      diagnostico: "",
      medicacion: ""
  });

  // --- EFECTO DE SINCRONIZACIÓN (NUEVO) ---
  // Este useEffect asegura que si pacienteData llega tarde (por internet lento),
  // el formulario se actualice con los datos reales y no se quede vacío.
  useEffect(() => {
      if (pacienteData) {
          // Debug para ver si llega el objetivo
          console.log("Datos de paciente recibidos en Expediente:", pacienteData);
          
          setPerfil({
              nombreReal: pacienteData.nombreReal || "",
              telefono: pacienteData.telefono || "",
              fechaNacimiento: pacienteData.fechaNacimiento || "",
              contactoEmergencia: pacienteData.contactoEmergencia || "",
              diagnostico: pacienteData.diagnostico || "",
              medicacion: pacienteData.medicacion || ""
          });
      }
  }, [pacienteData]);

  const guardarCambios = async () => {
      try { await updateDoc(doc(db, "users", userUid, "pacientes", pacienteData.id), perfil); alert("Datos actualizados."); } 
      catch (e) { alert("Error al guardar."); }
  };

  const evaluaciones = notas.filter(n => n.tipo && n.tipo.startsWith('evaluacion'));

  const getNombreTest = (test: any) => {
      const tipo = test.tipo || "";
      if (tipo.includes('diva')) return "Entrevista DIVA-5";
      if (tipo.includes('beck')) return "Inventario Beck (BAI)";
      if (tipo.includes('phq9')) return "Cuestionario PHQ-9";
      return test.titulo?.replace('Resultados ', '') || 'Test Genérico';
  };

  const getEtiquetaResultado = (test: any) => {
    const pt = test.puntajes || {};
    if (test.tipo && test.tipo.includes('diva')) return "Ver Informe"; 
    if (pt.nivel) return pt.nivel;
    if (pt.puntaje !== undefined) return `${pt.puntaje} pts`;
    return "Consultar";
  };

  // --- LECTURA SEGURA DEL OBJETIVO ---
  // Intentamos leer el formato nuevo (Objeto) o el viejo (String)
  const objetivoData = pacienteData?.objetivoPersonalData || {};
  const objetivoTitulo = objetivoData.titulo || pacienteData?.objetivoPersonal || "No definido por el paciente";
  const objetivoAcciones = Array.isArray(objetivoData.acciones) ? objetivoData.acciones : [];

  return (
    <div style={{animation: 'fadeIn 0.3s', display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
        
        {/* COLUMNA IZQUIERDA: DATOS Y OBJETIVO */}
        <div style={{flex: 1, minWidth: '300px'}}>
            
            {/* SECCIÓN 1: FICHA TÉCNICA */}
            <h3 style={{color: 'var(--secondary)', borderBottom: '1px solid var(--secondary)', paddingBottom: '10px', marginTop: 0}}>FICHA TÉCNICA</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'15px'}}>
               {['nombreReal','fechaNacimiento','telefono','contactoEmergencia'].map(f => (
                   <div key={f}><label style={{fontSize:'0.8rem', color:'#94A3B8', textTransform:'capitalize'}}>{f.replace(/([A-Z])/g, ' $1')}</label>
                   {/* @ts-ignore */}
                   <input type={f.includes('fecha')?'date':'text'} value={perfil[f]} onChange={e => setPerfil({...perfil, [f]: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(15, 23, 42, 0.6)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', borderRadius:'8px'}} /></div>
               ))}
            </div>
            <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.8rem', color:'#94A3B8'}}>Diagnóstico</label><input type="text" value={perfil.diagnostico} onChange={e => setPerfil({...perfil, diagnostico: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(15, 23, 42, 0.6)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', borderRadius:'8px'}} /></div>
            <div style={{marginBottom:'20px'}}><label style={{fontSize:'0.8rem', color:'#94A3B8'}}>Medicación</label><textarea value={perfil.medicacion} onChange={e => setPerfil({...perfil, medicacion: e.target.value})} style={{width:'100%', height:'80px', padding:'10px', background:'rgba(15, 23, 42, 0.6)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', borderRadius:'8px'}} /></div>
            
            <button onClick={guardarCambios} className="btn-primary" style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'40px'}}><IconSave /> GUARDAR CAMBIOS</button>

            {/* SECCIÓN 2: ENFOQUE / OBJETIVO */}
            <h3 style={{color: '#EC4899', borderBottom: '1px solid #EC4899', paddingBottom: '10px', marginTop: 0}}>ENFOQUE DEL PACIENTE</h3>
            <div style={{background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '12px', padding: '20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                    <IconTarget />
                    <span style={{color:'#EC4899', fontWeight:'bold', fontSize:'0.9rem'}}>OBJETIVO PRINCIPAL</span>
                </div>
                
                {/* Muestra el título o un placeholder si está vacío */}
                <div style={{fontSize:'1.1rem', color:'white', fontStyle:'italic', marginBottom:'20px'}}>
                    "{objetivoTitulo}"
                </div>

                {objetivoAcciones.length > 0 ? (
                    <>
                        <div style={{fontSize:'0.8rem', color:'#94A3B8', marginBottom:'10px'}}>ACCIONES CLAVE DEFINIDAS:</div>
                        <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                            {objetivoAcciones.map((accion: string, idx: number) => (
                                <span key={idx} style={{background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:'15px', fontSize:'0.85rem', color:'#E2E8F0'}}>
                                    • {accion}
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>Sin acciones clave definidas.</div>
                )}
            </div>

        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div style={{flex: 1, minWidth: '300px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid var(--secondary)', paddingBottom: '10px', marginBottom:'15px'}}>
                <h3 style={{color: 'var(--secondary)', margin: 0}}>HISTORIAL PSICOMÉTRICO</h3>
                <button onClick={onNuevaPrueba} style={{background: 'var(--primary)', color: 'black', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px'}}><IconPlus /> NUEVA PRUEBA</button>
            </div>
            
            <div style={{background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.1)'}}>
                {evaluaciones.length === 0 ? <div style={{padding:'30px', textAlign:'center', color:'#64748b'}}>No hay pruebas registradas.</div> : (
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                        <thead><tr style={{background:'rgba(0,0,0,0.2)', textAlign:'left'}}><th style={{padding:'12px', color:'#94A3B8', fontSize:'0.8rem'}}>FECHA</th><th style={{padding:'12px', color:'#94A3B8', fontSize:'0.8rem'}}>PRUEBA</th><th style={{padding:'12px', color:'#94A3B8', fontSize:'0.8rem'}}>RESULTADO</th><th style={{padding:'12px'}}></th></tr></thead>
                        <tbody>
                            {evaluaciones.map((test) => (
                                <tr key={test.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                    <td style={{padding:'12px', color:'#E2E8F0', fontSize:'0.9rem'}}>{new Date(test.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                                    <td style={{padding:'12px', color:'white', fontWeight:'bold', fontSize:'0.9rem'}}>{getNombreTest(test)}</td>
                                    <td style={{padding:'12px'}}>
                                        <span style={{background: test.tipo?.includes('diva') ? 'rgba(139, 92, 246, 0.1)' : 'rgba(34, 211, 238, 0.1)', color: test.tipo?.includes('diva') ? '#a78bfa' : '#22d3ee', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap'}}>
                                            {getEtiquetaResultado(test)}
                                        </span>
                                    </td>
                                    <td style={{padding:'12px'}}><button onClick={() => onVerTest(test)} style={{background: 'transparent', border: '1px solid #64748b', color: '#E2E8F0', borderRadius: '6px', cursor: 'pointer', padding: '4px 8px'}}><IconEye /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    </div>
  );
};