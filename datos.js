'use strict';

// =============================================
// CONFIGURACIÓN
// =============================================
const CONFIG = {
    // URL del Web App de Google Apps Script (deploy como Web app)
    urlLecturaSheets: "https://script.google.com/macros/s/AKfycbwYgXApwfhd97O5vy-PVddaYSiDAwvkNKSxqptS5Thwysn0HSuCc1_2ooreeNhFrMK-Cw/exec",
    // URL para enviar consultas (puede ser la misma si el script lo maneja)
    urlConsultasSheets: "https://script.google.com/macros/s/AKfycbwYgXApwfhd97O5vy-PVddaYSiDAwvkNKSxqptS5Thwysn0HSuCc1_2ooreeNhFrMK-Cw/exec",
    fechaActualizacion: "Mayo 2025",
    // tiempo de espera aumentado para conexiones lentas (ms)
    tiempoEsperaMs: 10000,
};

// =============================================
// BASE DE DATOS LOCAL (FALLBACK SIN INTERNET)
// =============================================
const INSTITUCIONES_FALLBACK = [
    {
        id: 1,
        nombre: "Universidad Autónoma Gabriel René Moreno",
        sigla: "UAGRM",
        tipo: "Universidad",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "La universidad pública más grande de Bolivia y del oriente boliviano, con más de 80 años formando profesionales en todas las áreas del conocimiento.",
        telefono: "+591 3 336-6000",
        email: "informaciones@uagrm.edu.bo",
        web: "https://www.uagrm.edu.bo",
        linkResenas: "",
        costoMensual: 0,
        costoInscripcion: 0,
        carreras: [
            { nombre: "Medicina", duracion: "6 años", area: "Salud" },
            { nombre: "Derecho", duracion: "5 años", area: "Jurídica" },
            { nombre: "Ingeniería Civil", duracion: "5 años", area: "Ingeniería" },
            { nombre: "Administración de Empresas", duracion: "5 años", area: "Negocios" },
            { nombre: "Ingeniería Informática", duracion: "5 años", area: "Tecnología" },
            { nombre: "Enfermería", duracion: "4 años", area: "Salud" },
            { nombre: "Contaduría Pública", duracion: "5 años", area: "Negocios" },
            { nombre: "Veterinaria", duracion: "5 años", area: "Salud" },
            { nombre: "Arquitectura", duracion: "5 años", area: "Creativo" },
        ],
        becas: false,
        modalidad: "Presencial",
        acreditacion: "CEUB",
        tags: ["pública", "gratuita", "presencial"],
        valoracion: 4.2,
        numResenas: 148,
        resenas: [
            { autor: "Carlos M.", texto: "Buena formación académica, aunque la infraestructura podría mejorar.", estrellas: 4 },
            { autor: "Ana L.", texto: "Excelente nivel académico en Medicina. Lo recomiendo mucho.", estrellas: 5 },
            { autor: "Pedro G.", texto: "La mejor opción pública. Requiere dedicación, pero vale la pena.", estrellas: 4 },
        ]
    },
    {
        id: 2,
        nombre: "Universidad Privada de Santa Cruz de la Sierra",
        sigla: "UPSA",
        tipo: "Universidad",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "Una de las universidades privadas más reconocidas de Bolivia, con enfoque en calidad académica, investigación y vínculos empresariales.",
        telefono: "+591 3 346-4000",
        email: "informacion@upsa.edu.bo",
        web: "https://www.upsa.edu.bo",
        linkResenas: "",
        costoMensual: 1200,
        costoInscripcion: 500,
        carreras: [
            { nombre: "Ingeniería Industrial", duracion: "5 años", area: "Ingeniería" },
            { nombre: "Administración de Empresas", duracion: "5 años", area: "Negocios" },
            { nombre: "Medicina", duracion: "6 años", area: "Salud" },
            { nombre: "Arquitectura", duracion: "5 años", area: "Creativo" },
            { nombre: "Ingeniería de Sistemas", duracion: "5 años", area: "Tecnología" },
            { nombre: "Psicología", duracion: "5 años", area: "Social" },
            { nombre: "Marketing", duracion: "4 años", area: "Negocios" },
            { nombre: "Diseño Gráfico", duracion: "4 años", area: "Creativo" },
        ],
        becas: true,
        modalidad: "Presencial",
        acreditacion: "CEUB",
        tags: ["privada", "presencial", "becas"],
        valoracion: 4.5,
        numResenas: 203,
        resenas: [
            { autor: "Sofía R.", texto: "Excelente nivel. Los docentes son muy profesionales.", estrellas: 5 },
            { autor: "Diego T.", texto: "La infraestructura es muy buena. Vale la inversión.", estrellas: 4 },
        ]
    },
    {
        id: 3,
        nombre: "Universidad Católica Boliviana",
        sigla: "UCB",
        tipo: "Universidad",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "Institución con valores humanistas reconocida por su calidad en ciencias sociales, humanidades y derecho.",
        telefono: "+591 3 343-5555",
        email: "secretaria@ucbscz.edu.bo",
        web: "https://www.ucbscz.edu.bo",
        linkResenas: "",
        costoMensual: 1500,
        costoInscripcion: 600,
        carreras: [
            { nombre: "Derecho", duracion: "5 años", area: "Jurídica" },
            { nombre: "Comunicación Social", duracion: "5 años", area: "Social" },
            { nombre: "Administración de Empresas", duracion: "5 años", area: "Negocios" },
            { nombre: "Psicología", duracion: "5 años", area: "Social" },
            { nombre: "Ingeniería Civil", duracion: "5 años", area: "Ingeniería" },
            { nombre: "Economía", duracion: "5 años", area: "Negocios" },
        ],
        becas: true,
        modalidad: "Presencial",
        acreditacion: "CEUB",
        tags: ["privada", "presencial", "becas", "humanidades"],
        valoracion: 4.3,
        numResenas: 167,
        resenas: [
            { autor: "María F.", texto: "Ambiente muy acogedor y docentes comprometidos.", estrellas: 5 },
            { autor: "Ignacio L.", texto: "Buena opción para ciencias sociales y humanidades.", estrellas: 4 },
        ]
    },
    {
        id: 4,
        nombre: "Universidad Cristiana de Bolivia",
        sigla: "UCEBOL",
        tipo: "Universidad",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "Universidad privada con enfoque en valores cristianos, ofreciendo carreras a precios accesibles para estudiantes bolivianos.",
        telefono: "+591 3 370-0200",
        email: "info@ucebol.edu.bo",
        web: "https://www.ucebol.edu.bo",
        linkResenas: "",
        costoMensual: 800,
        costoInscripcion: 300,
        carreras: [
            { nombre: "Administración de Empresas", duracion: "5 años", area: "Negocios" },
            { nombre: "Contaduría Pública", duracion: "5 años", area: "Negocios" },
            { nombre: "Psicología", duracion: "5 años", area: "Social" },
            { nombre: "Derecho", duracion: "5 años", area: "Jurídica" },
            { nombre: "Trabajo Social", duracion: "4 años", area: "Social" },
        ],
        becas: true,
        modalidad: "Presencial",
        acreditacion: "CEUB",
        tags: ["privada", "presencial", "económica", "becas"],
        valoracion: 3.9,
        numResenas: 89,
        resenas: [
            { autor: "Roberto H.", texto: "Precios muy accesibles. Buena opción económica.", estrellas: 4 },
        ]
    },
    {
        id: 5,
        nombre: "Universidad Tecnológica Privada de Santa Cruz",
        sigla: "UTEPSA",
        tipo: "Universidad",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "Universidad especializada en ciencias tecnológicas y empresariales con enfoque práctico y orientado al mercado laboral.",
        telefono: "+591 3 340-4040",
        email: "informaciones@utepsa.edu",
        web: "https://www.utepsa.edu",
        linkResenas: "",
        costoMensual: 950,
        costoInscripcion: 400,
        carreras: [
            { nombre: "Ingeniería de Sistemas", duracion: "5 años", area: "Tecnología" },
            { nombre: "Ingeniería Industrial", duracion: "5 años", area: "Ingeniería" },
            { nombre: "Administración de Empresas", duracion: "4 años", area: "Negocios" },
            { nombre: "Contaduría Pública", duracion: "4 años", area: "Negocios" },
            { nombre: "Diseño Gráfico y Publicitario", duracion: "4 años", area: "Creativo" },
            { nombre: "Marketing Digital", duracion: "4 años", area: "Negocios" },
        ],
        becas: true,
        modalidad: "Semi-presencial",
        acreditacion: "CEUB",
        tags: ["privada", "semi-presencial", "tecnología", "becas"],
        valoracion: 4.0,
        numResenas: 134,
        resenas: [
            { autor: "Luis B.", texto: "Muy buena opción para carreras tecnológicas. Precios razonables.", estrellas: 4 },
            { autor: "Carmen V.", texto: "Los programas están actualizados al mercado actual.", estrellas: 4 },
        ]
    },
    {
        id: 6,
        nombre: "Universidad Franz Tamayo",
        sigla: "UNIFRANZ",
        tipo: "Universidad",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "Universidad innovadora con modalidad virtual y presencial, enfocada en tecnología, negocios y ciencias de la salud.",
        telefono: "+591 3 333-2000",
        email: "scz@unifranz.edu.bo",
        web: "https://unifranz.edu.bo",
        linkResenas: "",
        costoMensual: 1100,
        costoInscripcion: 450,
        carreras: [
            { nombre: "Ingeniería de Sistemas", duracion: "5 años", area: "Tecnología" },
            { nombre: "Medicina", duracion: "6 años", area: "Salud" },
            { nombre: "Administración de Empresas", duracion: "4 años", area: "Negocios" },
            { nombre: "Derecho", duracion: "5 años", area: "Jurídica" },
            { nombre: "Psicología", duracion: "5 años", area: "Social" },
        ],
        becas: true,
        modalidad: "Virtual",
        acreditacion: "CEUB",
        tags: ["privada", "virtual", "online", "becas"],
        valoracion: 4.0,
        numResenas: 98,
        resenas: [
            { autor: "Fernando A.", texto: "La modalidad virtual es ideal para quienes trabajan.", estrellas: 4 },
        ]
    },
    {
        id: 7,
        nombre: "Universidad de Aquino Bolivia",
        sigla: "UDABOL",
        tipo: "Universidad",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "Universidad privada con énfasis en salud, derecho y ciencias empresariales, con formación práctica e integral.",
        telefono: "+591 3 341-0000",
        email: "scz@udabol.edu.bo",
        web: "https://www.udabol.edu.bo",
        linkResenas: "",
        costoMensual: 900,
        costoInscripcion: 350,
        carreras: [
            { nombre: "Medicina", duracion: "6 años", area: "Salud" },
            { nombre: "Odontología", duracion: "5 años", area: "Salud" },
            { nombre: "Derecho", duracion: "5 años", area: "Jurídica" },
            { nombre: "Administración de Empresas", duracion: "5 años", area: "Negocios" },
            { nombre: "Enfermería", duracion: "4 años", area: "Salud" },
        ],
        becas: true,
        modalidad: "Presencial",
        acreditacion: "CEUB",
        tags: ["privada", "presencial", "salud", "becas"],
        valoracion: 3.9,
        numResenas: 87,
        resenas: [
            { autor: "Adriana N.", texto: "Buena opción para carreras de salud a precio accesible.", estrellas: 4 },
        ]
    },
    {
        id: 8,
        nombre: "Instituto Tecnológico INFOCAL",
        sigla: "INFOCAL",
        tipo: "Instituto",
        ubicacion: "Santa Cruz de la Sierra",
        descripcion: "Instituto de formación técnica y laboral dependiente de la CNC, con carreras técnicas cortas y alta salida laboral.",
        telefono: "+591 3 332-0000",
        email: "info@infocal-scz.com",
        web: "https://www.infocal-scz.com",
        linkResenas: "",
        costoMensual: 350,
        costoInscripcion: 150,
        carreras: [
            { nombre: "Técnico en Mecatrónica", duracion: "2 años", area: "Ingeniería" },
            { nombre: "Técnico en Electricidad Industrial", duracion: "2 años", area: "Ingeniería" },
            { nombre: "Técnico en Contabilidad", duracion: "2 años", area: "Negocios" },
            { nombre: "Técnico en Diseño Gráfico", duracion: "1.5 años", area: "Creativo" },
            { nombre: "Técnico en Gastronomía", duracion: "2 años", area: "Otro" },
        ],
        becas: false,
        modalidad: "Presencial",
        acreditacion: "Ministerio de Educación",
        tags: ["técnico", "presencial", "económico", "corta duración"],
        valoracion: 4.1,
        numResenas: 76,
        resenas: [
            { autor: "Jorge M.", texto: "Muy buena formación técnica. Salida laboral garantizada.", estrellas: 5 },
        ]
    },
];

