import React, { useState } from 'react';
import { STATS_CONFIG } from '../../game/GameAssets';

interface Props {
  paciente: any;
  habitos: any[];
}

export const TableroResumen: React.FC<Props> = ({ paciente, habitos }) => {
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // --- LÓGICA DE BALANCE ---
  const analizarBalance = () => {
      if (habitos.length === 0) return null;
      const activos = habitos.filter(h => h.estado !== 'archivado');
      
      const stats = { vitalidad: 0, sabiduria: 0, vinculacion: 0 };
      
      activos.forEach(h => {
          if (h.recompensas?.includes('vitalidad')) stats.vitalidad++;
          if (h.recompensas?.includes('sabiduria')) stats.sabiduria++;
          if (h.recompensas?.includes('vinculacion')) stats.vinculacion++;
      });

      const faltantes = [];
      if (stats.vitalidad === 0) faltantes.push("INTEGRIDAD");
      if (stats.sabiduria === 0) faltantes.push("I+D");
      if (stats.vinculacion === 0) faltantes.push("VINCULACIÓN");

      if (faltantes.length > 0) {
          return (
            <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid #F59E0B', color:'#F59E0B', padding:'15px', borderRadius:'12px', marginBottom:'20px', fontSize:'1rem'}}>
                ⚠️ <strong>Balance de Protocolos:</strong> Faltan actividades de <b>{faltantes.join(", ")}</b>.
            </div>
          );
      }
      return null;
  };

  // --- CÁLCULO DE PROGRESO DE HOY ---
  const getProgresoHoy = () => {
      const dias = ["D","L","M","X","J","V","S"];
      const today = dias[new Date().getDay()]; // Ej: "L"
      
      const activos = habitos.filter(h => h.estado !== 'archivado');
      // Filtramos solo los que se deben hacer hoy (si tuvieran configuración de días específica)
      // Por ahora asumimos que todos cuentan si tienen el check
      const completados = activos.filter(h => h.registro?.[today] === true).length;
      
      return { completados, total: activos.length };
  };

  const progreso = getProgresoHoy();

  return (
    <div style={{animation:'fadeIn 0.3s'}}>
        
        {/* GRID DE RECURSOS */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:'15px', marginBottom:'30px'}}>
            
            {/* ORO */}
            <div onClick={() => setSelectedResource({type:'gold', value: paciente.gold})} style={{background:'rgba(15, 23, 42, 0.6)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(148, 163, 184, 0.1)', cursor:'pointer'}}>
                <img src={STATS_CONFIG.gold.icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} />
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#F59E0B'}}>{paciente.gold || 0}</div>
                <div style={{fontSize:'0.7rem', color:'#94A3B8'}}>FONDOS</div>
            </div>

            {/* NEXO */}
            <div onClick={() => setSelectedResource({type:'nexo', value: paciente.nexo})} style={{background:'rgba(15, 23, 42, 0.6)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(139, 92, 246, 0.3)', cursor:'pointer'}}>
                <img src={STATS_CONFIG.nexo.icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} />
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#8B5CF6'}}>{paciente.nexo || 0}</div>
                <div style={{fontSize:'0.7rem', color:'#94A3B8'}}>NEXOS</div>
            </div>

            {/* STATS */}
            {['vitalidad','sabiduria','vinculacion'].map(stat => (
                <div key={stat} onClick={() => setSelectedResource({type:stat, value: paciente.stats?.[stat]})} style={{background:'rgba(15, 23, 42, 0.6)', padding:'15px', borderRadius:'12px', textAlign:'center', cursor:'pointer'}}>
                    {/* @ts-ignore */}
                    <img src={STATS_CONFIG[stat].icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} />
                    {/* @ts-ignore */}
                    <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#E2E8F0'}}>{Number(paciente.stats?.[stat] || 0).toFixed(1)}</div>
                    {/* @ts-ignore */}
                    <div style={{fontSize:'0.7rem', color:'#94A3B8'}}>{STATS_CONFIG[stat].label}</div>
                </div>
            ))}
        </div>

        {/* BALANCE Y RESUMEN */}
        {analizarBalance()}

        <h3 style={{marginTop:0, color:'#F8FAFC', fontFamily:'Rajdhani'}}>RESUMEN DE HOY</h3>
        <div style={{padding:'20px', background:'rgba(30, 41, 59, 0.4)', borderRadius:'12px', border:'1px solid rgba(148, 163, 184, 0.1)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{fontSize:'1.1rem', color:'#E2E8F0'}}>
                Protocolos completados: <strong style={{color:'var(--primary)', fontSize:'1.3rem'}}>{progreso.completados}</strong> <span style={{color:'gray'}}>/ {progreso.total}</span>
            </div>
            {/* Barra de progreso visual */}
            <div style={{width:'150px', height:'10px', background:'rgba(255,255,255,0.1)', borderRadius:'5px', overflow:'hidden'}}>
                <div style={{
                    width: `${progreso.total > 0 ? (progreso.completados / progreso.total)*100 : 0}%`, 
                    height:'100%', 
                    background:'var(--secondary)',
                    transition: 'width 0.5s ease'
                }}></div>
            </div>
        </div>

        {/* MODAL RECURSO (MOVIDO AQUÍ PARA MODULARIDAD) */}
        {selectedResource && (
           <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setSelectedResource(null)}>
               <div style={{background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '600px', width:'100%', boxShadow: '0 0 80px rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
                  {/* @ts-ignore */}
                  <h2 style={{color: selectedResource.type === 'gold' ? '#F59E0B' : (selectedResource.type === 'nexo' ? '#8B5CF6' : 'white'), fontFamily: 'Rajdhani', textTransform:'uppercase', fontSize:'2.5rem', marginBottom:'30px', textShadow: '0 0 20px rgba(0,0,0,0.5)'}}>{STATS_CONFIG[selectedResource.type].label}</h2>
                  {/* @ts-ignore */}
                  <img src={STATS_CONFIG[selectedResource.type].icon} style={{width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '40vh', marginBottom: '30px', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))'}} />
                  <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'white', marginBottom: '10px', lineHeight: 1}}>{Math.floor(selectedResource.value || 0)}<span style={{fontSize:'1.5rem', color:'var(--text-muted)'}}>.{Math.round(((selectedResource.value || 0) - Math.floor(selectedResource.value || 0))*100)}</span></div>
                  <button onClick={() => setSelectedResource(null)} className="btn-primary" style={{marginTop: '40px', width: '200px', fontSize: '1.1rem'}}>ENTENDIDO</button>
              </div>
           </div>
        )}

    </div>
  );
};