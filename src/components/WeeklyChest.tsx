import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, StatTipo } from '../game/GameAssets';

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
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes
  
  // ==============================================================================
  // 🔴 MODO PRUEBAS: Cambia a 'true' para probar hoy mismo.
  // En producción usa: const isOpeningDay = dayOfWeek === 0 || dayOfWeek === 1;
  const isOpeningDay = true; 
  // ==============================================================================

  const getRewardWeekId = () => {
      const dateToCheck = new Date(now);
      if (dayOfWeek === 1) dateToCheck.setDate(dateToCheck.getDate() - 1);
      
      const d = new Date(Date.UTC(dateToCheck.getFullYear(), dateToCheck.getMonth(), dateToCheck.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  const targetWeekId = getRewardWeekId();
  const isClaimed = userData.claimedChests?.includes(targetWeekId);

  useEffect(() => {
      const habitosCompletados = habitos.filter(h => {
          let checks = 0;
          const meta = h.frecuenciaMeta || 7;
          if (dayOfWeek === 1) {
              const registroPasado = h.historial?.[targetWeekId];
              const datosReales = registroPasado?.registro || registroPasado || {};
              checks = Object.values(datosReales).filter(v => v === true).length;
          } else {
              checks = Object.values(h.registro || {}).filter(v => v === true).length;
          }
          return checks >= meta;
      }).length;

      // Base 5% + 7% por hábito (Más generoso)
      setLuckPercent(5 + (habitosCompletados * 7)); 
  }, [habitos, dayOfWeek, targetWeekId]);

  const openChest = async () => {
    if (isClaimed) return;
    if (!isOpeningDay) return alert("🔒 Disponible solo Domingo o Lunes.");

    const roll = Math.random() * 100; 
    let premio = { type: 'gold', amount: 0, label: 'Fondos Extra' };

    // --- TABLA DE LOOT MEJORADA ---
    if (roll <= luckPercent) {
        // PREMIO LEGENDARIO (Probabilidad basada en hábitos cumplidos)
        premio = { type: 'nexo', amount: 1, label: '¡NEXO LEGENDARIO!' };
        
    } else if (roll <= (luckPercent + 50)) { 
        // PREMIO RARO (Antes era +20, ahora +50 de rango. Mucho más probable)
        const stats: StatTipo[] = ['vitalidad', 'sabiduria', 'vinculacion']; 
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        // Cantidad aleatoria entre 2 y 4 puntos
        const cantidad = Math.floor(Math.random() * 3) + 2; 
        premio = { type: randomStat, amount: cantidad, label: `Mejora de ${STATS_CONFIG[randomStat].label} (+${cantidad})` };
        
    } else {
        // PREMIO COMÚN (Oro variable para que no sea aburrido)
        const goldAmount = Math.floor(Math.random() * 151) + 150; // Entre 150 y 300
        premio = { type: 'gold', amount: goldAmount, label: 'Bono de Fondos' };
    }

    setReward(premio);
    setIsOpen(true);

    try {
        const updates: any = { claimedChests: arrayUnion(targetWeekId) };
        
        if (premio.type === 'nexo') {
            updates['nexo'] = increment(1); 
        } else if (premio.type === 'gold') {
            updates['bonusGold'] = increment(premio.amount); 
        } else {
            updates[`bonusStats.${premio.type}`] = increment(premio.amount); 
        }

        await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), updates);
    } catch (e) { console.error(e); }
  };

  if (isClaimed) return (
      <div style={{textAlign:'center', opacity:0.6, padding:'15px', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:'12px', marginBottom:'30px'}}>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', margin:0}}>✅ Suministro de la semana {targetWeekId} procesado.</p>
      </div>
  );

  return (
    <div style={{
        background: 'var(--bg-card)', border: isOpeningDay ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '20px', padding: '20px', marginBottom: '30px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        boxShadow: isOpeningDay ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'
    }}>
      {!isOpen ? (
            <div onClick={openChest} style={{cursor: isOpeningDay ? 'pointer' : 'default', transition: 'transform 0.1s'}} className={isOpeningDay ? "chest-container" : ""}>
                <h3 style={{margin:'0 0 15px 0', color: isOpeningDay ? 'var(--secondary)' : 'var(--text-muted)', fontFamily:'Rajdhani', letterSpacing:'1px'}}>
                    {dayOfWeek === 1 ? "SUMINISTRO ANTERIOR" : "SUMINISTRO SEMANAL"}
                </h3>
                <img 
                    src={isOpeningDay ? "/cofre_listo.png" : "/cofre_cerrado.png"} 
                    style={{width:'100px', filter: isOpeningDay ? 'drop-shadow(0 0 15px var(--secondary))' : 'grayscale(0.8)', animation: isOpeningDay ? 'pulse 2s infinite' : 'none', opacity: isOpeningDay ? 1 : 0.5}} 
                />
                <div style={{marginTop:'15px'}}>
                    {isOpeningDay ? (
                        <button className="btn-primary" style={{fontSize:'1rem', padding:'8px 20px'}}>ABRIR SUMINISTRO</button>
                    ) : (
                        <span style={{fontSize:'0.75rem', background:'rgba(0,0,0,0.3)', padding:'5px 10px', borderRadius:'6px', color:'var(--text-muted)'}}>🔒 DISPONIBLE DOMINGO/LUNES</span>
                    )}
                </div>
                <div style={{marginTop:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'0.7rem', color:'var(--text-muted)'}}>
                   <span>Probabilidad Legendaria:</span>
                   <span style={{color:'var(--secondary)', fontWeight:'bold'}}>{luckPercent}%</span>
                </div>
            </div>
        ) : (
            <div style={{animation:'fadeIn 0.5s'}}>
                <img src="/cofre_abierto.png" style={{width:'120px', marginBottom:'10px'}} />
                <h2 style={{color:'white', fontSize:'1.4rem', textShadow:'0 0 10px white', margin:'0 0 10px 0'}}>¡RECOMPENSA OBTENIDA!</h2>
                
                <div style={{background:'rgba(255,255,255,0.1)', padding:'15px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'15px'}}>
                     {/* @ts-ignore */}
                    <img src={STATS_CONFIG[reward.type]?.icon || STATS_CONFIG.gold.icon} style={{width:'50px', height:'50px', objectFit:'contain'}} />
                    <div style={{textAlign:'left'}}>
                        <div style={{fontSize:'1.8rem', fontWeight:'bold', color:'#FBBF24', lineHeight:1}}>+{reward.amount}</div>
                        <div style={{fontSize:'0.8rem', color:'white', textTransform:'uppercase'}}>{reward.label}</div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}