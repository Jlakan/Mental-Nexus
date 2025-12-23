import React, { useState, useEffect } from 'react';
import { 
  doc, getDoc, collection, query, where, getDocs, 
  addDoc, updateDoc, Timestamp, orderBy 
} from "firebase/firestore";
import { db } from '../services/firebase';
import PatientSelector from './PatientSelector';

interface Props {
  userRole: 'professional' | 'assistant';
  currentUserId: string;
  onBack?: () => void;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientExternalPhone?: string;
  patientExternalEmail?: string;
  start: Date;
  end: Date;
  duration: number;
  price: number;
  status: 'confirmed' | 'pending_approval' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: string;
  adminNotes: string;
  createdBy: string;
}

const DAYS_HEADER = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

export default function AgendaView({ userRole, currentUserId, onBack }: Props) {
  // --- CONTEXTO ---
  const [myProfessionals, setMyProfessionals] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [profConfig, setProfConfig] = useState<any>(null);
  const [globalAppLink, setGlobalAppLink] = useState('');

  // --- DATOS ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [ghostPatients, setGhostPatients] = useState<any[]>([]);
  
  // --- UI STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sidebarTab, setSidebarTab] = useState<'rescue' | 'waitlist'>('rescue');
  const [loading, setLoading] = useState(true);

  // --- FORMULARIO ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientExternalPhone: '',
    patientExternalEmail: '',
    time: '09:00',
    duration: 50,
    price: 500,
    adminNotes: '',
    paymentStatus: 'pending',
    paymentMethod: 'cash'
  });

  // 1. CARGA INICIAL
  useEffect(() => {
    const loadContext = async () => {
      try {
        // Cargar link global
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if(settingsSnap.exists()) setGlobalAppLink(settingsSnap.data().appDownloadLink || '');

        if (userRole === 'professional') {
          const docSnap = await getDoc(doc(db, "professionals", currentUserId));
          if (docSnap.exists()) {
             const selfData = { id: currentUserId, ...docSnap.data() };
             setMyProfessionals([selfData]);
             setSelectedProfId(currentUserId);
          }
        } else {
          const q = query(collection(db, "professionals"), where("authorizedAssistants", "array-contains", currentUserId));
          const snap = await getDocs(q);
          const pros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setMyProfessionals(pros);
          if (pros.length > 0) setSelectedProfId(pros[0].id);
        }
      } catch (e) { console.error(e); }
    };
    loadContext();
  }, [currentUserId, userRole]);

  // 2. CARGA DE AGENDA
  useEffect(() => {
    if (!selectedProfId) return;
    loadAgendaData();
  }, [selectedProfId, selectedDate]); // Recargamos si cambia el profesional o la fecha (para refrescar visualmente)

  const loadAgendaData = async () => {
    setLoading(true);
    try {
      const profRef = myProfessionals.find(p => p.id === selectedProfId);
      setProfConfig(profRef?.agendaConfig || { startHour: 8, endHour: 20, defaultDuration: 50, countryCode: '52' });

      // CORRECCIÓN: Quitamos el filtro '!=' en la query para evitar problemas de índices en Firebase
      // Filtramos los cancelados en memoria (Javascript)
      const qAppts = query(collection(db, "appointments"), where("professionalId", "==", selectedProfId));
      const snapAppts = await getDocs(qAppts);
      
      const apptsList = snapAppts.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id, 
            ...data,
            start: data.start.toDate(),
            end: data.end.toDate()
          } as Appointment;
        })
        .filter(a => a.status !== 'cancelled'); // Filtro seguro en memoria

      setAppointments(apptsList);

      if (profRef?.professionalCode) {
        const qPats = query(collection(db, "patients"), where("linkedProfessionalCode", "==", profRef.professionalCode));
        const snapPats = await getDocs(qPats);
        const patsList = snapPats.docs.map(d => ({ id: d.id, ...d.data() }));
        setPatients(patsList);
        calculateGhostPatients(patsList, apptsList);
      }

      const qWait = query(collection(db, "waitlist"), where("professionalId", "==", selectedProfId), orderBy("createdAt", "asc"));
      const snapWait = await getDocs(qWait);
      setWaitlist(snapWait.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (e) { 
      console.error("Error cargando agenda:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const calculateGhostPatients = (allPats: any[], allAppts: any[]) => {
    const now = new Date();
    const activePats = new Set(allAppts.filter(a => a.start > now).map(a => a.patientId));
    setGhostPatients(allPats.filter(p => !activePats.has(p.id)));
  };

  // 3. EXPORTAR A CSV
  const exportMonthToCSV = () => {
    if (appointments.length === 0) return alert("No hay datos para exportar.");
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const monthAppts = appointments.filter(a => a.start.getMonth() === currentMonth && a.start.getFullYear() === currentYear);

    if (monthAppts.length === 0) return alert("No hay citas en este mes para exportar.");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Hora,Paciente,Telefono,Email,Duracion,Precio,Estatus,Notas\n";

    monthAppts.forEach(a => {
      const pName = a.patientName || patients.find(p => p.id === a.patientId)?.fullName || "Desconocido";
      let contactPhone = a.patientExternalPhone || '';
      let contactEmail = a.patientExternalEmail || '';
      if (a.patientId) {
         const registeredP = patients.find(p => p.id === a.patientId);
         if (registeredP) {
            contactPhone = registeredP.contactNumber || '';
            contactEmail = registeredP.email || '';
         }
      }

      const dateStr = a.start.toLocaleDateString();
      const timeStr = a.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const row = `${dateStr},${timeStr},"${pName}","${contactPhone}","${contactEmail}",${a.duration},${a.price},${a.paymentStatus},"${a.adminNotes}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Agenda_${currentMonth + 1}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. GUARDAR / EDITAR CITA
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName) return alert("Debes ingresar un nombre de paciente.");

    if (!formData.patientId && !formData.patientExternalPhone) {
      if(!window.confirm("⚠️ Estás creando un paciente manual SIN TELÉFONO. No podrás enviarle WhatsApp. ¿Continuar?")) return;
    }

    const [h, m] = formData.time.split(':');
    const start = new Date(selectedDate);
    start.setHours(parseInt(h), parseInt(m), 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + formData.duration);

    const conflict = appointments.find(a => {
      if (editingApptId === a.id) return false;
      return (start < a.end) && (end > a.start);
    });

    if (conflict) {
      if (!window.confirm("⚠️ CHOQUE DE HORARIO. ¿Forzar cita?")) return;
    }

    try {
      const payload = {
        professionalId: selectedProfId,
        patientId: formData.patientId,
        patientName: formData.patientName,
        patientExternalPhone: !formData.patientId ? formData.patientExternalPhone : '',
        patientExternalEmail: !formData.patientId ? formData.patientExternalEmail : '',
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
        duration: formData.duration,
        price: Number(formData.price),
        adminNotes: formData.adminNotes,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        status: 'confirmed',
        updatedBy: currentUserId,
        updatedAt: new Date()
      };

      if (editingApptId) {
        await updateDoc(doc(db, "appointments", editingApptId), payload);
      } else {
        await addDoc(collection(db, "appointments"), { ...payload, createdAt: new Date(), createdBy: currentUserId });
      }
      setIsFormOpen(false);
      loadAgendaData();
    } catch (e) { alert("Error al guardar"); console.error(e); }
  };

  // 5. FUNCIONES AUXILIARES
  const openModal = (appt?: Appointment, slotTime?: string) => {
    if (appt) {
      setEditingApptId(appt.id);
      const timeStr = appt.start.getHours().toString().padStart(2,'0') + ':' + appt.start.getMinutes().toString().padStart(2,'0');
      
      let pName = appt.patientName;
      if(!pName && appt.patientId) {
        pName = patients.find(p => p.id === appt.patientId)?.fullName || '';
      }

      setFormData({
        patientId: appt.patientId || '',
        patientName: pName || '',
        patientExternalPhone: appt.patientExternalPhone || '',
        patientExternalEmail: appt.patientExternalEmail || '',
        time: timeStr, duration: appt.duration, price: appt.price || 500,
        adminNotes: appt.adminNotes, paymentStatus: appt.paymentStatus, paymentMethod: appt.paymentMethod || 'cash'
      });
    } else {
      setEditingApptId(null);
      setFormData({
        patientId: '', patientName: '', patientExternalPhone: '', patientExternalEmail: '',
        time: slotTime || '09:00', duration: profConfig?.defaultDuration || 50, price: 500,
        adminNotes: '', paymentStatus: 'pending', paymentMethod: 'cash'
      });
    }
    setIsFormOpen(true);
  };

  const handleSoftDelete = async (apptId: string) => {
    if (!window.confirm("¿Cancelar cita?")) return;
    await updateDoc(doc(db, "appointments", apptId), { status: 'cancelled', cancelledBy: currentUserId });
    loadAgendaData();
  };

  const addToWaitlist = async () => {
    if(!formData.patientId) return alert("La lista de espera requiere un paciente registrado en la App.");
    const note = prompt("Nota de espera:");
    await addDoc(collection(db, "waitlist"), { professionalId: selectedProfId, patientId: formData.patientId, notes: note||'', createdAt: new Date() });
    loadAgendaData();
  };

  // --- WHATSAPP CON INVITACIÓN OPCIONAL ---
  const openWhatsApp = (appt: Appointment) => {
    let phone = '';
    let pName = appt.patientName;
    
    if (appt.patientId) {
      const p = patients.find(x => x.id === appt.patientId);
      if (p) {
         phone = p.contactNumber || '';
         pName = p.fullName;
      }
    } else {
      phone = appt.patientExternalPhone || '';
    }

    if (!phone) return alert("No hay número de teléfono registrado.");

    let cleanPhone = phone.replace(/\D/g, '');
    const prefix = profConfig?.countryCode || '52';
    if (cleanPhone.length <= 10) cleanPhone = `${prefix}${cleanPhone}`;

    const dateStr = appt.start.toLocaleDateString('es-ES', {weekday:'long', hour:'2-digit', minute:'2-digit'});
    
    // MENSAJE BASE
    let msg = `Hola ${pName}, confirmamos cita el ${dateStr}.`;
    
    // PREGUNTAR SI INCLUIR INVITACIÓN
    const currentProf = myProfessionals.find(p => p.id === selectedProfId);
    if (globalAppLink && currentProf?.professionalCode) {
      const includeInvite = window.confirm("¿Deseas incluir la invitación a descargar la App y el código de vinculación en este mensaje?");
      if (includeInvite) {
        msg += `\n\nTe invito a usar Mental Nexus para seguir tu tratamiento.`;
        msg += `\n📲 Descarga: ${globalAppLink}`;
        msg += `\n🔑 Código de vinculación: *${currentProf.professionalCode}*`;
      }
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getWeekDates = (baseDate: Date) => {
    const current = new Date(baseDate);
    const day = current.getDay();
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - day);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      week.push(d);
    }
    return week;
  };
  const weekDates = getWeekDates(selectedDate);

  // 6. RENDER
  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:'#666'}}><h2> ⏳ Cargando Agenda... </h2></div>;

  const renderSlots = () => {
    const startH = parseInt(profConfig?.startHour) || 8;
    const endH = parseInt(profConfig?.endHour) || 20;
    const slots = [];
    
    // CORRECCIÓN: Filtro de fecha estricto (Año, Mes y Día)
    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth();
    const currentDay = selectedDate.getDate();

    for (let h = startH; h < endH; h++) {
      const hourStr = `${h.toString().padStart(2, '0')}:00`;
      
      const slotAppts = appointments.filter(a => 
        a.start.getHours() === h && 
        a.start.getDate() === currentDay &&
        a.start.getMonth() === currentMonth &&
        a.start.getFullYear() === currentYear
      );

      slots.push(
        <div key={h} style={{display:'flex', minHeight:'60px', borderBottom:'1px solid #eee'}}>
          <div style={{width:'60px', padding:'10px', color:'#999', borderRight:'1px solid #eee', fontSize:'14px'}}>{hourStr}</div>
          <div style={{flex:1, position:'relative'}}>
            {/* Click en fondo vacío para crear cita */}
            <div style={{position:'absolute', inset:0, zIndex:1}} onClick={() => openModal(undefined, hourStr)} />
            
            {slotAppts.map(appt => {
              const pName = appt.patientName || patients.find(p => p.id === appt.patientId)?.fullName || 'Desconocido';
              const isPaid = appt.paymentStatus === 'paid';
              const hasPhone = appt.patientId || appt.patientExternalPhone;

              return (
                <div key={appt.id} onClick={(e) => {e.stopPropagation(); openModal(appt);}} 
                  style={{
                    position:'relative', zIndex:2, margin:'2px', padding:'5px', borderRadius:'4px', cursor:'pointer',
                    background: isPaid ? '#E8F5E9' : '#E3F2FD', borderLeft: `4px solid ${isPaid ? '#43A047' : '#2196F3'}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                  <div style={{fontWeight:'bold', fontSize:'13px'}}>{pName} <span style={{fontWeight:'normal'}}>(${appt.price})</span></div>
                  <div style={{fontSize:'11px', color:'#666'}}>{appt.duration} min | {appt.adminNotes}</div>
                  <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                    {hasPhone && <button onClick={(e)=>{e.stopPropagation(); openWhatsApp(appt)}} style={{border:'none', background:'none', cursor:'pointer'}} title="Enviar WhatsApp">💬</button>}
                    <button onClick={(e)=>{e.stopPropagation(); handleSoftDelete(appt.id)}} style={{border:'none', background:'none', cursor:'pointer', color:'red'}} title="Cancelar Cita">🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      );
    }
    return slots;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background:'#f5f5f5' }}>
      {/* SIDEBAR */}
      <div style={{ width: '300px', background: 'white', borderRight: '1px solid #ddd', display:'flex', flexDirection:'column' }}>
        {userRole === 'assistant' && (
           <div style={{ padding: '15px', background: '#333', color: 'white' }}>
             <small style={{display:'block', marginBottom:'5px', fontSize:'10px', textTransform:'uppercase'}}>Gestionando Agenda de:</small>
             <select value={selectedProfId} onChange={e => setSelectedProfId(e.target.value)} style={{width:'100%', padding:'8px', borderRadius:'4px'}}>
               {myProfessionals.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
             </select>
           </div>
        )}
        <div style={{display:'flex', borderBottom:'1px solid #eee'}}>
           <button onClick={() => setSidebarTab('rescue')} style={{flex:1, padding:'15px', border:'none', background: sidebarTab==='rescue'?'#fff':'#f0f0f0', borderBottom: sidebarTab==='rescue'?'3px solid #D32F2F':'none', cursor:'pointer', fontWeight:'bold', color: sidebarTab==='rescue'?'#D32F2F':'#666'}}>🚨 Rescate</button>
           <button onClick={() => setSidebarTab('waitlist')} style={{flex:1, padding:'15px', border:'none', background: sidebarTab==='waitlist'?'#fff':'#f0f0f0', borderBottom: sidebarTab==='waitlist'?'3px solid #1976D2':'none', cursor:'pointer', fontWeight:'bold', color: sidebarTab==='waitlist'?'#1976D2':'#666'}}> ⏳ Espera </button>
        </div>
        <div style={{flex:1, overflowY:'auto', padding:'10px'}}>
           {sidebarTab === 'rescue' ? ghostPatients.map(p => (
             <div key={p.id} style={{padding:'10px', borderBottom:'1px solid #eee', background:'white'}}>
               <div style={{fontWeight:'bold', fontSize:'14px'}}>{p.fullName}</div>
               <div style={{fontSize:'12px', color:'#777', marginBottom:'5px'}}>{p.contactNumber}</div>
               <button onClick={() => openModal({patientId:p.id, patientName:p.fullName} as any)} style={{display:'block', width:'100%', padding:'5px', background:'#FFEBEE', color:'#D32F2F', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>📅 Agendar</button>
             </div>
           )) : (
             <div>
               <button onClick={addToWaitlist} style={{width:'100%', marginBottom:'10px', padding:'10px', background:'#E3F2FD', color:'#1976D2', border:'1px dashed #1976D2', cursor:'pointer'}}>+ Agregar a Lista</button>
               {waitlist.map(w => (
                 <div key={w.id} style={{background:'#F3E5F5', padding:'10px', marginBottom:'5px', borderRadius:'6px', border:'1px solid #CE93D8'}}>
                   <strong>{patients.find(p=>p.id===w.patientId)?.fullName}</strong>
                   <div style={{fontSize:'12px', fontStyle:'italic', margin:'5px 0'}}>"{w.notes}"</div>
                   <button onClick={() => openModal({patientId:w.patientId, patientName:patients.find(p=>p.id===w.patientId)?.fullName || '', adminNotes: `[ESPERA] ${w.notes}`} as any)} style={{fontSize:'11px', padding:'3px 8px', background:'#AB47BC', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Asignar</button>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', background: 'white', borderBottom: '1px solid #ddd' }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
             <div style={{fontSize:'24px', fontWeight:'900', color:'#333', textTransform:'uppercase', letterSpacing:'1px'}}>
               {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
             </div>
             <div style={{display:'flex', gap:'10px'}}>
               <button onClick={exportMonthToCSV} style={{background:'#607D8B', color:'white', border:'none', padding:'8px 15px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>📊 CSV</button>
               <button onClick={() => openModal()} style={{background:'#4CAF50', color:'white', border:'none', padding:'8px 15px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>+ Cita</button>
               {onBack && <button onClick={onBack} style={{padding:'8px 15px', cursor:'pointer', borderRadius:'4px', border:'1px solid #ccc', background:'white'}}>Salir</button>}
             </div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', gap:'5px'}}>
            {weekDates.map((d, index) => {
              // Comparación de fecha estricta para el selector de día
              const isSelected = d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <button key={index} onClick={() => setSelectedDate(d)} style={{flex: 1, padding: '10px 0', border: isSelected ? 
                  '2px solid #2196F3' : '1px solid #eee', background: isSelected ? 
                  '#E3F2FD' : (isToday ? '#FFFDE7' : 'white'), borderRadius: '8px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center'}}>
                   <span style={{fontSize:'11px', fontWeight:'bold', color:'#777'}}>{DAYS_HEADER[index]}</span>
                   <span style={{fontSize:'18px', fontWeight:'bold', color: isSelected ? '#1565C0' : '#333'}}>{d.getDate()}</span>
                </button>
              )
            })}
          </div>
          <div style={{textAlign:'right', marginTop:'5px'}}>
             <small style={{color:'#999', marginRight:'5px'}}>Ir a fecha:</small>
             <input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={e => {
                // Ajuste de zona horaria básico al seleccionar manual
                const [y,m,d] = e.target.value.split('-').map(Number);
                const newDate = new Date(y, m-1, d); 
                setSelectedDate(newDate);
             }} style={{border:'1px solid #ddd', borderRadius:'4px', padding:'2px'}} />
          </div>
        </div>
        <div style={{flex:1, overflowY:'auto', padding:'20px'}}>{renderSlots()}</div>
      </div>

      {/* MODAL FORMULARIO */}
      {isFormOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
           <div style={{background:'white', padding:'25px', width:'400px', borderRadius:'12px', boxShadow:'0 10px 25px rgba(0,0,0,0.2)'}}>
             <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>{editingApptId?'Editar':'Nueva'} Cita</h3>
             <form onSubmit={handleSave}>
               
               <div style={{marginBottom:'15px'}}>
                 <PatientSelector 
                   patients={patients}
                   selectedPatientId={formData.patientId}
                   manualNameValue={formData.patientName}
                   onSelect={(id, name) => setFormData({ ...formData, patientId: id, patientName: name })}
                 />
               </div>

               {!formData.patientId && formData.patientName && (
                 <div style={{marginBottom:'15px', padding:'10px', background:'#FFF3E0', borderRadius:'6px', border:'1px solid #FFCC80'}}>
                    <small style={{display:'block', color:'#E65100', marginBottom:'5px', fontWeight:'bold'}}>👤 Paciente Externo (Manual)</small>
                    <div style={{marginBottom:'8px'}}>
                       <label style={{fontSize:'11px', display:'block'}}>Teléfono de contacto (Para WhatsApp):</label>
                       <input 
                         type="tel"
                         placeholder="Ej: 618 123 4567"
                         value={formData.patientExternalPhone}
                         onChange={e=>setFormData({...formData, patientExternalPhone:e.target.value})}
                         style={{width:'100%', padding:'5px', border:'1px solid #ccc', borderRadius:'4px'}}
                       />
                    </div>
                    <div>
                       <label style={{fontSize:'11px', display:'block'}}>Correo electrónico (Opcional):</label>
                       <input 
                         type="email"
                         placeholder="Ej: correo@ejemplo.com"
                         value={formData.patientExternalEmail}
                         onChange={e=>setFormData({...formData, patientExternalEmail:e.target.value})}
                         style={{width:'100%', padding:'5px', border:'1px solid #ccc', borderRadius:'4px'}}
                       />
                    </div>
                 </div>
               )}

               <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                 <div style={{flex:1}}>
                   <label style={{fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Hora:</label>
                   <input type="time" value={formData.time} onChange={e=>setFormData({...formData, time:e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} />
                 </div>
                 <div style={{flex:1}}>
                   <label style={{fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Duración (min):</label>
                   <input type="number" value={formData.duration} onChange={e=>setFormData({...formData, duration:Number(e.target.value)})} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} />
                 </div>
               </div>

               <div style={{marginBottom:'15px'}}>
                 <label style={{fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Precio Consulta ($):</label>
                 <input type="number" value={formData.price} onChange={e=>setFormData({...formData, price:Number(e.target.value)})} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} />
               </div>

               <div style={{display:'flex', gap:'10px', marginBottom:'15px', background:'#f5f5f5', padding:'10px', borderRadius:'6px'}}>
                 <div style={{flex:1}}>
                   <label style={{fontSize:'11px', display:'block'}}>Estatus Pago:</label>
                   <select value={formData.paymentStatus} onChange={e=>setFormData({...formData, paymentStatus:e.target.value as any})} style={{width:'100%', padding:'5px'}}>
                     <option value="pending">Pendiente</option><option value="paid">Pagado</option>
                   </select>
                 </div>
                 <div style={{flex:1}}>
                   <label style={{fontSize:'11px', display:'block'}}>Método:</label>
                   <select value={formData.paymentMethod} onChange={e=>setFormData({...formData, paymentMethod:e.target.value})} style={{width:'100%', padding:'5px'}}>
                     <option value="cash">Efectivo</option><option value="card">Tarjeta</option>
                     <option value="transfer">Transferencia</option>
                   </select>
                 </div>
               </div>

               <div style={{marginBottom:'20px'}}>
                 <label style={{fontSize:'12px', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Notas Administrativas:</label>
                 <textarea placeholder="Ej: Traer estudios, cobrar saldo..." value={formData.adminNotes} onChange={e=>setFormData({...formData, adminNotes:e.target.value})} rows={2} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} />
               </div>

               <div style={{textAlign:'right', display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                 <button type="button" onClick={()=>setIsFormOpen(false)} style={{padding:'10px 20px', borderRadius:'6px', border:'none', background:'#eee', cursor:'pointer'}}>Cancelar</button>
                 <button type="submit" style={{padding:'10px 20px', borderRadius:'6px', border:'none', background:'#2196F3', color:'white', fontWeight:'bold', cursor:'pointer'}}>Guardar Cita</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}