import React, { useState } from 'react';
import { DivaCriterio, ResultadoDiva } from '../components/DivaCriterio';
// Asegúrate de que este import apunte a donde guardaste el CSS
import './ClinicalTests.css'; 

// ==========================================
// BASE DE DATOS COMPLETA DIVA-5 (Oficial)
// ==========================================
const DIVA_DATA = [
  // --- PARTE 1: DÉFICIT DE ATENCIÓN (A) ---
  {
    id: 'A1',
    titulo: 'CRITERIO A1 | ATENCIÓN A LOS DETALLES',
    pregunta: '¿A menudo no presta suficiente atención a los detalles o incurre en errores por olvidos en las tareas?',
    ejemplosAdulto: ["Comete errores por olvidos", "Tiene que trabajar más despacio para evitar errores", "El trabajo contiene errores", "No lee las instrucciones con cuidado", "Pasa por alto detalles", "Se atasca fácilmente con los detalles", "Trabaja demasiado rápido y se equivoca"],
    ejemplosInfancia: ["Errores por olvidos en tareas escolares", "Errores por no leer bien las preguntas", "Pasa por alto detalles", "El trabajo contiene errores", "Preguntas sin contestar por no leerlas", "Dejar sin contestar el reverso del examen", "Trabajo descuidado", "No comprobar respuestas"]
  },
  {
    id: 'A2',
    titulo: 'CRITERIO A2 | MANTENER LA ATENCIÓN',
    pregunta: '¿A menudo tiene dificultades para mantener la atención en las tareas?',
    ejemplosAdulto: ["No puede mantener la atención mucho tiempo", "Se distrae fácilmente por pensamientos propios", "Se distrae con pensamientos no relacionados", "Dificultad para concentrarse en conferencias/conversaciones", "Le cuesta acabar de ver una película o leer un libro", "Se cansa rápidamente de las cosas"],
    ejemplosInfancia: ["Dificultad para mantener la atención en tareas escolares", "Dificultad para mantener la atención en el juego", "Dificultad para concentrarse en conferencias", "Se distrae fácilmente", "No se podía concentrar bien", "Necesitaba estructura para no distraerse"]
  },
  {
    id: 'A3',
    titulo: 'CRITERIO A3 | ESCUCHA APARENTE',
    pregunta: '¿A menudo parece que no escuche cuando se le habla directamente?',
    ejemplosAdulto: ["Está ausente o distraído", "Le cuesta concentrarse en una conversación", "Después de una conversación no sabe de qué iba", "Cambia el tema de conversación", "Los demás le dicen que está distraído", "Pensamientos en otro tema"],
    ejemplosInfancia: ["No sabía lo que le acababan de decir", "Estaba ausente o distraído", "Escuchaba solo con contacto visual", "Pensamientos en otro tema", "Había que llamarle la atención varias veces", "Había que repetirle las preguntas"]
  },
  {
    id: 'A4',
    titulo: 'CRITERIO A4 | SEGUIR INSTRUCCIONES',
    pregunta: '¿A menudo no sigue las instrucciones y no cumple con las tareas o deberes?',
    ejemplosAdulto: ["Hace varias cosas a la vez sin acabar ninguna", "Inicia tareas pero pierde el foco", "Necesita fecha límite para acabar", "Le cuesta acabar tareas administrativas", "Le cuesta seguir instrucciones de un manual", "No acaba las cosas"],
    ejemplosInfancia: ["Le costaba seguir instrucciones", "Dificultad en tareas de más de un paso", "No acababa las cosas", "No acababa los deberes", "Necesitaba mucha estructura para acabar"]
  },
  {
    id: 'A5',
    titulo: 'CRITERIO A5 | ORGANIZACIÓN',
    pregunta: '¿A menudo tiene dificultades para organizar tareas o actividades?',
    ejemplosAdulto: ["Le cuesta planificar tareas diarias", "Dificultad en tareas secuenciales", "Hogar/trabajo desordenados", "Le cuesta mantener orden", "Trabaja desordenadamente", "Planifica mal", "Tiene dos citas al mismo tiempo", "Llega tarde", "No usa agenda consecuentemente", "Mala gestión del tiempo"],
    ejemplosInfancia: ["Le costaba estar preparado a tiempo", "Habitación/pupitre desordenados", "Dificultad para mantener materiales en orden", "Le costaba jugar solo", "Le costaba planificar deberes", "No cumplía fechas límite", "Hacía varias cosas a la vez", "Llegaba tarde", "No era consciente del tiempo"]
  },
  {
    id: 'A6',
    titulo: 'CRITERIO A6 | ESFUERZO MENTAL SOSTENIDO',
    pregunta: '¿A menudo evita o le disgusta dedicarse a tareas que requieren esfuerzo mental sostenido?',
    ejemplosAdulto: ["Hace primero lo fácil/entretenido", "Aplaza tareas difíciles/aburridas", "Pospone y no cumple tiempos", "Evita trabajo monótono (administrativo)", "Evita preparar informes o revisar documentos", "No le gusta leer por el esfuerzo", "Evita tareas de mucha concentración"],
    ejemplosInfancia: ["Evitaba o le disgustaba hacer deberes", "Leía pocos libros por el esfuerzo", "Evitaba cosas que exigían concentración", "Le disgustaban asignaturas teóricas", "Aplazaba tareas difíciles"]
  },
  {
    id: 'A7',
    titulo: 'CRITERIO A7 | EXTRAVÍO DE OBJETOS',
    pregunta: '¿A menudo extravía objetos necesarios para tareas o actividades?',
    ejemplosAdulto: ["Pierde herramientas, documentos, gafas, móvil, llaves", "A menudo se deja cosas", "Pierde papeles del trabajo", "Pierde tiempo buscando cosas", "Se angustia si le cambian cosas de sitio", "Guarda cosas en sitios inapropiados", "Pierde listas o notas"],
    ejemplosInfancia: ["Perdía material escolar, libros, ropa, juguetes", "Perdía tiempo buscando cosas", "Se angustiaba si le movían cosas", "Padres/profesores decían que perdía cosas", "Olvidaba llevar cosas al colegio"]
  },
  {
    id: 'A8',
    titulo: 'CRITERIO A8 | DISTRACCIÓN POR ESTÍMULOS',
    pregunta: '¿A menudo se distrae fácilmente por estímulos irrelevantes?',
    ejemplosAdulto: ["Le cuesta aislarse de estímulos externos", "Le cuesta retomar el hilo tras distraerse", "Se distrae por ruidos o movimiento", "Sigue conversaciones ajenas", "Le cuesta filtrar información"],
    ejemplosInfancia: ["Miraba por la ventana en clase", "Se distraía con ruidos o movimientos", "Le costaba retomar el hilo tras distraerse"]
  },
  {
    id: 'A9',
    titulo: 'CRITERIO A9 | DESCUIDO EN ACTIVIDADES',
    pregunta: '¿A menudo es poco cuidadoso en las actividades diarias (olvidadizo)?',
    ejemplosAdulto: ["Olvida llaves, agenda, etc.", "Necesita que le recuerden compromisos", "Vuelve a casa a recoger olvidos", "Olvida consultar la agenda", "Usa esquemas rígidos para no olvidar", "Olvida tareas domésticas o recados", "Olvida citas u obligaciones", "Olvida pagar facturas"],
    ejemplosInfancia: ["Olvidaba tareas o acuerdos", "Olvidaba hacer recados", "Necesitaba recordatorios constantes", "Olvidaba qué hacía a media tarea", "Olvidaba cosas en el colegio o casa de amigos"]
  },

  // --- PARTE 2: HIPERACTIVIDAD E IMPULSIVIDAD (H/I) ---
  {
    id: 'HI1',
    titulo: 'CRITERIO H/I 1 | INQUIETUD MOTORA',
    pregunta: '¿A menudo mueve en exceso manos o pies, o se retuerce en el asiento?',
    ejemplosAdulto: ["No puede estar quieto", "Mueve las piernas", "Juega con bolígrafo/objetos", "Se muerde uñas/juega con pelo", "Puede dominarlo pero le causa tensión"],
    ejemplosInfancia: ["Padres decían 'siéntate bien'", "Movía las piernas", "Jugaba con objetos", "Se mordía uñas/pelo", "No podía estar sentado tranquilo", "Tensión al intentar controlarse"]
  },
  {
    id: 'HI2',
    titulo: 'CRITERIO H/I 2 | ABANDONAR EL ASIENTO',
    pregunta: '¿A menudo abandona su asiento en situaciones en que se espera que permanezca sentado?',
    ejemplosAdulto: ["Abandona su lugar en la oficina", "Evita conferencias/cine/iglesia", "Prefiere caminar a estar sentado", "Siempre en movimiento", "Tensión por estar quieto", "Da excusas para moverse"],
    ejemplosInfancia: ["Se levantaba en clase", "Difícil estar quieto en comidas", "Le mandaban sentarse", "Daba excusas para caminar"]
  },
  {
    id: 'HI3',
    titulo: 'CRITERIO H/I 3 | INQUIETUD INTERNA',
    pregunta: '¿A menudo corre o salta excesivamente? (En adultos: inquietud subjetiva)',
    ejemplosAdulto: ["Se siente intranquilo o agitado interiormente", "Sensación de tener que estar ocupado siempre", "Se relaja con dificultad"],
    ejemplosInfancia: ["Corría en lugares inapropiados", "Se subía a muebles/sofás", "Trepaba a árboles", "Agitación interna"]
  },
  {
    id: 'HI4',
    titulo: 'CRITERIO H/I 4 | OCIO RUIDOSO',
    pregunta: '¿A menudo tiene dificultades para dedicarse tranquilamente a actividades de ocio?',
    ejemplosAdulto: ["Habla en actividades de silencio", "Quiere llevar la voz cantante", "Es ruidoso", "No puede hacer actividades con tranquilidad", "No puede hablar bajo"],
    ejemplosInfancia: ["Ruidoso al jugar o en clase", "No podía ver TV tranquilo", "Le mandaban callar", "Se agitaba en grupo"]
  },
  {
    id: 'HI5',
    titulo: 'CRITERIO H/I 5 | "ESTAR EN MARCHA"',
    pregunta: '¿A menudo actúa como si tuviese un motor?',
    ejemplosAdulto: ["Siempre ocupado haciendo algo", "Incómodo al estar quieto mucho tiempo", "Mucha energía", "Difícil de seguir para los demás", "No respeta sus límites", "Controlador/a"],
    ejemplosInfancia: ["Siempre haciendo cosas", "Incómodo quieto mucho tiempo", "Muy activo en clase/casa", "Mucha energía", "Insistente/daba la lata"]
  },
  {
    id: 'HI6',
    titulo: 'CRITERIO H/I 6 | HABLAR EN EXCESO',
    pregunta: '¿A menudo habla mucho o en exceso?',
    ejemplosAdulto: ["Cansa a la gente hablando", "Conocido por charlatán", "Difícil dejar de hablar", "Tiende a hablar demasiado", "No deja participar a otros", "Usa muchas palabras para explicar"],
    ejemplosInfancia: ["Conocido por hablador", "Profesores/padres le pedían callar", "Notas escolares sobre hablar mucho", "Castigos por hablar", "No dejaba trabajar a otros", "Monopolizaba conversaciones"]
  },
  {
    id: 'HI7',
    titulo: 'CRITERIO H/I 7 | PRECIPITAR RESPUESTAS',
    pregunta: '¿A menudo suelta una respuesta antes de terminar la pregunta?',
    ejemplosAdulto: ["Problemas para callar", "Dice cosas sin pensar", "No tiene tacto", "Responde antes de que acaben de hablar", "Acaba las frases de otros"],
    ejemplosInfancia: ["Problemas para callar", "Respondía primero aunque fuera mal", "Le costaba esperar turno al hablar", "Hiriente", "Quería ser el primero en responder"]
  },
  {
    id: 'HI8',
    titulo: 'CRITERIO H/I 8 | DIFICULTAD PARA ESPERAR',
    pregunta: '¿A menudo tiene dificultades para esperar su turno?',
    ejemplosAdulto: ["Se cuela en filas", "Impaciente en el tráfico", "Difícil esperar turno en conversación", "Impaciente general", "Deja cosas por impaciencia"],
    ejemplosInfancia: ["Difícil esperar turno en clase", "Siempre estaba el primero", "Se impacientaba rápido", "Difícil esperar turno jugando", "Cruzaba calle sin mirar"]
  },
  {
    id: 'HI9',
    titulo: 'CRITERIO H/I 9 | INTERRUMPIR',
    pregunta: '¿A menudo interrumpe o se entromete en asuntos de los demás?',
    ejemplosAdulto: ["Se entromete", "Interrumpe a gente ocupada", "Acusado de entrometido", "Difícil respetar límites", "Opina de todo sin callarse"],
    ejemplosInfancia: ["Interrumpía juegos/actividades", "Usaba cosas sin permiso", "Reaccionaba ante todo", "No podía esperar"]
  },

  // --- PARTE 3: ÁREAS DE DISFUNCIÓN (CRITERIOS B, C, D) ---
  {
    id: 'D1',
    titulo: 'ÁREA 1 | TRABAJO Y EDUCACIÓN',
    pregunta: '¿Los síntomas han afectado su rendimiento laboral o educativo?',
    ejemplosAdulto: ["Cursos sin acabar", "Trabajo por debajo de su nivel", "Se aburre del trabajo", "Trabajos de corta duración", "Dificultad administrativa", "No le ascienden", "Despidos/Conflictos"],
    ejemplosInfancia: ["Formación inferior a CI", "Repetición de cursos", "Expulsiones", "Tardaba más en acabar", "Dificultad con deberes", "Comentarios negativos de conducta"]
  },
  {
    id: 'D2',
    titulo: 'ÁREA 2 | RELACIONES Y FAMILIA',
    pregunta: '¿Los síntomas han afectado sus relaciones de pareja o vida familiar?',
    ejemplosAdulto: ["Se cansa rápido de relaciones", "Impulsivo al iniciar/romper", "Relación desigual", "Peleas/falta de intimidad", "Problemas sexuales (por atención)", "Dificultad tareas hogar/cuentas", "Problemas financieros"],
    ejemplosInfancia: ["Peleas con hermanos", "Castigos frecuentes", "Poco contacto familiar por conflictos", "Necesitaba mucha estructura de padres"]
  },
  {
    id: 'D3',
    titulo: 'ÁREA 3 | CONTACTOS SOCIALES',
    pregunta: '¿Los síntomas han afectado su vida social y amistades?',
    ejemplosAdulto: ["Se cansa de contactos", "Le cuesta mantenerlos", "Conflictos de comunicación", "Le cuesta iniciar contactos", "No es atento/empático", "Inseguridad social"],
    ejemplosInfancia: ["Le costaba mantener amigos", "Le costaba hacer amigos", "Pocos amigos", "Burlas en colegio", "Le hacían el vacío", "Era agresivo/matón"]
  },
  {
    id: 'D4',
    titulo: 'ÁREA 4 | TIEMPO LIBRE Y AFICIONES',
    pregunta: '¿Los síntomas afectan su capacidad de relajarse o disfrutar su tiempo libre?',
    ejemplosAdulto: ["No se relaja fácil", "Necesita mucho deporte para relajarse", "Lesiones por deporte", "No acaba pelis/libros", "Se cansa de aficiones", "Riesgos excesivos", "Problemas legales/tráfico"],
    ejemplosInfancia: ["No se relajaba", "Lesiones frecuentes", "No acababa pelis/libros", "Se cansaba de aficiones", "Riesgos excesivos", "Accidentes frecuentes"]
  },
  {
    id: 'D5',
    titulo: 'ÁREA 5 | AUTOESTIMA Y AUTOIMAGEN',
    pregunta: '¿Los síntomas han afectado la seguridad en sí mismo o su autoimagen?',
    ejemplosAdulto: ["Inseguro ante críticas", "Autoimagen negativa", "Miedo al fracaso", "Reacción exagerada a críticas", "Perfeccionismo compensatorio", "Tristeza por síntomas"],
    ejemplosInfancia: ["Inseguro", "Imagen negativa", "Miedo a fallar", "Reacción a críticas", "Perfeccionismo"]
  }
];

