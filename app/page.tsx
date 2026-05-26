'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

type User = { email: string; id: string } | null

// Ejercicios que tienen series de fuerza (para mostrar campos de peso)
const STRENGTH_EXERCISES = new Set([
  "Sentadilla Frontal","Romanian Deadlift","Bulgarian Split Squat","Pallof Press",
  "Dominadas con lastre","Press banca mancuernas","Face Pull con cuerda",
  "Remo Yates / Pendlay Row","Curl + Press Arnold","Peso Muerto Convencional",
  "Swing con Kettlebell","Step-up con mancuernas","Plank con arrastre","Turkish Get-Up",
  "Goblet squat","Hip thrust","Dead bug","Remo con mancuerna","Sumo squat con mancuerna",
  "Farmer carry","Sentadilla con salto","Bulgarian Split Squat","Landmine rotation",
  "Pull-up o jalón al pecho","Abducción de cadera en máquina",
])

const ALL_INFO: Record<string, { muscles: string; steps: string[]; tip: string; img?: string }> = {
  "Sentadilla Frontal": { img: "https://athlemove.com/wp-content/uploads/2023/10/barbell-front-squat.jpg", muscles: "Cuádriceps · Glúteos · Core · Columna torácica", steps: ["Barra sobre los deltoides frontales, codos arriba y paralelos al piso.", "Pies al ancho de hombros, puntas ligeramente hacia afuera.", "Descendé manteniendo el torso completamente vertical.", "Bajá hasta muslos paralelos o por debajo del piso.", "Empujá el piso y subí explosivamente con el pecho arriba."], tip: "Si los codos caen, la barra se va adelante. Trabajá movilidad de muñeca y tobillo antes." },
  "Romanian Deadlift": { img: "https://homegymreview.co.uk/wp-content/uploads/2021/07/Barbell-Romanian-Deadlift-From-Deficit.jpg", muscles: "Isquiotibiales · Glúteos · Espalda baja · Trapecio", steps: ["De pie, barra en agarre prono al ancho de hombros.", "Rodillas ligeramente flexionadas y fijas.", "Hinge en la cadera empujando el culo hacia atrás.", "Bajá la barra pegada a las piernas hasta sentir tensión.", "Volvé empujando las caderas hacia adelante."], tip: "Fase excéntrica de 3 segundos. Si redondeas la espalda baja, estás yendo demasiado abajo." },
  "Bulgarian Split Squat": { img: "https://weighttraining.guide/wp-content/uploads/2016/10/Dumbbell-Bulgarian-split-squat-resized.png", muscles: "Cuádriceps · Glúteos · Isquiotibiales · Estabilizadores de cadera", steps: ["Pie trasero apoyado en banco a 60-70 cm detrás.", "Pie delantero adelantado para que la rodilla no pase la punta.", "Descendé verticalmente hasta que la rodilla trasera casi toque el piso.", "El torso puede inclinarse levemente según el enfoque.", "Empujá desde el talón del pie delantero para subir."], tip: "Corrige desequilibrios entre piernas, crítico para tenistas. Empezá siempre con el lado débil." },
  "Pallof Press": { muscles: "Core (oblicuos · transverso) · Glúteos · Estabilizadores de hombro", steps: ["Fijá una polea o banda a la altura del pecho, de costado a ella.", "De pie o en media rodilla, agarrá con ambas manos frente al pecho.", "Extendé completamente los brazos al frente y aguantá 2 segundos.", "Regresá lentamente. La clave: resistir la rotación."], tip: "Cuánto más lejos estés de la polea, más resistencia. Respirá y mantené la pelvis neutral." },
  "Dominadas con lastre": { img: "https://weighttraining.guide/wp-content/uploads/2017/03/pull-up.png", muscles: "Dorsales · Bíceps · Trapecio inferior · Core", steps: ["Agarre prono al ancho de hombros o algo más abierto.", "Colgá con los hombros deprimidos, no encogidos.", "Iniciá retrayendo las escápulas, luego jalá los codos hacia las caderas.", "Subí hasta que la barbilla supere la barra.", "Bajá lento en 3 segundos."], tip: "Si dominás el peso corporal, agregá lastre. Priorizá calidad sobre cantidad." },
  "Press banca mancuernas": { img: "https://weighttraining.guide/wp-content/uploads/2016/05/dumbbell-bench-press-resized.png", muscles: "Pectoral · Deltoides anterior · Tríceps", steps: ["Acostado en banco plano, mancuernas a los lados del pecho.", "Codos a 45° del torso (no a 90°), pies firmes en el piso.", "Empujá las mancuernas hacia arriba y ligeramente hacia adentro.", "Bajá controlado sintiendo el stretch en el pecho."], tip: "Las mancuernas permiten rango de movimiento más natural que la barra, crucial para hombros." },
  "Face Pull con cuerda": { img: "https://weighttraining.guide/wp-content/uploads/2016/05/face-pull-resized.png", muscles: "Deltoides posterior · Manguito rotador · Trapecio medio · Romboides", steps: ["Polea alta con accesorio de cuerda. Agarrá con palmas hacia adentro.", "Jalá hacia tu cara separando la cuerda al final del recorrido.", "Codos arriba y hacia afuera, pulgares apuntando hacia atrás.", "Regresá lento. Sin impulso del cuerpo."], tip: "El ejercicio más importante para la salud del hombro. NUNCA lo salteés." },
  "Remo Yates / Pendlay Row": { img: "https://weighttraining.guide/wp-content/uploads/2016/10/Barbell-Bent-Over-Row.png", muscles: "Dorsales · Romboides · Trapecio · Bíceps · Core", steps: ["YATES: De pie inclinado ~70°, barra en agarre supino o prono.", "Jalá hacia el abdomen, codos cerca del cuerpo.", "PENDLAY: Completamente horizontal, barra parte del piso en cada rep.", "Jalá explosivamente hacia la zona baja del pecho."], tip: "Por cada serie que empujés, tirá igual o más. Esto protege la postura y el hombro." },
  "Curl + Press Arnold": { img: "https://weighttraining.guide/wp-content/uploads/2016/06/dumbbell-arnold-press-resized.png", muscles: "Bíceps · Deltoides (anterior/medio/posterior) · Tríceps", steps: ["De pie, mancuernas al costado del cuerpo.", "Hacé un curl de bíceps completo.", "Al llegar arriba, girá las palmas hacia afuera y presioná sobre la cabeza.", "Al bajar, girá de vuelta las palmas hacia adentro."], tip: "El Arnold involucra los tres haces del deltoides en un solo movimiento. Control, no velocidad." },
  "Peso Muerto Convencional": { img: "https://weighttraining.guide/wp-content/uploads/2016/05/barbell-deadlift-resized.png", muscles: "Isquiotibiales · Glúteos · Espalda baja · Trapecio · Cuádriceps", steps: ["Barra sobre el medio del pie, agarre al ancho de hombros.", "Caderas más altas que las rodillas, hombros sobre la barra.", "Empujá el piso hacia abajo mientras subís la barra pegada a las piernas.", "Extendé caderas y rodillas simultáneamente.", "Al llegar arriba: glúteos apretados, caderas extendidas."], tip: "4 reps con carga alta — cada rep debe ser perfecta. Si redondeas la espalda, bajá el peso." },
  "Swing con Kettlebell": { img: "https://weighttraining.guide/wp-content/uploads/2016/05/kettlebell-swing-resized.png", muscles: "Glúteos · Isquiotibiales · Core · Deltoides (estabilización)", steps: ["Kettlebell en el piso ligeramente adelante. Hinge y agarrá el handle.", "Subí la kettlebell entre las piernas (hike).", "Explotá con las caderas hacia adelante — fuerza 100% de las caderas.", "La kettlebell sube hasta la altura del pecho por inercia.", "Dejá que baje por gravedad y repetí."], tip: "El ejercicio más específico para el tenis: entrena la potencia de cadera del saque y el drive." },
  "Step-up con mancuernas": { img: "https://weighttraining.guide/wp-content/uploads/2016/05/dumbbell-step-up-resized.png", muscles: "Cuádriceps · Glúteos · Isquiotibiales · Estabilizadores de tobillo", steps: ["Cajón a altura de rodilla. Mancuerna en cada mano.", "Apoyá completamente el pie en el cajón.", "Empujá desde el talón para subir. Sin impulso de la pierna de abajo.", "Subí completamente, pausa, bajá lento."], tip: "Funcional y gentil con las rodillas. Ideal para el día 3 cuando el cuerpo ya está exigido." },
  "Plank con arrastre": { muscles: "Core completo · Oblicuos · Hombros · Dorsales", steps: ["Posición de plank sobre manos o antebrazos.", "Una mancuerna a un lado.", "Con una mano, arrastrá el peso por debajo del cuerpo hacia el otro lado.", "Cambiá de mano. Las caderas no deben rotar ni moverse."], tip: "Entrena el core en movimiento real — igual que en el tenis. La resistencia a la rotación es clave." },
  "Turkish Get-Up": { img: "https://weighttraining.guide/wp-content/uploads/2016/10/kettlebell-turkish-get-up-resized.png", muscles: "Core · Hombros · Glúteos · Cadena posterior completa", steps: ["Acostado, kettlebell en una mano extendida hacia el techo.", "Doblá la rodilla del mismo lado. Apoyate en el codo opuesto, luego en la mano.", "Levantá la cadera (puente), pasá la pierna estirada por debajo.", "Llegá a posición de rodilla, luego levantate completamente.", "Invertí el movimiento para bajar. El brazo con peso siempre vertical."], tip: "Combina movilidad, fuerza y coordinación. Peso moderado hasta dominar la técnica." },
  "90/90 Hip Rotations": { muscles: "Rotadores de cadera · Glúteos · Aductores", steps: ["Sentate con ambas piernas en 90°.", "Una rodilla al frente (rotación externa), la otra al costado (rotación interna).", "Girá el torso y las caderas pasando al 90/90 del otro lado.", "Alterná lentamente, espalda derecha."], tip: "No uses las manos para empujar las rodillas. El movimiento debe ser activo." },
  "World's Greatest Stretch": { muscles: "Cadera · Aductores · Isquiotibiales · Columna torácica", steps: ["Desde zancada larga, apoyá la mano delantera en el piso.", "Llevá el codo hacia el piso (cadera y aductores).", "Llevá esa mano hacia el techo rotando la columna torácica.", "Estirá la pierna delantera alcanzando el pie."], tip: "Tres movimientos en uno. Hacelo despacio, sin rebotes." },
  "Ankle Mobility en pared": { muscles: "Tobillo · Pantorrilla · Soleo", steps: ["De pie frente a una pared, pie a 10-15 cm.", "Doblá la rodilla intentando que toque la pared.", "Sin levantar el talón del piso.", "Si toca fácil, alejá el pie."], tip: "El tobillo rígido limita directamente la sentadilla frontal." },
  "Rotación Torácica cuadrupedia": { muscles: "Columna torácica · Oblicuos · Romboides", steps: ["En cuadrupedia, colocá una mano detrás de la cabeza.", "Rotá el torso llevando ese codo hacia el techo.", "Luego llevá el codo hacia el de apoyo.", "Solo se mueve la columna torácica."], tip: "La columna torácica rígida afecta el saque y el revés directamente." },
  "Wall Slide": { muscles: "Trapecio inferior · Serrato anterior · Manguito rotador", steps: ["Apoyá codos y antebrazos en la pared formando una W.", "Deslizá los brazos hacia arriba hasta una Y.", "Mantené los antebrazos en contacto con la pared.", "Bajá lentamente volviendo a la W."], tip: "Si no podés mantener contacto, hay poca movilidad torácica." },
  "Child's Pose apertura lateral": { muscles: "Dorsales · Oblicuos · Hombros", steps: ["Desde rodillas, llevá las caderas hacia los talones.", "Caminá las manos hacia la derecha.", "Mantené 15 segundos y volvé al centro.", "Repetí hacia el otro lado."], tip: "El dorsal tenso limita la elevación del brazo. Crítico después de dominadas." },
  "Hip Flexor Stretch dinámico": { muscles: "Flexores de cadera · Psoas · Cuádriceps", steps: ["Zancada baja con rodilla trasera en el piso.", "Llevá la cadera hacia adelante hasta sentir el estiramiento.", "Activá el glúteo y empujá un poco más.", "Retrocedé y volvé a avanzar — dinámico, no estático."], tip: "El flexor tenso es el enemigo del peso muerto y del sprint." },
  "Rotación cadera decúbito": { muscles: "Rotadores de cadera · Glúteos · Región lumbar", steps: ["Acostado boca arriba, rodillas dobladas, pies en el piso.", "Dejá caer ambas rodillas hacia la derecha.", "Mantené los hombros pegados al piso.", "Volvé al centro y repetí hacia el otro lado."], tip: "Activa la rotación de cadera antes del peso muerto y el swing." },
  "Cat-Cow + Thread the Needle": { muscles: "Columna lumbar · Columna torácica · Oblicuos", steps: ["En cuadrupedia, inhala arqueando la espalda (Cat), exhala redondeando (Cow).", "Después de 5 reps, deslizá el brazo derecho por debajo.", "Hasta que el hombro toque el piso.", "Mantené 2-3 segundos y volvé."], tip: "Despierta toda la columna antes de cargas pesadas." },
  "Skipping 30\" / Descanso 20\"": { muscles: "Cardiovascular · Pantorrillas · Coordinación", steps: ["Corré en el lugar levantando las rodillas hasta la cadera.", "Los brazos acompañan como en una carrera.", "Aterrizá en la punta del pie.", "30 seg al máximo, 20 seg caminando. × 3 rondas."], tip: "Simula la demanda cardiovascular de un rally largo." },
  "Remo / Bici 85%": { muscles: "Cardiovascular · Tren inferior · Espalda", steps: ["Remo o bicicleta estática.", "Alcanzá el 85% de tu FC máxima (220 - tu edad).", "Mantené ese ritmo durante 10 minutos."], tip: "El 85% es zona de umbral: alta intensidad sostenible." },
  "Battle Ropes": { muscles: "Hombros · Core · Cardiovascular · Antebrazos", steps: ["Agarrá un extremo de la cuerda en cada mano.", "Rodillas ligeramente flexionadas, core activado.", "Mové los brazos de forma alternada arriba y abajo.", "20 movimientos totales (10 por brazo)."], tip: "Trabaja potencia de tren superior sin cargar compresivamente el hombro." },
  "Box Jumps": { muscles: "Cuádriceps · Glúteos · Pantorrillas · Sistema nervioso", steps: ["Parate frente a un cajón estable.", "Flexioná rodillas, usá los brazos para impulso.", "Saltá aterrizando suavemente con rodillas dobladas.", "Bajá caminando — nunca saltando."], tip: "Entrena producción de fuerza explosiva. Directamente transferible al tenis." },
  "Sprint 20m": { muscles: "Tren inferior completo · Sistema nervioso · Cardiovascular", steps: ["Marcá 20 metros.", "Arrancá con máxima aceleración desde de pie.", "Los primeros 5m son los más importantes: empuje fuerte, inclinado adelante.", "Desacelerá gradualmente después de los 20m."], tip: "Ir a buscar una pelota en el tenis ES un sprint de 20m." },
  "Recuperación activa": { muscles: "Recuperación cardiovascular", steps: ["Caminá de regreso al punto de inicio.", "Inhalá por la nariz, exhalá por la boca.", "40 segundos entre cada sprint."], tip: "La calidad de recuperación determina la calidad del siguiente sprint." },
  "Glute bridge isométrico": { muscles: "Glúteos · Isquiotibiales · Core", steps: ["Acostada boca arriba, rodillas dobladas, pies cerca de los glúteos.", "Empujá con los talones y levantá las caderas.", "Apretá los glúteos al máximo arriba y mantené.", "Bajá lentamente y repetí."], tip: "Si no sentás los glúteos trabajar, acercá más los pies al cuerpo." },
  "World's greatest stretch": { muscles: "Cadera · Aductores · Isquiotibiales · Columna torácica", steps: ["Desde zancada larga, apoyá la mano delantera en el piso.", "Llevá el codo hacia el piso.", "Llevá esa mano hacia el techo rotando la columna.", "Estirá la pierna delantera alcanzando el pie."], tip: "Tres movimientos en uno. Hacelo despacio, sin rebotes." },
  "Goblet squat": { muscles: "Cuádriceps · Glúteos · Core", steps: ["Sostené una kettlebell frente al pecho con ambas manos.", "Pies al ancho de hombros o más, puntas hacia afuera.", "Descendé manteniendo los codos dentro de las rodillas.", "Talones siempre apoyados. Bajá a profundidad completa.", "Empujá el piso y subí con el pecho erguido."], tip: "El peso frente al cuerpo obliga a mantener la columna vertical." },
  "Hip thrust": { muscles: "Glúteos · Isquiotibiales · Core", steps: ["Apoyá la parte alta de la espalda en un banco, peso en las caderas.", "Pies al ancho de hombros, rodillas a 90° al subir.", "Empujá las caderas hasta formar una línea recta.", "Apretá los glúteos al máximo arriba 1 segundo.", "Bajá controlado sin tocar el piso completamente."], tip: "Es el ejercicio que más activa el glúteo mayor. La clave es el apretón arriba." },
  "Pigeon pose (figura 4)": { muscles: "Glúteos · Rotadores externos de cadera · Piriforme", steps: ["Desde el piso, pierna delantera doblada en 90°.", "La pierna trasera extendida hacia atrás.", "Inclinате hacia adelante sobre la pierna delantera.", "Mantené respirando profundo.", "Cambiá de lado."], tip: "No fuerces la cadera hacia el piso. Con el tiempo va bajando sola." },
  "Intervalos en cinta o bicicleta": { muscles: "Cardiovascular · Tren inferior · Resistencia aeróbica", steps: ["Calentá 2 minutos a ritmo suave.", "Subí al 75% de esfuerzo máximo durante 90 segundos.", "Bajá a caminata activa durante 60 segundos.", "Repetí 4 rondas completas."], tip: "El 75% es cuando podés hablar pero te cuesta." },
  "Dead bug": { muscles: "Core (transverso · oblicuos) · Estabilización lumbar", steps: ["Acostada boca arriba, brazos hacia el techo, rodillas a 90° en el aire.", "Pegá la zona lumbar completamente al piso.", "Extendé el brazo derecho hacia atrás y la pierna izquierda simultáneamente.", "Volvé al centro y repetí del otro lado."], tip: "Si la zona lumbar se despega del piso, reducí el rango de movimiento." },
  "Remo con mancuerna": { muscles: "Dorsales · Romboides · Trapecio · Bíceps", steps: ["Apoyá una mano y rodilla en un banco, espalda paralela al piso.", "Mancuerna colgando con el brazo extendido.", "Jalá el codo hacia atrás y arriba, pegado al cuerpo.", "Llegá hasta que el codo supere la línea de la espalda.", "Bajá lento con control."], tip: "El codo lidera el movimiento, no la mano." },
  "Sumo squat con mancuerna": { muscles: "Glúteos · Aductores · Cuádriceps · Core", steps: ["De pie con pies muy separados, puntas a 45°.", "Sostené una mancuerna pesada entre las piernas.", "Descendé con rodillas alineadas con las puntas.", "Empujá el piso y subí apretando los glúteos."], tip: "Esta variante activa mucho más los aductores y el glúteo. Ideal para GAP." },
  "Farmer carry": { muscles: "Core · Trapecio · Antebrazos · Estabilizadores de hombro", steps: ["Agarrá una mancuerna pesada en cada mano.", "Pecho erguido, hombros hacia atrás y abajo.", "Caminá con pasos medianos y controlados.", "Mantené el core apretado todo el tiempo."], tip: "Parece simple pero es uno de los mejores ejercicios para la postura y el core." },
  "Apertura torácica en foam roller": { muscles: "Columna torácica · Pectoral · Intercostales", steps: ["Colocá el foam roller horizontal bajo la columna torácica.", "Brazos cruzados sobre el pecho.", "Dejá que la espalda caiga hacia atrás sobre el rodillo.", "Respirá profundo y dejá que la gravedad trabaje."], tip: "Solo columna torácica (entre los omóplatos). No en la zona lumbar." },
  "Lateral shuffle + carioca": { muscles: "Aductores · Abductores · Coordinación · Tobillo", steps: ["SHUFFLE: En media sentadilla, desplazate lateralmente sin cruzar los pies.", "Mantené las rodillas flexionadas.", "CARIOCA: Desplazate al costado alternando pasos cruzados.", "15 metros en cada dirección."], tip: "Replican exactamente los desplazamientos del pádel." },
  "Fire hydrant + donkey kick": { muscles: "Glúteo medio · Glúteo mayor · Rotadores de cadera", steps: ["En cuatro apoyos, espalda recta.", "FIRE HYDRANT: Levantá la rodilla hacia el costado.", "DONKEY KICK: Pateá el talón hacia el techo con rodilla a 90°.", "Hacé ambas variantes en el mismo lado antes de cambiar."], tip: "Son ejercicios de activación. El objetivo es sentir el glúteo trabajar." },
  "Sentadilla con salto": { muscles: "Cuádriceps · Glúteos · Pantorrillas · Sistema nervioso", steps: ["De pie, pies al ancho de hombros.", "Descendé hasta paralelo controlando la bajada.", "Explotá hacia arriba saltando con máxima potencia.", "Aterrizá suavemente con rodillas flexionadas."], tip: "La calidad del salto importa más que la cantidad." },
  "Landmine rotation": { muscles: "Oblicuos · Core · Hombros · Cadena posterior", steps: ["Barra en un rincón o soporte landmine.", "De pie, sostenés el extremo con ambas manos extendidas.", "Rotá el torso llevando la barra de un lado al otro.", "La rotación viene de la cadera y el torso."], tip: "La cadera inicia el movimiento, los brazos lo terminan." },
  "Pull-up o jalón al pecho": { muscles: "Dorsales · Bíceps · Trapecio inferior · Core", steps: ["JALÓN: Agarre amplio, jalá la barra hacia el pecho superior.", "Codos apuntan hacia abajo y afuera.", "DOMINADAS: Agarre prono amplio, colgá con hombros deprimidos.", "Jalá hasta que la barbilla supere la barra.", "Bajá lento en 3 segundos."], tip: "Priorizá el rango completo sobre el peso." },
  "Abducción de cadera en máquina": { muscles: "Glúteo medio · TFL · Rotadores externos", steps: ["Sentada en la máquina con las piernas juntas.", "Abrí las piernas hacia afuera hasta el rango completo.", "Sostenés 1 segundo al final.", "Volvé lento — 3 segundos de bajada."], tip: "La bajada lenta y controlada es donde más trabaja el glúteo medio." },
  "90/90 Hip Stretch": { muscles: "Rotadores de cadera · Glúteos · Aductores", steps: ["Sentate con ambas piernas en 90°.", "Inclinате hacia adelante sobre la pierna delantera.", "Mantené la posición 60 segundos.", "Cambiá de lado."], tip: "Respirá profundo para soltar la tensión de cadera." },
}