// =============================================
// TEST VOCACIONAL
// =============================================
const PREGUNTAS_TEST = [
    {
        texto: "¿Cuál de estas actividades disfrutas más?",
        opciones: [
            { texto: "🔬 Experimentar y analizar datos", perfil: "ciencias" },
            { texto: "🤝 Ayudar y apoyar a otras personas", perfil: "social" },
            { texto: "🎨 Crear, diseñar o expresar ideas", perfil: "creativo" },
            { texto: "📊 Organizar proyectos y liderar equipos", perfil: "negocios" },
        ]
    },
    {
        texto: "En tu tiempo libre, ¿qué prefieres hacer?",
        opciones: [
            { texto: "💻 Explorar tecnología o programar", perfil: "tecnologia" },
            { texto: "📖 Leer sobre ciencias o investigar", perfil: "ciencias" },
            { texto: "🎭 Crear arte, música o escribir", perfil: "creativo" },
            { texto: "👥 Estar con gente y ayudar a otros", perfil: "social" },
        ]
    },
    {
        texto: "¿Qué tipo de problemas te gusta resolver?",
        opciones: [
            { texto: "🏗️ Problemas técnicos y de ingeniería", perfil: "ciencias" },
            { texto: "💼 Problemas de gestión y negocios", perfil: "negocios" },
            { texto: "🩺 Problemas relacionados con la salud", perfil: "social" },
            { texto: "🖥️ Problemas de software y sistemas", perfil: "tecnologia" },
        ]
    },
    {
        texto: "¿En qué ambiente te imaginas trabajando?",
        opciones: [
            { texto: "🏥 Hospital o clínica", perfil: "social" },
            { texto: "🏢 Empresa o negocio propio", perfil: "negocios" },
            { texto: "🔭 Laboratorio o campo de investigación", perfil: "ciencias" },
            { texto: "🎮 Estudio creativo o agencia digital", perfil: "creativo" },
        ]
    },
    {
        texto: "¿Qué materia te resultaba más interesante en el colegio?",
        opciones: [
            { texto: "📐 Matemáticas o Física", perfil: "ciencias" },
            { texto: "📝 Lenguaje, Historia o Filosofía", perfil: "social" },
            { texto: "🖥️ Informática o Tecnología", perfil: "tecnologia" },
            { texto: "🎨 Artes, Música o Educación Física", perfil: "creativo" },
        ]
    },
    {
        texto: "¿Qué valoras más en tu trabajo ideal?",
        opciones: [
            { texto: "💰 Buen salario y estabilidad económica", perfil: "negocios" },
            { texto: "❤️ Ayudar e impactar positivamente en personas", perfil: "social" },
            { texto: "🚀 Innovar y crear cosas completamente nuevas", perfil: "tecnologia" },
            { texto: "🎯 Precisión y resultados exactos", perfil: "ciencias" },
        ]
    },
    {
        texto: "¿Cómo prefieres trabajar principalmente?",
        opciones: [
            { texto: "👤 De forma independiente y autónoma", perfil: "creativo" },
            { texto: "👥 En equipo con muchas personas", perfil: "social" },
            { texto: "📋 Con procesos y metodologías claras", perfil: "ciencias" },
            { texto: "🌐 Con herramientas digitales y tecnología", perfil: "tecnologia" },
        ]
    },
    {
        texto: "¿Cuál es tu mayor fortaleza personal?",
        opciones: [
            { texto: "🧮 Análisis lógico y razonamiento", perfil: "ciencias" },
            { texto: "🗣️ Comunicación y empatía con personas", perfil: "social" },
            { texto: "💡 Creatividad e ideas originales", perfil: "creativo" },
            { texto: "📈 Organización y toma de decisiones", perfil: "negocios" },
        ]
    },
];

