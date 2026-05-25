'use strict';

// =============================================
// CONFIGURACIÓN DE SUPABASE
// =============================================
// ⚠️ IMPORTANTE: Si usas la clave de Supabase, prefiere la anon public de tipo JWT (empieza con eyJ...)
// Si utilizas la nueva clave sb_publishable_*, el sistema funcionará localmente y se conectará cuando el token sea válido.
const SUPABASE_URL = "https://fggqxgklnnodkenewvpe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0TrsnUvJuSodbz49-k_5KA_tdQ34ixb";

let supabaseClient = null;
let _supabaseError = null;

function getSupabaseClient() {
    if (!supabaseClient && window.supabase && !_supabaseError) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { persistSession: false }
            });
            console.log("✓ Supabase Client inicializado");
        } catch (e) {
            _supabaseError = e.message;
            console.error("Error al inicializar Supabase:", e);
        }
    }
    return supabaseClient;
}

const CONFIG = {
    fechaActualizacion: "Mayo 2026",
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
// CACHÉ Y ALMACENAMIENTO LOCAL
// =============================================
const CACHE_KEY = 'etf_datos_cache';
const CACHE_FECHA_KEY = 'etf_datos_fecha';
const PENDING_WRITES_KEY = 'etf_pending_writes';
const PENDING_DELETES_KEY = 'etf_pending_deletes';

function _guardarCacheLocal(instituciones) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(instituciones));
        localStorage.setItem(CACHE_FECHA_KEY, new Date().toISOString());
    } catch (_) {}
}

function _leerCacheLocal() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const instituciones = JSON.parse(raw);
        if (Array.isArray(instituciones) && instituciones.length > 0) return instituciones;
    } catch (_) {}
    return null;
}

function _leerPendingWrites() {
    try { return JSON.parse(localStorage.getItem(PENDING_WRITES_KEY) || '[]'); } catch (_) { return []; }
}
function _guardarPendingWrites(items) {
    try { localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(items)); } catch (_) {}
}
function _leerPendingDeletes() {
    try { return JSON.parse(localStorage.getItem(PENDING_DELETES_KEY) || '[]'); } catch (_) { return []; }
}
function _guardarPendingDeletes(ids) {
    try { localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(ids)); } catch (_) {}
}

// =============================================
// NORMALIZACIÓN DE DATOS (MAPPING DB <-> FRONT)
// =============================================

function normalizarDesdeSupabase(dbRow) {
    let carreras = [];
    try {
        carreras = typeof dbRow.carreras === 'string' ? JSON.parse(dbRow.carreras) : (dbRow.carreras || []);
    } catch (_) {
        carreras = dbRow.carreras || [];
    }

    return {
        id: dbRow.id,
        nombre: dbRow.nombre || '',
        sigla: dbRow.sigla || '',
        tipo: dbRow.tipo || 'Universidad',
        ubicacion: dbRow.ubicacion || '',
        descripcion: dbRow.descripcion || '',
        telefono: dbRow.telefono || '',
        email: dbRow.email || '',
        web: dbRow.web || '',
        LinkResenas: dbRow.link_resenas || '',
        costoMensual: parseFloat(dbRow.costo_mensual || 0),
        costoInscripcion: parseFloat(dbRow.costo_inscripcion || 0),
        carreras: carreras,
        becas: dbRow.becas === true,
        modalidad: dbRow.modalidad || 'Presencial',
        acreditacion: dbRow.acreditacion || '',
        tags: dbRow.tags || [],
        valoracion: parseFloat(dbRow.valoracion || 4.0),
        numResenas: parseInt(dbRow.num_resenas || 0)
    };
}