const ROUTINES = [
  {
    id: "atletica", name: "Rutina Atlética", description: "Fuerza · Movilidad · Tenis", emoji: "🎾", color: "#3B82F6",
    days: [
      { id:1, label:"DÍA 1", title:"Potencia & Tren Inferior", accent:"#3B82F6", accentDark:"#1D4ED8", emoji:"🦵", phases:[
        { id:"mob", label:"MOVILIDAD", duration:8, color:"#06B6D4", exercises:[{name:"90/90 Hip Rotations",detail:"10 reps / lado",timer:60},{name:"World's Greatest Stretch",detail:"5 reps / lado",timer:90},{name:"Ankle Mobility en pared",detail:"10 reps / lado",timer:60}]},
        { id:"str", label:"FUERZA", duration:30, color:"#3B82F6", exercises:[{name:"Sentadilla Frontal",detail:"4 × 5",timer:300,sets:4},{name:"Romanian Deadlift",detail:"3 × 8",timer:240,sets:3},{name:"Bulgarian Split Squat",detail:"3 × 8/lado",timer:240,sets:3},{name:"Pallof Press",detail:"3 × 10/lado",timer:180,sets:3}]},
        { id:"fin", label:"FINALIZADOR", duration:10, color:"#F59E0B", exercises:[{name:"Skipping 30\" / Descanso 20\"",detail:"3 rondas",timer:150},{name:"Remo / Bici 85%",detail:"alternativa cardio",timer:600}]},
      ]},
      { id:2, label:"DÍA 2", title:"Tren Superior & Hombros", accent:"#10B981", accentDark:"#047857", emoji:"💪", phases:[
        { id:"mob", label:"MOVILIDAD", duration:8, color:"#06B6D4", exercises:[{name:"Rotación Torácica cuadrupedia",detail:"10 reps / lado",timer:60},{name:"Wall Slide",detail:"10 reps",timer:60},{name:"Child's Pose apertura lateral",detail:"30\" por lado",timer:60}]},
        { id:"str", label:"FUERZA", duration:30, color:"#10B981", exercises:[{name:"Dominadas con lastre",detail:"4 × 5-6",timer:300,sets:4},{name:"Press banca mancuernas",detail:"3 × 8",timer:240,sets:3},{name:"Face Pull con cuerda",detail:"3 × 15",timer:180,sets:3},{name:"Remo Yates / Pendlay Row",detail:"3 × 6",timer:240,sets:3},{name:"Curl + Press Arnold",detail:"2 × 10",timer:180,sets:2}]},
        { id:"fin", label:"FINALIZADOR", duration:10, color:"#F59E0B", exercises:[{name:"Battle Ropes",detail:"20 movimientos",timer:60},{name:"Box Jumps",detail:"10 reps × 4 rondas",timer:60}]},
      ]},
      { id:3, label:"DÍA 3", title:"Atletismo & Core", accent:"#8B5CF6", accentDark:"#6D28D9", emoji:"⚡", phases:[
        { id:"mob", label:"MOVILIDAD", duration:8, color:"#06B6D4", exercises:[{name:"Hip Flexor Stretch dinámico",detail:"8 reps / lado",timer:60},{name:"Rotación cadera decúbito",detail:"10 reps / lado",timer:60},{name:"Cat-Cow + Thread the Needle",detail:"10 reps",timer:60}]},
        { id:"str", label:"FUERZA", duration:30, color:"#8B5CF6", exercises:[{name:"Peso Muerto Convencional",detail:"4 × 4",timer:360,sets:4},{name:"Swing con Kettlebell",detail:"4 × 12",timer:240,sets:4},{name:"Step-up con mancuernas",detail:"3 × 10/lado",timer:240,sets:3},{name:"Plank con arrastre",detail:"3 × 8/lado",timer:180,sets:3},{name:"Turkish Get-Up",detail:"2 × 3/lado",timer:300,sets:2}]},
        { id:"fin", label:"FINALIZADOR", duration:10, color:"#F59E0B", exercises:[{name:"Sprint 20m",detail:"5 sprints",timer:40},{name:"Recuperación activa",detail:"40\" caminando",timer:40}]},
      ]},
    ],
  },
  {
    id: "gap-padel-3dias", name: "Rutina GAP + Pádel", description: "Fuerza funcional · Movilidad · GAP", emoji: "🏸", color: "#2B5C3F",
    days: [
      { id:1, label:"DÍA 1", title:"Glúteos + Piernas + Core", accent:"#2B5C3F", accentDark:"#1A3D2A", emoji:"🦵", phases:[
        { id:"mob", label:"MOVILIDAD", duration:8, color:"#06B6D4", exercises:[{name:"Glute bridge isométrico",detail:"2 × 20 seg",timer:40},{name:"World's greatest stretch",detail:"2 × 6 reps / lado",timer:90}]},
        { id:"str", label:"FUERZA", duration:30, color:"#2B5C3F", exercises:[{name:"Goblet squat",detail:"4 × 10",timer:180,sets:4},{name:"Romanian Deadlift",detail:"4 × 8",timer:180,sets:4},{name:"Hip thrust",detail:"3 × 12",timer:150,sets:3},{name:"Pallof Press",detail:"3 × 10/lado",timer:120,sets:3}]},
        { id:"fin", label:"CIERRE", duration:6, color:"#F59E0B", exercises:[{name:"Pigeon pose (figura 4)",detail:"2 × 45 seg / lado",timer:90}]},
      ]},
      { id:2, label:"DÍA 2", title:"Abdomen + Tren superior", accent:"#3D3080", accentDark:"#28205A", emoji:"💪", phases:[
        { id:"res", label:"RESISTENCIA", duration:12, color:"#F97316", exercises:[{name:"Intervalos en cinta o bicicleta",detail:"4 rondas: 90 seg al 75%",timer:600}]},
        { id:"str", label:"FUERZA", duration:26, color:"#3D3080", exercises:[{name:"Dead bug",detail:"3 × 8/lado",timer:120,sets:3},{name:"Remo con mancuerna",detail:"3 × 10/lado",timer:150,sets:3},{name:"Face Pull con cuerda",detail:"3 × 15",timer:90,sets:3},{name:"Sumo squat con mancuerna",detail:"3 × 12",timer:120,sets:3},{name:"Farmer carry",detail:"3 × 20 metros",timer:60,sets:3}]},
        { id:"fin", label:"CIERRE", duration:6, color:"#F59E0B", exercises:[{name:"Apertura torácica en foam roller",detail:"2 min",timer:120}]},
      ]},
      { id:3, label:"DÍA 3", title:"Potencia + Piernas unilaterales", accent:"#7A3A10", accentDark:"#4A2008", emoji:"⚡", phases:[
        { id:"mob", label:"ACTIVACIÓN", duration:8, color:"#06B6D4", exercises:[{name:"Lateral shuffle + carioca",detail:"3 × 15 metros / lado",timer:90},{name:"Fire hydrant + donkey kick",detail:"2 × 10/lado",timer:90}]},
        { id:"str", label:"POTENCIA Y FUERZA", duration:30, color:"#7A3A10", exercises:[{name:"Sentadilla con salto",detail:"4 × 5",timer:120,sets:4},{name:"Bulgarian Split Squat",detail:"3 × 8/lado",timer:180,sets:3},{name:"Landmine rotation",detail:"3 × 10/lado",timer:150,sets:3},{name:"Pull-up o jalón al pecho",detail:"3 × 8",timer:150,sets:3},{name:"Abducción de cadera en máquina",detail:"3 × 15",timer:90,sets:3}]},
        { id:"fin", label:"CIERRE", duration:6, color:"#F59E0B", exercises:[{name:"90/90 Hip Stretch",detail:"2 × 60 seg / lado",timer:120}]},
      ]},
    ],
  },
]