const PERFILES_VOCACIONALES = {
    ciencias: {
        nombre: "Ciencias e Ingeniería",
        emoji: "🔬",
        descripcion: "Tienes una mente analítica y te apasiona entender cómo funcionan las cosas. Eres metódico, preciso y disfrutas resolviendo problemas complejos con lógica.",
        carreras: ["Medicina", "Ingeniería Civil", "Ingeniería Industrial", "Veterinaria", "Enfermería", "Odontología"],
        areasRelacionadas: ["Salud", "Ingeniería", "Ciencias"]
    },
    social: {
        nombre: "Humanidades y Servicios",
        emoji: "🤝",
        descripcion: "Eres una persona empática a quien le importa el bienestar de los demás. Tienes habilidades naturales para la comunicación y el trabajo con personas.",
        carreras: ["Psicología", "Trabajo Social", "Comunicación Social", "Derecho", "Enfermería"],
        areasRelacionadas: ["Social", "Salud", "Jurídica"]
    },
    creativo: {
        nombre: "Artes y Diseño",
        emoji: "🎨",
        descripcion: "Tu mente piensa en imágenes y conceptos. Eres original, expresivo y tienes un ojo especial para la estética y la comunicación visual.",
        carreras: ["Diseño Gráfico", "Arquitectura", "Marketing", "Comunicación Social", "Diseño Gráfico y Publicitario"],
        areasRelacionadas: ["Creativo", "Social"]
    },
    negocios: {
        nombre: "Gestión y Negocios",
        emoji: "📈",
        descripcion: "Eres un líder nato con visión estratégica. Sabes organizar recursos, tomar decisiones y orientarte hacia resultados concretos.",
        carreras: ["Administración de Empresas", "Contaduría Pública", "Marketing", "Economía", "Marketing Digital"],
        areasRelacionadas: ["Negocios"]
    },
    tecnologia: {
        nombre: "Tecnología e Innovación",
        emoji: "💻",
        descripcion: "Eres apasionado de la tecnología y la innovación. Disfrutas programar, resolver problemas digitales y estar a la vanguardia del mundo tech.",
        carreras: ["Ingeniería de Sistemas", "Ingeniería Informática", "Técnico en Sistemas Informáticos", "Técnico en Redes y Comunicaciones", "Técnico en Diseño Web"],
        areasRelacionadas: ["Tecnología"]
    }
};

