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
  
  const today = new Date().getDay();
  const isOpeningDay = today === 0 || today === 1; // Domingo o Lunes
  
  const getWeekId = () => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
  };
  const currentWeekId = getWeekId();
  
  const isClaimed = userData.claimedChests?.includes(currentWeekId);

  useEffect(() => {
      const habitosCompletados = habitos.filter(h => {
          const checks = Object.values(h.registro || {}).filter(v => v === true).length;
          const meta = h.frecuenciaMeta || 7;
          return checks >= meta;
      }).length;
      setLuckPercent(1 + (habitosCompletados * 3));
  }, [habitos]);

  const openChest = async () => {
    if (isClaimed) return alert("✅ YA RECLAMADO: Ya obtuviste tu suministro de esta semana. Vuelve el próximo ciclo.");
    
    // NUEVO: Feedback si no es día de abrir
    if (!isOpeningDay) {
        return alert("🔒 ACCESO DENEGADO\n\nEl suministro semanal solo se desbloquea los DOMINGOS o LUNES.\n\nSigue completando misiones para aumentar tu probabilidad de obtener un objeto Legendario.");
    }

    // Algoritmo de lotería
    const roll = Math.random() * 100; 
    let premio = { type: 'gold', amount: 0, label: 'Fondos Extra' };

    if (roll <= luckPercent) {
        premio = { type: 'nexo', amount: 1, label: '¡NEXO LEGENARIO!' };
    } else if (roll <= (luckPercent + 15)) {
        const stats = ['vitalidad', 'sabiduria', 'carisma'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        premio = { type: randomStat, amount: 3, label: 'Mejora de Sistema (+3)' };
    } else {
        premio = { type: 'gold', amount: 200, label: 'Bono de Fondos' };
    }

    setReward(premio);
    setIsOpen(true);

    try {
        const updates: any = {
            claimedChests: arrayUnion(currentWeekId)
        };
        if (premio.type === 'nexo') updates['nexo'] = increment(1);
        else if (premio.type === 'gold') updates['gold'] = increment(premio.amount);
        else updates[`stats.${premio.type}`] = increment(premio.amount);

        await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), updates);
    } catch (e) { console.error("Error guardando premio", e); }
  };

  if (isClaimed) return (
      <div style={{textAlign:'center', opacity:0.5, padding:'20px', border:'1px dashed gray', borderRadius:'12px', marginBottom:'30px'}}>
          <p style={{color:'var(--text-muted)'}}>✅ Suministro semanal reclamado.</p>
      </div>
  );

  return (
    <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--secondary)', borderRadius: '20px', 
        padding: '20px', marginBottom: '30px', textAlign: 'center', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)', zIndex:0}}></div>

      <div style={{position:'relative', zIndex:1}}>
        <h3 style={{margin:0, color:'var(--secondary)', fontFamily:'Rajdhani'}}>SUMINISTRO SEMANAL</h3>
        
        {!isOpen ? (
            <div onClick={openChest} style={{cursor: 'pointer', margin:'20px 0', transition: 'transform 0.1s'}} className="chest-container">
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
                        <p style={{color:'var(--text-muted)', fontSize:'0.8rem', border: '1px solid rgba(255,255,255,0.2)', display:'inline-block', padding:'5px 10px', borderRadius:'10px'}}>🔒 BLOQUEADO HASTA EL DOMINGO</p>
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

        {!isOpen && (
            <div style={{marginTop:'15px', background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'10px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'5px'}}>
                    <span>Probabilidad de Objeto Legendario</span>
                    <span style={{color:'var(--secondary)', fontWeight:'bold'}}>{luckPercent}% Suerte</span>
                </div>
                <div style={{width:'100%', height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'3px'}}>
                    <div style={{width: `${Math.min(100, luckPercent * 2)}%`, height:'100%', background:'var(--secondary)', borderRadius:'3px', boxShadow:'0 0 10px var(--secondary)'}}></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

const premioToIcon = (type: string) => {
    // @ts-ignore
    if (type === 'gold' || type === 'nexo') return STATS_CONFIG[type]?.icon;
    // @ts-ignore
    return STATS_CONFIG[type]?.icon || "";
};