function desnormalizarParaSupabase(frontRow) {
    const row = {
        nombre: frontRow.nombre || '',
        sigla: frontRow.sigla || '',
        tipo: frontRow.tipo || 'Universidad',
        ubicacion: frontRow.ubicacion || '',
        descripcion: frontRow.descripcion || '',
        telefono: frontRow.telefono || '',
        email: frontRow.email || '',
        web: frontRow.web || '',
        link_resenas: frontRow.LinkResenas || '',
        costo_mensual: parseFloat(frontRow.costoMensual || 0),
        costo_inscripcion: parseFloat(frontRow.costoInscripcion || 0),
        carreras: Array.isArray(frontRow.carreras) ? frontRow.carreras : [],
        becas: frontRow.becas === true,
        modalidad: frontRow.modalidad || 'Presencial',
        acreditacion: frontRow.acreditacion || '',
        tags: Array.isArray(frontRow.tags) ? frontRow.tags : [],
        valoracion: parseFloat(frontRow.valoracion || 4.0),
        num_resenas: parseInt(frontRow.numResenas || 0)
    };

    if (frontRow.id && !String(frontRow.id).startsWith('temp-')) {
        row.id = parseInt(frontRow.id);
    }
    return row;
}

// =============================================
// SISTEMA OFFLINE-FIRST: ECOREGISTROS Y COLA
// =============================================

function hayPendientes() {
    return _leerPendingWrites().length > 0 || _leerPendingDeletes().length > 0;
}

async function sincronizarPendientes() {
    const client = getSupabaseClient();
    if (!client || !navigator.onLine) return false;

    const pendingWrites = _leerPendingWrites();
    const pendingDeletes = _leerPendingDeletes();
    if (pendingWrites.length === 0 && pendingDeletes.length === 0) return true;

    console.log(`🔄 Sincronizando pendientes con Supabase: ${pendingWrites.length} escrituras, ${pendingDeletes.length} eliminaciones`);

    try {
        // 1. Procesar eliminaciones
        if (pendingDeletes.length > 0) {
            const realIds = pendingDeletes.filter(id => !String(id).startsWith('temp-')).map(Number);
            if (realIds.length > 0) {
                const { error } = await client.from('instituciones').delete().in('id', realIds);
                if (error) throw error;
            }
            _guardarPendingDeletes([]);
        }

        // 2. Procesar inserciones/actualizaciones (upsert)
        if (pendingWrites.length > 0) {
            const filasSupabase = pendingWrites.map(desnormalizarParaSupabase);
            const { error } = await client.from('instituciones').upsert(filasSupabase);
            if (error) throw error;
            _guardarPendingWrites([]);
        }

        console.log('✓ Sincronización exitosa con Supabase');
        window.dispatchEvent(new CustomEvent('etf:sincronizado'));
        return true;
    } catch (err) {
        console.warn('⚠️ Fallo la sincronización automática:', err.message || err);
        return false;
    }
}

// Auto-sincronizar al volver a estar online
window.addEventListener('online', () => {
    console.log('🌐 Conexión detectada - Iniciando sincronización en background...');
    sincronizarPendientes();
});

// =============================================
// MÉTODOS DE DATOS PRINCIPALES (OFFLINE-FIRST)
// =============================================

async function cargarDatos() {
    // 1. Retornar cache local inmediatamente (Offline-first rápido)
    const cacheLocal = _leerCacheLocal();

    // 2. En background, si estamos online, sincronizar y refrescar desde Supabase
    if (navigator.onLine) {
        _refrescarCacheEnBackground();
    }

    if (cacheLocal && cacheLocal.length > 0) {
        return { instituciones: cacheLocal, fuente: hayPendientes() ? 'cache-pendiente' : 'cache' };
    }

    // 3. Primer inicio sin cache: intento síncrono si hay red
    const client = getSupabaseClient();
    if (client && navigator.onLine) {
        try {
            const { data, error } = await client.from('instituciones').select('*').order('id', { ascending: true });
            if (!error && Array.isArray(data) && data.length > 0) {
                const instituciones = data.map(normalizarDesdeSupabase);
                _guardarCacheLocal(instituciones);
                return { instituciones, fuente: 'online' };
            }
        } catch (err) {
            console.warn('Error cargando datos en primer inicio:', err);
        }
    }

    // 4. Último recurso: Datos fallback hardcodeados
    console.warn('Cargando base de datos fallback local.');
    return { instituciones: INSTITUCIONES_FALLBACK, fuente: 'offline' };
}