function fmt(s: number) { return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0") }

// ── Info Modal ────────────────────────────────────────────────────────────────
function InfoModal({ name, onClose }: { name: string; onClose: () => void }) {
  const info = ALL_INFO[name]
  if (!info) return null
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0F172A",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",paddingBottom:32}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:"#334155"}}/></div>
        {info.img && <div style={{width:"100%",height:200,overflow:"hidden",marginTop:8,background:"#1E293B"}}><img src={info.img} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e:any)=>{e.target.parentNode.style.display="none"}}/></div>}
        <div style={{padding:"16px 20px 0"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>{name}</div>
          <div style={{display:"inline-block",background:"#1E293B",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#94A3B8",marginBottom:16}}>{info.muscles}</div>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",letterSpacing:"0.1em",marginBottom:8}}>EJECUCIÓN</div>
          {info.steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
              <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:"#1E293B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#64748B"}}>{i+1}</div>
              <div style={{fontSize:13,color:"#CBD5E1",lineHeight:1.5,paddingTop:2}}>{step}</div>
            </div>
          ))}
          <div style={{marginTop:16,background:"#1E293B",borderRadius:12,padding:"12px 14px",borderLeft:"3px solid #F59E0B"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#F59E0B",letterSpacing:"0.1em",marginBottom:4}}>CLAVE</div>
            <div style={{fontSize:13,color:"#94A3B8",lineHeight:1.5}}>{info.tip}</div>
          </div>
          <button onClick={onClose} style={{width:"100%",marginTop:16,background:"#1E293B",border:"none",borderRadius:12,padding:"14px",color:"#94A3B8",fontSize:14,fontWeight:700,cursor:"pointer"}}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ── Exercise Row with weight tracking ────────────────────────────────────────
function ExRow({ ex, color, num, checked, onCheck, onInfo, lastWeights, onWeightsChange }: any) {
  const [open, setOpen] = useState(false)
  const [secs, setSecs] = useState(ex.timer)
  const [running, setRunning] = useState(false)
  const ref = useRef<any>(null)
  const isStrength = STRENGTH_EXERCISES.has(ex.name)
  const numSets = ex.sets || 3
  const [weights, setWeights] = useState<string[]>(() => {
    if (lastWeights && lastWeights.length > 0) return lastWeights.map((w:any) => w.toString())
    return Array(numSets).fill('')
  })

  useEffect(() => {
    if (running && secs > 0) { ref.current = setInterval(() => setSecs((s:number) => s-1), 1000) }
    else { clearInterval(ref.current); if (secs === 0) setRunning(false) }
    return () => clearInterval(ref.current)
  }, [running])

  useEffect(() => {
    if (lastWeights && lastWeights.length > 0) {
      setWeights(lastWeights.map((w:any) => w.toString()))
    }
  }, [lastWeights])

  function updateWeight(idx: number, val: string) {
    const newW = [...weights]
    newW[idx] = val
    setWeights(newW)
    onWeightsChange?.(ex.name, newW)
  }

  const done = secs === 0 && ex.timer > 0
  const pct = ex.timer > 0 ? (secs / ex.timer) * 100 : 0
  const hasInfo = !!ALL_INFO[ex.name]

  return (
    <div style={{background:checked?"#052e16":"#0F172A",border:`1px solid ${checked?"#166534":"#1E293B"}`,borderRadius:12,marginBottom:8,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
        <div onClick={onCheck} style={{width:24,height:24,borderRadius:7,flexShrink:0,border:`2px solid ${checked?"#22C55E":"#334155"}`,background:checked?"#22C55E":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:700}}>{checked?"✓":""}</div>
        <div style={{width:22,height:22,borderRadius:"50%",background:color+"30",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color}}>{num}</div>
        <div style={{flex:1,minWidth:0}} onClick={() => setOpen(o => !o)}>
          <div style={{fontSize:14,fontWeight:700,color:checked?"#4ADE80":"#F1F5F9",textDecoration:checked?"line-through":"none"}}>{ex.name}</div>
          <div style={{fontSize:11,color:"#64748B",marginTop:1}}>{ex.detail}</div>
        </div>
        {hasInfo && <button onClick={onInfo} style={{background:"transparent",border:"1px solid #334155",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#64748B",fontSize:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>?</button>}
        <div onClick={() => setOpen(o => !o)} style={{color:"#475569",fontSize:13,cursor:"pointer",transform:open?"rotate(180deg)":"none",flexShrink:0}}>▼</div>
      </div>

      {open && (
        <div style={{padding:"0 14px 14px",borderTop:"1px solid #1E293B"}}>
          {/* Weight inputs for strength exercises */}
          {isStrength && (
            <div style={{marginTop:12,marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.1em",marginBottom:8}}>PESOS POR SERIE (kg)</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {weights.map((w, i) => (
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{fontSize:9,color:"#475569"}}>S{i+1}</div>
                    <input
                      type="number"
                      value={w}
                      onChange={e => updateWeight(i, e.target.value)}
                      placeholder={lastWeights?.[i] ? String(lastWeights[i]) : "kg"}
                      style={{width:52,padding:"6px 4px",borderRadius:8,border:"1px solid #334155",background:"#1E293B",color:"#F1F5F9",fontSize:13,textAlign:"center",outline:"none"}}
                    />
                    {lastWeights?.[i] && (
                      <div style={{fontSize:9,color:"#3B82F6"}}>↑{lastWeights[i]}kg</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timer */}
          {ex.timer > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:4}}>
              <div style={{width:100,height:5,background:"#1E293B",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:done?"#22C55E":color,borderRadius:3,transition:"width 1s linear"}}/>
              </div>
              <span style={{fontSize:14,fontWeight:700,color:done?"#22C55E":"#F1F5F9",minWidth:42}}>{done?"✓ listo":fmt(secs)}</span>
              {!done && <button onClick={() => setRunning(r => !r)} style={{background:running?"#334155":color,border:"none",borderRadius:8,padding:"5px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{running?"⏸ Pausa":"▶ Start"}</button>}
              <button onClick={() => {setRunning(false);setSecs(ex.timer)}} style={{background:"transparent",border:"1px solid #334155",borderRadius:8,padding:"5px 10px",color:"#64748B",fontSize:12,cursor:"pointer"}}>↺</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Session Clock ─────────────────────────────────────────────────────────────
function SessionClock({ accent, onElapsedChange }: { accent: string; onElapsedChange: (s: number) => void }) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const ref = useRef<any>(null)
  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(e => { onElapsedChange(e+1); return e+1 }), 1000)
    else clearInterval(ref.current)
    return () => clearInterval(ref.current)
  }, [running])
  const over = elapsed > 55 * 60
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,background:"#0F172A",borderRadius:14,padding:"12px 16px",border:`1px solid ${over?"#EF4444":"#1E293B"}`,marginBottom:20}}>
      <div style={{fontSize:24,fontWeight:800,color:over?"#EF4444":"#F1F5F9",minWidth:72,letterSpacing:1}}>{fmt(elapsed)}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:10,color:"#475569",letterSpacing:"0.1em",fontWeight:700}}>SESIÓN</div>
        {over && <div style={{fontSize:9,color:"#EF4444",marginTop:1}}>+55 min</div>}
      </div>
      <button onClick={() => setRunning(r => !r)} style={{background:running?"#1E293B":accent,border:"none",borderRadius:10,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{running?"⏸ Pausa":elapsed===0?"▶ Iniciar":"▶ Seguir"}</button>
      {elapsed > 0 && !running && <button onClick={() => {setElapsed(0);setRunning(false);onElapsedChange(0)}} style={{background:"transparent",border:"1px solid #334155",borderRadius:10,padding:"8px 10px",color:"#64748B",fontSize:13,cursor:"pointer"}}>↺</button>}
    </div>
  )
}

// ── Completion Modal ──────────────────────────────────────────────────────────
function CompletionModal({ day, routine, duration, onSave, saving }: any) {
  const [notes, setNotes] = useState('')
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#0F172A",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"24px 24px 40px"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><div style={{width:36,height:4,borderRadius:2,background:"#334155"}}/></div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:8}}>🎉</div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>¡Sesión completada!</div>
          <div style={{fontSize:13,color:"#64748B"}}>{day.label} — {routine.name}</div>
          <div style={{fontSize:13,color:"#3B82F6",marginTop:4}}>⏱ {fmt(duration)}</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",letterSpacing:"0.1em",marginBottom:8}}>NOTAS DE LA SESIÓN (opcional)</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="¿Cómo te fue? ¿Algo para ajustar la próxima vez?"
            style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid #1E293B",background:"#1E293B",color:"#F1F5F9",fontSize:13,resize:"none",height:90,boxSizing:"border-box",outline:"none",fontFamily:"system-ui,sans-serif"}}
          />
        </div>
        <button
          onClick={() => onSave(notes)}
          disabled={saving}
          style={{width:"100%",padding:"16px",borderRadius:12,border:"none",background:saving?"#1E293B":"#22C55E",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}
        >
          {saving ? "Guardando..." : "Guardar sesión"}
        </button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState<User>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [routineIdx, setRoutineIdx] = useState<number|null>(null)
  const [dayIdx, setDayIdx] = useState<number|null>(null)
  const [checks, setChecks] = useState<Record<string,boolean>>({})
  const [log, setLog] = useState<{t:string;name:string}[]>([])
  const [modal, setModal] = useState<string|null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [exerciseWeights, setExerciseWeights] = useState<Record<string,string[]>>({})
  const [lastWeights, setLastWeights] = useState<Record<string,number[]>>({})
  const [showCompletion, setShowCompletion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recentSessions, setRecentSessions] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user as User ?? null) })
    supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user as User ?? null) })
  }, [])

  useEffect(() => {
    if (user) loadRecentSessions()
  }, [user])

  async function loadRecentSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(5)
    if (data) setRecentSessions(data)
  }

  async function loadLastWeights(routineId: string, dayId: number) {
    if (!user) return
    const { data } = await supabase
      .from('exercise_weights')
      .select('*')
      .eq('routine_id', routineId)
      .eq('day_id', dayId)
    if (data) {
      const map: Record<string,number[]> = {}
      data.forEach((r: any) => { map[r.exercise_name] = r.last_series })
      setLastWeights(map)
    }
  }

  async function handleAuth() {
    setLoading(true); setError('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message) }
      else if (data.user) { await supabase.from('profiles').insert({ id: data.user.id, name }); setEmailSent(true) }
    }
    setLoading(false)
  }

  async function handleLogout() { await supabase.auth.signOut(); setRoutineIdx(null); setDayIdx(null) }

  function toggleCheck(key: string, exName: string) {
    const was = !!checks[key]
    setChecks(c => ({ ...c, [key]: !c[key] }))
    if (!was) { const t = new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}); setLog(l=>[{t,name:exName},...l]) }
  }

  function handleWeightsChange(exName: string, weights: string[]) {
    setExerciseWeights(prev => ({ ...prev, [exName]: weights }))
  }

  async function saveSession(notes: string) {
    if (!user || !routine || !day) return
    setSaving(true)
    try {
      // 1. Guardar sesión
      const { data: sessionData } = await supabase.from('sessions').insert({
        user_id: user.id,
        routine_id: routine.id,
        day_id: day.id,
        duration_seconds: sessionDuration,
        exercises_completed: totalDone,
        notes: notes || null,
      }).select().single()

      if (sessionData) {
        // 2. Guardar ejercicios con pesos
        const exerciseRows = Object.entries(exerciseWeights)
          .filter(([_, w]) => w.some(v => v !== ''))
          .map(([name, weights]) => ({
            session_id: sessionData.id,
            user_id: user.id,
            routine_id: routine.id,
            day_id: day.id,
            exercise_name: name,
            series: weights.map(w => parseFloat(w) || 0),
          }))

        if (exerciseRows.length > 0) {
          await supabase.from('session_exercises').insert(exerciseRows)
        }

        // 3. Actualizar últimos pesos de referencia
        for (const [name, weights] of Object.entries(exerciseWeights)) {
          if (weights.some(v => v !== '')) {
            await supabase.from('exercise_weights').upsert({
              user_id: user.id,
              routine_id: routine.id,
              day_id: day.id,
              exercise_name: name,
              last_series: weights.map(w => parseFloat(w) || 0),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,routine_id,day_id,exercise_name' })
          }
        }
      }

      await loadRecentSessions()
      setShowCompletion(false)
      setDayIdx(null)
      setChecks({})
      setLog([])
      setExerciseWeights({})
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const bg = { minHeight:'100vh', background:'#020B18', color:'#F1F5F9', fontFamily:'system-ui,-apple-system,sans-serif' }

  if (emailSent) return (
    <div style={{...bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',maxWidth:380,padding:'0 24px'}}>
        <div style={{fontSize:56,marginBottom:20}}>📧</div>
        <div style={{fontSize:22,fontWeight:800,marginBottom:12}}>Revisá tu email</div>
        <div style={{fontSize:14,color:'#64748B',lineHeight:1.6,marginBottom:24}}>Te mandamos un link de confirmación a<br/><span style={{color:'#3B82F6',fontWeight:600}}>{email}</span></div>
        <div style={{background:'#0F172A',borderRadius:14,padding:'16px 20px',border:'1px solid #1E293B',fontSize:13,color:'#94A3B8',lineHeight:1.6}}>Una vez que confirmes tu cuenta podés volver acá e iniciar sesión.</div>
        <button onClick={()=>{setEmailSent(false);setIsLogin(true)}} style={{marginTop:20,background:'transparent',border:'1px solid #334155',borderRadius:12,padding:'10px 24px',color:'#64748B',fontSize:13,cursor:'pointer'}}>Volver al login</button>
      </div>
    </div>
  )

  if (!user) return (
    <div style={{...bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:400,padding:'0 24px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:48,marginBottom:12}}>🏋️</div>
          <div style={{fontSize:28,fontWeight:800}}>App Gym</div>
          <div style={{fontSize:14,color:'#475569',marginTop:4}}>Tu entrenamiento, tu data</div>
        </div>
        <div style={{background:'#0F172A',borderRadius:20,padding:32,border:'1px solid #1E293B'}}>
          <div style={{display:'flex',marginBottom:24,background:'#1E293B',borderRadius:12,padding:4}}>
            <button onClick={()=>setIsLogin(true)} style={{flex:1,padding:'8px',borderRadius:10,border:'none',background:isLogin?'#3B82F6':'transparent',color:'#fff',fontWeight:700,cursor:'pointer'}}>Entrar</button>
            <button onClick={()=>setIsLogin(false)} style={{flex:1,padding:'8px',borderRadius:10,border:'none',background:!isLogin?'#3B82F6':'transparent',color:'#fff',fontWeight:700,cursor:'pointer'}}>Registrarse</button>
          </div>
          {!isLogin && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={{width:'100%',padding:'12px 16px',borderRadius:12,border:'1px solid #1E293B',background:'#1E293B',color:'#F1F5F9',fontSize:14,marginBottom:12,boxSizing:'border-box'}}/>}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{width:'100%',padding:'12px 16px',borderRadius:12,border:'1px solid #1E293B',background:'#1E293B',color:'#F1F5F9',fontSize:14,marginBottom:12,boxSizing:'border-box'}}/>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" type="password" style={{width:'100%',padding:'12px 16px',borderRadius:12,border:'1px solid #1E293B',background:'#1E293B',color:'#F1F5F9',fontSize:14,marginBottom:20,boxSizing:'border-box'}}/>
          {error && <div style={{color:'#EF4444',fontSize:13,marginBottom:12}}>{error}</div>}
          <button onClick={handleAuth} disabled={loading} style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:'#3B82F6',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>{loading?'Cargando...':isLogin?'Entrar':'Crear cuenta'}</button>
        </div>
      </div>
    </div>
  )

  const routine = routineIdx !== null ? ROUTINES[routineIdx] : null
  const day = routine && dayIdx !== null ? routine.days[dayIdx] : null
  const totalEx = day ? day.phases.reduce((a:number,p:any)=>a+p.exercises.length,0) : 0
  const totalDone = Object.values(checks).filter(Boolean).length
  const allDone = day && totalDone === totalEx

  // Selector de rutina
  if (routineIdx === null) return (
    <div style={bg}>
      <div style={{maxWidth:440,margin:'0 auto',padding:'32px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div>
            <div style={{fontSize:11,letterSpacing:'0.2em',color:'#06B6D4',fontWeight:700,marginBottom:4}}>APP GYM</div>
            <div style={{fontSize:20,fontWeight:800}}>¿Qué entrenamos hoy?</div>
          </div>
          <button onClick={handleLogout} style={{background:'#0F172A',border:'1px solid #1E293B',borderRadius:10,padding:'8px 14px',color:'#64748B',fontSize:12,cursor:'pointer'}}>Salir</button>
        </div>
        <div style={{fontSize:12,color:'#475569',marginBottom:16}}>Hola, {user.email} 👋</div>

        {ROUTINES.map((r,i)=>(
          <div key={r.id} onClick={()=>{setRoutineIdx(i);setDayIdx(null);setChecks({});setLog([])}} style={{background:'#0F172A',border:`1px solid ${r.color}33`,borderRadius:18,padding:'20px 22px',marginBottom:12,cursor:'pointer',display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:54,height:54,borderRadius:16,flexShrink:0,background:r.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{r.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:800,color:'#F1F5F9',marginBottom:3}}>{r.name}</div>
              <div style={{fontSize:12,color:'#475569'}}>{r.description}</div>
              <div style={{fontSize:11,color:r.color,marginTop:4,fontWeight:600}}>{r.days.length} días</div>
            </div>
            <div style={{color:'#334155',fontSize:20}}>›</div>
          </div>
        ))}

        {recentSessions.length > 0 && (
          <div style={{marginTop:24,background:'#0F172A',borderRadius:14,padding:'16px',border:'1px solid #1E293B'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#475569',letterSpacing:'0.15em',marginBottom:12}}>ÚLTIMAS SESIONES</div>
            {recentSessions.map((s,i)=>{
              const r = ROUTINES.find(r=>r.id===s.routine_id)
              const d = r?.days.find((d:any)=>d.id===s.day_id)
              return(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,paddingBottom:8,borderBottom:i<recentSessions.length-1?'1px solid #1E293B':'none'}}>
                  <div style={{fontSize:18}}>{r?.emoji||'🏋️'}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#F1F5F9'}}>{r?.name} · {d?.label}</div>
                    <div style={{fontSize:11,color:'#475569'}}>{new Date(s.completed_at).toLocaleDateString('es-AR')} · {s.duration_seconds?fmt(s.duration_seconds):'-'}</div>
                    {s.notes && <div style={{fontSize:11,color:'#64748B',marginTop:2,fontStyle:'italic'}}>"{s.notes}"</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // Selector de día
  if (dayIdx === null) return (
    <div style={bg}>
      <div style={{maxWidth:440,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <button onClick={()=>setRoutineIdx(null)} style={{background:'#0F172A',border:'1px solid #1E293B',borderRadius:10,width:38,height:38,cursor:'pointer',color:'#94A3B8',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>‹</button>
          <div>
            <div style={{fontSize:11,color:'#475569',letterSpacing:'0.1em',fontWeight:700}}>RUTINA</div>
            <div style={{fontSize:18,fontWeight:800}}>{routine!.name}</div>
          </div>
        </div>
        {routine!.days.map((d:any,i:number)=>(
          <div key={d.id} onClick={()=>{setDayIdx(i);setChecks({});setLog([]);setExerciseWeights({});loadLastWeights(routine!.id,d.id)}} style={{background:'#0F172A',border:'1px solid #1E293B',borderRadius:18,padding:'18px 20px',marginBottom:12,cursor:'pointer',display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:50,height:50,borderRadius:14,flexShrink:0,background:d.accent+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{d.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:d.accent,letterSpacing:'0.1em',marginBottom:2}}>{d.label}</div>
              <div style={{fontSize:16,fontWeight:700}}>{d.title}</div>
              <div style={{fontSize:11,color:'#475569',marginTop:2}}>{d.phases.reduce((a:number,p:any)=>a+p.exercises.length,0)} ejercicios · 45–55 min</div>
            </div>
            <div style={{color:'#334155',fontSize:20}}>›</div>
          </div>
        ))}
      </div>
    </div>
  )

  // Sesión
  const pct = totalEx > 0 ? (totalDone/totalEx)*100 : 0
  return (
    <div style={bg}>
      {modal && <InfoModal name={modal} onClose={()=>setModal(null)}/>}
      {showCompletion && <CompletionModal day={day} routine={routine} duration={sessionDuration} onSave={saveSession} saving={saving}/>}

      <div style={{maxWidth:480,margin:'0 auto',padding:'20px 16px 48px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
          <button onClick={()=>setDayIdx(null)} style={{background:'#0F172A',border:'1px solid #1E293B',borderRadius:10,width:38,height:38,cursor:'pointer',color:'#94A3B8',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>‹</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,fontWeight:700,color:day!.accent,letterSpacing:'0.15em'}}>{day!.label} · {routine!.name}</div>
            <div style={{fontSize:16,fontWeight:800}}>{day!.title}</div>
          </div>
          <div style={{fontSize:14,color:'#475569',flexShrink:0}}><span style={{color:allDone?'#22C55E':day!.accent,fontWeight:700}}>{totalDone}</span>/{totalEx}</div>
        </div>

        <div style={{height:4,background:'#1E293B',borderRadius:4,marginBottom:20,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:allDone?'#22C55E':day!.accent,borderRadius:4,transition:'width 0.4s ease'}}/>
        </div>

        <SessionClock accent={day!.accent} onElapsedChange={setSessionDuration}/>

        {day!.phases.map((phase:any,pi:number)=>{
          const phaseDone=phase.exercises.filter((_:any,ei:number)=>checks[`${pi}-${ei}`]).length
          return(
            <div key={phase.id} style={{marginBottom:24}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:3,height:18,borderRadius:2,background:phase.color,flexShrink:0}}/>
                <div style={{fontSize:11,fontWeight:800,color:phase.color,letterSpacing:'0.12em'}}>{phase.label}</div>
                <div style={{fontSize:10,color:'#475569'}}>({phase.duration} min)</div>
                <div style={{marginLeft:'auto',fontSize:11,fontWeight:600,color:phaseDone===phase.exercises.length?'#22C55E':'#475569'}}>{phaseDone}/{phase.exercises.length}</div>
              </div>
              {phase.exercises.map((ex:any,ei:number)=>(
                <ExRow
                  key={ei} ex={ex} color={phase.color} num={ei+1}
                  checked={!!checks[`${pi}-${ei}`]}
                  onCheck={()=>toggleCheck(`${pi}-${ei}`,ex.name)}
                  onInfo={()=>setModal(ex.name)}
                  lastWeights={lastWeights[ex.name]}
                  onWeightsChange={handleWeightsChange}
                />
              ))}
            </div>
          )
        })}

        {allDone && !showCompletion && (
          <button
            onClick={()=>setShowCompletion(true)}
            style={{width:'100%',padding:'18px',borderRadius:16,border:'none',background:'linear-gradient(135deg,#16A34A,#22C55E)',color:'#fff',fontSize:16,fontWeight:800,cursor:'pointer',marginTop:8}}
          >
            🎉 Guardar sesión
          </button>
        )}

        {log.length > 0 && (
          <div style={{marginTop:24,background:'#0F172A',borderRadius:14,padding:'16px',border:'1px solid #1E293B'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#475569',letterSpacing:'0.15em',marginBottom:10}}>LOG DE SESIÓN</div>
            {log.map((l,i)=>(
              <div key={i} style={{display:'flex',gap:10,marginBottom:6,fontSize:12}}>
                <span style={{color:'#334155',flexShrink:0}}>{l.t}</span>
                <span style={{color:'#4ADE80'}}>✓</span>
                <span style={{color:'#94A3B8'}}>{l.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}