// =============================================
// FUNCIONES DE CARGA Y TRANSFORMACIÓN
// =============================================

function _esArrayDeObjetosConClavesVacias(datos) {
    if (!Array.isArray(datos) || datos.length === 0) return false;
    return datos.every(item => {
        return item && typeof item === 'object' && !Array.isArray(item) &&
            Object.keys(item).length > 0 &&
            Object.keys(item).every(key => key.trim() === '');
    });
}
function _arrayDeArraysAObjetos(datos) {
    // Si los datos ya vienen como objetos (lo cual es correcto ahora), los retornamos directo
    if (datos && !Array.isArray(datos[0])) {
        return datos; 
    }

    // Si los datos no son un array, no podemos procesarlos
    if (!Array.isArray(datos) || datos.length < 2) return null;

    const cabeceras = datos[0].map(c => String(c || '').trim());
    if (cabeceras.every(c => c === '')) return null;

    return datos.slice(1).map(fila => {
        const obj = {};
        cabeceras.forEach((clave, index) => {
            const nombreClave = clave || `columna_${index}`;
            obj[nombreClave] = fila[index] !== undefined ? fila[index] : '';
        });
        return obj;
    });
}
async function cargarDatos() {
    if (CONFIG.urlLecturaSheets) {
        try {
            const controlador = new AbortController();
            const idTimeout = setTimeout(() => controlador.abort(), CONFIG.tiempoEsperaMs);

            const respuesta = await fetch(CONFIG.urlLecturaSheets, {
                signal: controlador.signal,
                mode: 'cors'
            });
            clearTimeout(idTimeout);

            if (!respuesta.ok) throw new Error('Respuesta no válida del servidor');

            const datos = await respuesta.json();

            if (Array.isArray(datos) && datos.length > 0) {
                if (_esArrayDeObjetosConClavesVacias(datos)) {
                    console.warn('La respuesta de Google Apps Script tiene claves vacías. Usando fallback local.');
                    return { instituciones: INSTITUCIONES_FALLBACK, fuente: 'offline' };
                }

                const datosComoTabla = _arrayDeArraysAObjetos(datos);
                if (datosComoTabla) {
                    return { instituciones: transformarDatosSheet(datosComoTabla), fuente: 'online' };
                }

                return { instituciones: transformarDatosSheet(datos), fuente: 'online' };
            }
        } catch (error) {
            console.warn('Google Sheets no disponible. Usando datos locales.', error.message);
        }
    }
    return { instituciones: INSTITUCIONES_FALLBACK, fuente: 'offline' };
}