async function _refrescarCacheEnBackground() {
    try {
        await sincronizarPendientes();
        const client = getSupabaseClient();
        if (!client) return;

        const { data, error } = await client.from('instituciones').select('*').order('id', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
            const instituciones = data.map(normalizarDesdeSupabase);
            _guardarCacheLocal(instituciones);
            window.dispatchEvent(new CustomEvent('etf:datosFrescos', { detail: { instituciones } }));
            console.log('✓ Cache refrescado desde Supabase en background');
        }
    } catch (err) {
        console.warn('No se pudo refrescar cache en background:', err);
    }
}

async function enviarConsulta(datos) {
    const row = {
        nombre: datos.nombre,
        telefono: datos.telefono,
        email: datos.email || null,
        institucion: datos.institucion || null,
        carrera: datos.carrera || null,
        mensaje: datos.mensaje,
        consentimiento: datos.consentimiento === true
    };

    const client = getSupabaseClient();
    if (!client || !navigator.onLine) {
        // Almacenar localmente en cola de consultas
        try {
            const consultas = JSON.parse(localStorage.getItem('etf_pending_consultas') || '[]');
            consultas.push({ ...row, fecha_local: new Date().toISOString() });
            localStorage.setItem('etf_pending_consultas', JSON.stringify(consultas));
            console.log('✓ Consulta encolada localmente (modo offline)');
            return { exito: true, guardadaLocalmente: true };
        } catch (_) {
            return { exito: false, error: "Almacenamiento local lleno" };
        }
    }

    try {
        const { error } = await client.from('consultas').insert([row]);
        if (error) throw error;
        return { exito: true };
    } catch (error) {
        console.error('Error al enviar consulta a Supabase:', error);
        return { exito: false, error: error.message };
    }
}

// =============================================
// ADMINISTRACIÓN: EXCEL Y CONSULTAS
// =============================================

async function guardarCambiosExcel(institucionesModificadas, idsEliminados) {
    // 1. Modificar cache local inmediatamente
    let cacheActual = _leerCacheLocal() || [...INSTITUCIONES_FALLBACK];

    // Eliminar
    const idsElimSet = new Set(idsEliminados.map(String));
    cacheActual = cacheActual.filter(inst => !idsElimSet.has(String(inst.id)));

    // Modificar / Insertar
    for (const inst of institucionesModificadas) {
        const idx = cacheActual.findIndex(i => String(i.id) === String(inst.id));
        if (idx >= 0) {
            cacheActual[idx] = inst;
        } else {
            cacheActual.push(inst);
        }
    }
    _guardarCacheLocal(cacheActual);

    // 2. Guardar en colas pendientes
    if (idsEliminados.length > 0) {
        const deletes = [...new Set([..._leerPendingDeletes(), ...idsEliminados.map(String)])];
        _guardarPendingDeletes(deletes);
    }

    if (institucionesModificadas.length > 0) {
        const writes = _leerPendingWrites();
        for (const inst of institucionesModificadas) {
            const idx = writes.findIndex(w => String(w.id) === String(inst.id));
            if (idx >= 0) { writes[idx] = inst; } else { writes.push(inst); }
        }
        _guardarPendingWrites(writes);
    }

    // 3. Sincronizar con Supabase si hay red
    if (navigator.onLine) {
        const exito = await sincronizarPendientes();
        if (exito) {
            await _refrescarCacheEnBackground();
        }
    } else {
        console.log('✓ Cambios guardados localmente. Sincronizarán al volver online.');
    }

    return true;
}

async function cargarConsultasAdmin() {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        const { data, error } = await client.from('consultas').select('*').order('fecha', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error al obtener consultas:', error);
        return [];
    }
}

async function eliminarConsultaAdmin(id) {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
        const { error } = await client.from('consultas').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error al eliminar consulta:', error);
        return false;
    }
}