// ==========================================
// COMPONENTE PRINCIPAL (MOTOR)
// ==========================================

interface Props {
  onFinish: (resultados: any) => void;
  onCancel: () => void;
}

export const ClinicalTestsScreen: React.FC<Props> = ({ onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tempAdultez, setTempAdultez] = useState<ResultadoDiva>({ cumple: null, evidencias: [] });
  const [tempInfancia, setTempInfancia] = useState<ResultadoDiva>({ cumple: null, evidencias: [] });
  const [respuestasGlobales, setRespuestasGlobales] = useState<any>({});

  const preguntaActual = DIVA_DATA[currentIndex];
  const esUltima = currentIndex === DIVA_DATA.length - 1;

  // Lógica de Informe
  const generarInformeFinal = (respuestas: any) => {
    let conteoA_Adulto = 0, conteoHI_Adulto = 0, conteoDisfuncion = 0;
    Object.keys(respuestas).forEach(key => {
        const r = respuestas[key];
        if (key.startsWith('A') && r.adultez.cumple) conteoA_Adulto++;
        if (key.startsWith('HI') && r.adultez.cumple) conteoHI_Adulto++;
        if (key.startsWith('D') && r.adultez.cumple) conteoDisfuncion++;
    });
    
    const cumpleA = conteoA_Adulto >= 5;
    const cumpleHI = conteoHI_Adulto >= 5;
    const cumpleDisfuncion = conteoDisfuncion >= 2;
    let sugerencia = "NO CUMPLE CRITERIOS TDAH";
    if (cumpleDisfuncion) {
        if (cumpleA && cumpleHI) sugerencia = "TDAH PRESENTACIÓN COMBINADA";
        else if (cumpleA) sugerencia = "TDAH PRESENTACIÓN INATENTA";
        else if (cumpleHI) sugerencia = "TDAH PRESENTACIÓN HIPERACTIVA/IMPULSIVA";
    } else if (cumpleA || cumpleHI) sugerencia = "RASGOS TDAH (Sin disfunción significativa)";

    return {
        raw: respuestas,
        resumen: { sintomasAtencion: conteoA_Adulto, sintomasHiperactividad: conteoHI_Adulto, areasAfectadas: conteoDisfuncion, sugerenciaDiagnostica: sugerencia },
        textoInforme: `📋 RESULTADOS DIVA-5\n🔹 A: ${conteoA_Adulto}/9 | HI: ${conteoHI_Adulto}/9 | DISF: ${conteoDisfuncion}/5\n💡 ${sugerencia}`
    };
  };

  const handleSiguiente = () => {
    if (tempAdultez.cumple === null || tempInfancia.cumple === null) {
      alert("⚠️ DATO REQUERIDO: Por favor complete la evaluación de ambas etapas.");
      return;
    }
    const nuevas = { ...respuestasGlobales, [preguntaActual.id]: { adultez: tempAdultez, infancia: tempInfancia } };
    setRespuestasGlobales(nuevas);

    if (esUltima) onFinish(generarInformeFinal(nuevas));
    else {
      setCurrentIndex(prev => prev + 1);
      setTempAdultez({ cumple: null, evidencias: [] });
      setTempInfancia({ cumple: null, evidencias: [] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const progreso = ((currentIndex + 1) / DIVA_DATA.length) * 100;

  return (
    <div className="diva-container">
      {/* HEADER SUPERIOR */}
      <div style={{ width: '100%', maxWidth: '1400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', lineHeight: 1, letterSpacing: '2px', color: '#f8fafc' }}>MENTAL NEXUS</h1>
          <span style={{ color: '#22d3ee', fontSize: '0.9rem', letterSpacing: '3px', fontWeight: 'bold' }}>SISTEMA DE EVALUACIÓN CLÍNICA</span>
        </div>
        <div style={{ textAlign: 'right', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f8fafc', lineHeight: 1 }}>
            {currentIndex + 1}<span style={{fontSize:'1.2rem', color:'#475569'}}>/ {DIVA_DATA.length}</span>
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div style={{ width: '100%', maxWidth: '1400px', height: '4px', background: 'rgba(148, 163, 184, 0.1)', marginBottom: '30px', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height: '100%', width: `${progreso}%`, background: '#22d3ee', boxShadow: '0 0 10px #22d3ee', transition: 'width 0.5s ease' }}></div>
      </div>

      {/* COMPONENTE PRINCIPAL */}
      <DivaCriterio
        key={preguntaActual.id}
        titulo={preguntaActual.titulo}
        pregunta={preguntaActual.pregunta}
        ejemplosAdulto={preguntaActual.ejemplosAdulto}
        ejemplosInfancia={preguntaActual.ejemplosInfancia}
        onChangeAdultez={setTempAdultez}
        onChangeInfancia={setTempInfancia}
      />

      {/* BOTONERA */}
      <div className="action-bar">
        <button onClick={onCancel} className="btn-text">
          CANCELAR PROCESO
        </button>
        <button onClick={handleSiguiente} className="btn-primary">
          {esUltima ? 'FINALIZAR Y GUARDAR' : 'CONFIRMAR Y CONTINUAR'}
        </button>
      </div>
    </div>
  );
};