function transformarDatosSheet(datos) {
    return datos.map((fila, indice) => ({
        id: indice + 1,
        nombre: fila.Nombre || fila.nombre || '',
        sigla: fila.Sigla || fila.sigla || '',
        tipo: fila.Tipo || fila.tipo || 'Universidad',
        ubicacion: fila.Ubicacion || fila.ubicacion || 'Bolivia',
        descripcion: fila.Descripcion || fila.descripcion || '',
        telefono: fila.Telefono || fila.telefono || '',
        email: fila.Email || fila.email || '',
        web: fila.Web || fila.web || '',
        LinkResenas: fila.LinkResenas || fila.linkResenas || '', // 👈 AGREGA ESTA LÍNEA EXACTAMENTE ASÍ
        costoMensual: parseFloat(fila.CostoMensual || fila.costoMensual || 0),
        costoInscripcion: parseFloat(fila.CostoInscripcion || fila.costoInscripcion || 0),
        carreras: _parsearCarreras(fila.Carreras || fila.carreras || ''),
        becas: String(fila.Becas || fila.becas || '').toLowerCase() === 'sí',
        modalidad: fila.Modalidad || fila.modalidad || 'Presencial',
        acreditacion: fila.Acreditacion || fila.acreditacion || '',
        tags: _parsearLista(fila.Tags || fila.tags || ''),
        valoracion: parseFloat(fila.Valoracion || fila.valoracion || 4.0),
        numResenas: parseInt(fila.NumResenas || fila.numResenas || 0),
        resenas: [],
    }));
}

function _parsearCarreras(valor) {
    if (!valor) return [];
    if (Array.isArray(valor)) return valor;
    return valor.split(',').map(c => ({ nombre: c.trim(), duracion: '', area: '' }));
}

function _parsearLista(valor) {
    if (!valor) return [];
    if (Array.isArray(valor)) return valor;
    return valor.split(',').map(t => t.trim().toLowerCase());
}

async function enviarConsulta(datos) {
    if (!CONFIG.urlConsultasSheets) {
        console.log('Consulta (sin URL de Sheets configurada):', datos);
        // Simular éxito en desarrollo
        return new Promise(resolve => setTimeout(() => resolve({ exito: true }), 800));
    }
    try {
        const params = new URLSearchParams({ ...datos, accion: 'nuevaConsulta' });
        const respuesta = await fetch(`${CONFIG.urlConsultasSheets}?${params.toString()}`);
        await respuesta.json();
        return { exito: true };
    } catch (error) {
        console.error('Error al enviar consulta:', error);
        return { exito: false, error: error.message };
    }
}
