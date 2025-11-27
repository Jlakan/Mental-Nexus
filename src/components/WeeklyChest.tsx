import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG } from '../game/GameAssets';

interface Props {
  habitos: any[];
  userUid: string;
  psicologoId: string;
  userData: any;
}

export function WeeklyChest({ habitos, userUid, psicologoId, userData }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [luckPercent, setLuckPercent] = useState(1);
  
  // Determinamos si hoy es día de abrir (Domingo=0, Lunes=1)
  const today = new Date().getDay();
  const isOpeningDay = today === 0 || today === 1; // Domingo o Lunes
  
  // ID de la semana actual para saber si ya se reclamó
  const getWeekId = () => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
  };
  const currentWeekId = getWeekId();
  
  const isClaimed = userData.claimedChests?.includes(currentWeekId);

  // Calcular Suerte basada en hábitos completados (Meta cumplida)
  useEffect(() => {
      const habitosCompletados = habitos.filter(h => {
          const checks = Object.values(h.registro || {}).filter(v => v === true).length;
          const meta = h.frecuenciaMeta || 7;
          return checks >= meta;
      }).length;

      // Base 1% + 3% por cada hábito completado al 100%
      // Ejemplo: 3 hábitos completados = 1 + (3*3) = 10% de probabilidad de Nexo
      setLuckPercent(1 + (habitosCompletados * 3));
  }, [habitos]);

  const openChest = async () => {
    if (isClaimed || !isOpeningDay) return;

    // --- ALGORITMO DE LOTERÍA (LOOT BOX) ---
    const roll = Math.random() * 100; // 0 a 100
    let premio = { type: 'gold', amount: 0, label: 'Fondos Extra' };

    // 1. Intento de NEXO (Legendario) - Probabilidad basada en luckPercent
    if (roll <= luckPercent) {
        premio = { type: 'nexo', amount: 1, label: '¡NEXO LEGENARIO!' };
    } 
    // 2. Intento de STAT (Raro) - 15% fijo
    else if (roll <= (luckPercent + 15)) {
        const stats = ['vitalidad', 'sabiduria', 'carisma'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        premio = { type: randomStat, amount: 3, label: 'Mejora de Sistema (+3)' };
    } 
    // 3. Consuelo (Común) - Dinero
    else {
        premio = { type: 'gold', amount: 200, label: 'Bono de Fondos' };
    }

    setReward(premio);
    setIsOpen(true);

    // GUARDAR EN FIREBASE
    try {
        const updates: any = {
            claimedChests: arrayUnion(currentWeekId) // Marcar semana como cobrada
        };

        if (premio.type === 'nexo') updates['nexo'] = increment(1);
        else if (premio.type === 'gold') updates['gold'] = increment(premio.amount);
        else updates[`stats.${premio.type}`] = increment(premio.amount);

        // Actualizar en subcolección del paciente
        await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), updates);
    } catch (e) { console.error("Error guardando premio", e); }
  };

  // Si ya lo cobró esta semana, no mostramos nada (o mostramos uno gris)
  if (isClaimed) return (
      <div style={{textAlign:'center', opacity:0.5, padding:'20px', border:'1px dashed gray', borderRadius:'12px', marginBottom:'30px'}}>
          <p>✅ Cofre semanal reclamado. ¡Vuelve el próximo Domingo!</p>
      </div>
  );

  return (
    <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--secondary)', borderRadius: '20px', 
        padding: '20px', marginBottom: '30px', textAlign: 'center', position: 'relative', overflow: 'hidden'
    }}>
      {/* Fondo decorativo de rayos */}
      <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)', zIndex:0}}></div>

      <div style={{position:'relative', zIndex:1}}>
        <h3 style={{margin:0, color:'var(--secondary)', fontFamily:'Rajdhani'}}>SUMINISTRO SEMANAL</h3>
        
        {!isOpen ? (
            <div onClick={openChest} style={{cursor: isOpeningDay ? 'pointer' : 'not-allowed', margin:'20px 0'}}>
                <img 
                    src={isOpeningDay ? "/cofre_listo.png" : "/cofre_cerrado.png"} 
                    style={{
                        width:'120px', 
                        filter: isOpeningDay ? 'drop-shadow(0 0 15px var(--secondary))' : 'grayscale(0.8)',
                        animation: isOpeningDay ? 'pulse 2s infinite' : 'none'
                    }} 
                />
                <div style={{marginTop:'10px'}}>
                    {isOpeningDay ? (
                        <button className="btn-primary" style={{fontSize:'1.2rem'}}>¡ABRIR AHORA!</button>
                    ) : (
                        <p style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>Disponible: Domingo/Lunes</p>
                    )}
                </div>
            </div>
        ) : (
            <div style={{animation:'fadeIn 0.5s'}}>
                <img src="/cofre_abierto.png" style={{width:'120px', marginBottom:'10px'}} />
                <h2 style={{color:'white', fontSize:'1.5rem', textShadow:'0 0 10px white'}}>¡RECOMPENSA OBTENIDA!</h2>
                
                <div style={{background:'rgba(255,255,255,0.1)', padding:'15px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'15px', marginTop:'10px'}}>
                    <img 
                        src={premioToIcon(reward.type)} 
                        style={{width:'50px', height:'50px', objectFit:'contain'}} 
                    />
                    <div style={{textAlign:'left'}}>
                        <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#FBBF24'}}>+{reward.amount}</div>
                        <div style={{fontSize:'0.8rem', color:'white'}}>{reward.label}</div>
                    </div>
                </div>
            </div>
        )}

        {/* Barra de Suerte */}
        {!isOpen && (
            <div style={{marginTop:'15px', background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'10px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'5px'}}>
                    <span>Probabilidad de Objeto Legendario</span>
                    <span style={{color:'var(--secondary)', fontWeight:'bold'}}>{luckPercent}% Suerte</span>
                </div>
                <div style={{width:'100%', height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'3px'}}>
                    <div style={{width: `${Math.min(100, luckPercent * 2)}%`, height:'100%', background:'var(--secondary)', borderRadius:'3px', boxShadow:'0 0 10px var(--secondary)'}}></div>
                </div>
                <p style={{fontSize:'0.7rem', margin:'5px 0 0 0', fontStyle:'italic', color:'var(--text-muted)'}}>Completa más hábitos al 100% para aumentar tu suerte.</p>
            </div>
        )}
      </div>
    </div>
  );
}

// Helper para obtener icono
const premioToIcon = (type: string) => {
    if (type === 'nexo') return STATS_CONFIG.nexo.icon;
    if (type === 'gold') return STATS_CONFIG.gold.icon;
    // @ts-ignore
    return STATS_CONFIG[type]?.icon || "";
};