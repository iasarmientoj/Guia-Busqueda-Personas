tailwind.config = {
    theme: {
        extend: {
            colors: { 'gov-blue': '#3366CC', 'gov-dark-blue': '#004884', 'gov-bg': '#F7F9FC' },
            fontFamily: { sans: ['Nunito Sans', 'sans-serif'] }
        }
    }
}

// --- CONFIGURACIÓN DE MARKED PARA ENLACES ---
// Función helper para agregar target="_blank" a todos los enlaces en HTML
function processMarkdownLinks(html) {
    if (!html) return html;
    // Reemplazar todos los enlaces que no tengan ya target="_blank"
    return html.replace(/<a\s+([^>]*?)>/gi, function (match, attrs) {
        if (attrs.includes('target=')) {
            return match; // Ya tiene target, no modificar
        }
        return '<a ' + attrs + ' target="_blank" rel="noopener noreferrer">';
    });
}

// Configurar marked para que los enlaces se abran en nueva pestaña
if (typeof marked !== 'undefined') {
    try {
        const renderer = new marked.Renderer();
        const originalLink = renderer.link.bind(renderer);
        renderer.link = function (href, title, text) {
            const link = originalLink(href, title, text);
            if (!link.includes('target="_blank"')) {
                return link.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
            }
            return link;
        };
        marked.setOptions({ renderer: renderer });
    } catch (e) {
        console.warn('No se pudo configurar marked renderer, usando función helper');
    }
}

// --- LOGICA DE ACCESIBILIDAD ---
let currentFontSize = 100;

function toggleContrast() { document.body.classList.toggle('high-contrast'); }
function changeFontSize(amount) {
    currentFontSize += amount;
    if (currentFontSize < 80) currentFontSize = 80;
    if (currentFontSize > 150) currentFontSize = 150;
    document.documentElement.style.fontSize = currentFontSize + '%';
}
function toggleHelp(helpId) {
    const helpEl = document.getElementById(helpId);
    if (helpEl) helpEl.classList.toggle('hidden');
}
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    document.getElementById('btn-' + tabId).classList.add('active');
}

// --- 1. CONFIGURACIÓN DE DATOS ---
const SHEETS_CONFIG = {
    ACCIONES: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=812842567&single=true&output=csv',
    CONTACTOS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=871607364&single=true&output=csv',
    LINKS_NOTAS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=1731177785&single=true&output=csv'
};

const ROUTES_MAP = {
    '4.1': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=545298463&single=true&output=csv',
    '4.2': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=1342244385&single=true&output=csv',
    '4.3': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=399030951&single=true&output=csv',
    '4.4': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=718152538&single=true&output=csv',
    '4.5': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=428871968&single=true&output=csv',
    '4.6': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVlcYT96Ei7UKp-CRqiq5Q2Yq8sAIJMHaEA-DaN8-EXdoZz8RRZmokpHqcXrTDfYdcvWKEO2j3GO6c/pub?gid=1764372827&single=true&output=csv'
};

let DB_ACCIONES = [];
let DB_CONTACTOS = [];
let CURRENT_ROUTE_DATA = [];
let SURVEY_FORM_URL = '';

// --- 2. ESTADO DE LA APP ---
const state = {
    currentStep: 'intro',
    history: [],
    answers: {
        p1: null, p1_sub: null,
        p2: null, p2_sub: null, p2_date_month: null, p2_date_year: null,
        p3_type: null, p3_detail: null, p3_sub_detail: null, p3_characteristics: [],
        p4_profile: [],
        narrative: ''
    }
};

let COUNTRIES_LIST = ['Colombia'];
let CITIES_LIST = ['Bogotá D.C.'];
let MUNICIPALITIES_LIST = ['Bogotá D.C.'];

// --- 3. DEFINICIÓN DE PASOS (UI) ---
const steps = {
    'intro': {
        progress: '0%', title: 'Bienvenido a la Guía de Búsqueda de Personas Desaparecidas', type: 'intro',
        description: 'Esta herramienta le orientará para definir la ruta institucional de búsqueda de su ser querido. Es una guía informativa que le indicará paso a paso las entidades y acciones correspondientes.',
        disclaimer: 'Su privacidad es fundamental. Esta guía es anónima: no almacenamos, registramos ni compartimos ningún dato personal que ingrese durante la consulta.',
        btnLabel: 'Comenzar Consulta'
    },
    'p4': {
        progress: '20%', title: '¿Quién es la persona desaparecida?', description: 'Marque todas las condiciones que correspondan a su caso. Esto define la prioridad de la búsqueda.', type: 'multi-choice',
        options: [
            { id: '1.1', label: 'Es un/a niño/a o adolescente', help: 'Menor de 18 años al momento de desaparecer.' },
            { id: '1.2', label: 'Es una persona con un rol público o de alto riesgo', help: 'Líder, defensor/a, periodista, sindicalista, político.' },
            { id: '1.3', label: 'Es o fue miembro de la Fuerza Pública', help: 'Ejército, Policía, Armada, Fuerza Aérea, etc.' },
            { id: '1.4', label: 'Es o fue integrante de un grupo armado ilegal', help: 'Guerrilla, AUC, BACRIM, GAO, etc.' },
            { id: '1.5', label: 'Es una persona que requiere cuidado o apoyo especial', help: 'Adulto mayor, condiciones de salud mental, discapacidad.' },
            { id: '1.6', label: 'Es migrante o de nacionalidad extranjera' },
            { id: '1.7', label: 'Es una mujer y se teme violencia de género', help: 'Antecedentes de violencia intrafamiliar, exparejas agresivas, etc.' },
            { id: '1.8', label: 'Pertenece a comunidad indígena o étnica', help: 'Comunidades Indígenas, Negras, Afrocolombianas, Raizales y Palenqueras.' },
            { id: '1.9', label: 'Se identifica como persona LGBTIQ+' },
            { id: '1.10', label: 'Desaparecieron dos o más personas juntas', help: 'Ej: madre e hijo, hermanos, familia entera.' },
            { id: '1.11', label: 'Ninguna de las anteriores' }
        ]
    },
    'p2': {
        progress: '40%', title: '¿Hace cuánto tiempo ocurrió?', description: 'Esto determina si la búsqueda es operativa (urgente) o investigativa (histórica).', type: 'single-choice',
        options: [{ id: '2.1', label: 'Ocurrió hace poco (horas, días o semanas)' }, { id: '2.2', label: 'Ocurrió hace más de un año' }]
    },
    'p2_date': { progress: '45%', title: 'Fecha aproximada de los hechos', description: 'Por favor indique el mes y año aproximado en que ocurrió la desaparición.', type: 'date-year-picker' },
    'p3_type': {
        progress: '60%', title: '¿Dónde ocurrió o fue vista por última vez?', type: 'single-choice',
        options: [{ id: '3.1', label: 'Capital o ciudad principal' }, { id: '3.2', label: 'Municipio pequeño o zona rural' }, { id: '3.3', label: 'En otro país' }]
    },
    'p3.1': { progress: '65%', title: 'Seleccione la ciudad', type: 'dropdown', data: CITIES_LIST },
    'p3.2': {
        progress: '65%', title: 'Ubicación en Municipio', type: 'municipality-city', municipalityData: ['Otro'], cityData: CITIES_LIST,
        description: 'Seleccione el municipio y la ciudad principal más cercana para ubicar las entidades de apoyo.'
    },
    'p3.3': { progress: '65%', title: 'Seleccione el país', type: 'dropdown', data: ['España', 'Estados Unidos', 'México', 'Ecuador', 'Chile', 'Otro'] },
    'p3.4': {
        progress: '75%', title: 'Características del lugar', description: 'Marque todas las características especiales que tenga el lugar donde ocurrió la desaparición.', type: 'multi-choice',
        options: [
            { id: '3.4.1', label: 'En el agua o cerca de ella', help: 'Mar, río, costa, puerto, represa' },
            { id: '3.4.2', label: 'Cerca de una frontera con otro país', help: 'Límite con Venezuela, Ecuador, Panamá, etc.' },
            { id: '3.4.3', label: 'En un resguardo o territorio indígena', help: 'Territorio de un cabildo, comunidad o pueblo indígena' },
            { id: '3.4.4', label: 'En un Parque Nacional o reserva natural', help: 'Parque Tayrona, El Cocuy, reserva forestal, etc.' },
            { id: '3.4.5', label: 'En una montaña, selva o bosque (fuera de un parque)', help: 'Zona rural de difícil acceso, senderismo' },
            { id: '3.4.6', label: 'En una zona de minería, petróleo u otra explotación de recursos', help: 'Cerca de una mina, un campo petrolero, zona de tala' },
            { id: '3.4.7', label: 'En una zona de conflicto armado o con grupos ilegales', help: 'Presencia de guerrilla, paramilitares, bandas criminales' },
            { id: '3.4.8', label: 'Dentro o cerca de una base militar, de policía o entidad del Estado', help: 'Batallón, estación de policía, CAI, instalaciones oficiales' },
            { id: '3.4.9', label: 'Dentro o cerca de un cementerio o morgue', help: 'Fosas comunes, osarios, depósitos de cuerpos no identificados' },
            { id: '3.4.10', label: 'Ninguna de estas' }
        ]
    },
    'p1': {
        progress: '90%', title: '¿Tiene alguna sospecha de lo que ocurrió?', description: 'Esta información nos ayuda a dirigirlo a la entidad especializada.', type: 'single-choice',
        options: [
            { id: '4.1', label: 'En un contexto de conflicto armado o violencia política', help: 'Sospecha de Guerrilla, Paramilitares, "Falsos Positivos", Grupos Armados.' },
            { id: '4.2', label: 'A causa de un crimen o acto de delincuencia común', help: 'Sospecha de secuestro, extorsión, robo, "gota a gota", bandas, trata de personas.' },
            { id: '4.3', label: 'Se perdió o se ausentó (sin violencia aparente)', help: 'Salió de casa y no regresó, puede estar desorientado/a, se fue por voluntad propia.' },
            { id: '4.4', label: 'Durante un accidente o desastre natural', help: 'Desapareció en un río, en el mar, en una montaña o durante una avalancha.' },
            { id: '4.5', label: 'En un contexto de migración o estando en el exterior', help: 'Estaba en una ruta migratoria (ej. Darién) o vivía/viajaba en otro país.' },
            { id: '4.6', label: 'No tengo sospechas claras de lo que pudo pasar', help: 'Simplemente no he vuelto a saber de él/ella.' }
        ]
    },
    'p1_conflict': {
        progress: '95%', title: 'Detalles del Conflicto', description: 'Especifique la situación para activar rutas de búsqueda humanitaria.', type: 'single-choice',
        options: [
            { id: '4.1.1', label: 'Involucra grupos armados al margen de la ley' },
            { id: '4.1.2', label: 'Sospecha de participación de agentes del Estado' },
            { id: '4.1.3', label: 'Relacionado con reclutamiento forzado de menores' },
            { id: '4.1.4', label: 'Muerto en combate o acto de hostilidades' },
            { id: '4.1.5', label: 'Otra situación / No sé específicamente' }
        ]
    },
    'p1_crime': {
        progress: '95%', title: 'Especifique el tipo de crimen', alert: '⚠️ IMPORTANTE: Si en algún momento lo contactan para pedirle dinero por la liberación de su ser querido, no haga nada más y llame INMEDIATAMENTE a la línea 165 del GAULA.', type: 'single-choice',
        options: [
            { id: '4.2.1', label: 'Narcotráfico o crimen organizado' },
            { id: '4.2.2', label: 'Trata de personas o explotación sexual' },
            { id: '4.2.3', label: 'Violencia intrafamiliar o de pareja' },
            { id: '4.2.4', label: 'Secuestro' },
            { id: '4.2.5', label: 'Extorsión' },
            { id: '4.2.6', label: 'Otro tipo de crimen / No sé específicamente' }
        ]
    },
    'p1_migration': {
        progress: '95%', title: 'Detalle migratorio', type: 'single-choice',
        options: [
            { id: '4.5.1', label: 'Planeaba migrar y desapareció en el camino' },
            { id: '4.5.2', label: 'Ya estaba en otro país y perdimos contacto' },
            { id: '4.5.3', label: 'Fue forzada a salir del país (posible trata)' },
            { id: '4.5.4', label: 'Otra situación' }
        ]
    },
    'p_narrative': {
        progress: '98%', title: 'Detalles Adicionales (Opcional)', description: 'Escriba brevemente: ¿Cómo vestía? ¿Tenía señales particulares?', type: 'textarea', next: 'results'
    },
    'results': { progress: '100%', title: 'Ruta de Acción', type: 'results' }
};

// --- 4. CARGA DE DATOS ---
async function loadData() {
    const status = document.getElementById('loaderStatus');
    const errorMsg = document.getElementById('errorMsg');

    try {
        const loadSheet = async (url) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            const text = await res.text();
            return Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() }).data;
        };

        status.innerText = "Descargando Directorio...";
        DB_CONTACTOS = await loadSheet(SHEETS_CONFIG.CONTACTOS);

        status.innerText = "Cargando enlaces de retroalimentación...";
        const linksNotasRaw = await fetch(SHEETS_CONFIG.LINKS_NOTAS);
        const linksNotasText = await linksNotasRaw.text();
        const linksNotasParsed = Papa.parse(linksNotasText, { header: false, skipEmptyLines: false });
        if (linksNotasParsed.data && linksNotasParsed.data.length > 0) {
            // Buscar la fila que contiene "LINK DE FORMULARIO" en la primera columna
            const linkRow = linksNotasParsed.data.find(row => row[0] && row[0].trim().toUpperCase() === 'LINK DE FORMULARIO');
            if (linkRow && linkRow[1] && linkRow[1].trim()) {
                SURVEY_FORM_URL = linkRow[1].trim();
            }
        }

        const getUniqueSorted = (data, key) => {
            const unique = [...new Set(data.map(item => item[key]?.trim()).filter(Boolean))].sort();
            if (!unique.includes('Otro')) unique.push('Otro');
            return unique;
        };

        COUNTRIES_LIST = getUniqueSorted(DB_CONTACTOS, 'PAIS');
        CITIES_LIST = getUniqueSorted(DB_CONTACTOS, 'CIUDAD');
        MUNICIPALITIES_LIST = getUniqueSorted(DB_CONTACTOS, 'MUNICIPIO');

        steps['p3.1'].data = CITIES_LIST;
        steps['p3.2'].municipalityData = MUNICIPALITIES_LIST;
        steps['p3.2'].cityData = CITIES_LIST;
        steps['p3.3'].data = COUNTRIES_LIST;

        status.innerText = "Descargando Matriz de Acciones...";
        const accionesRaw = await loadSheet(SHEETS_CONFIG.ACCIONES);

        DB_ACCIONES = accionesRaw.map(row => ({
            id: row.ID_ACCION ? row.ID_ACCION.trim() : '',
            categoria: row.CATEGORIA ? row.CATEGORIA.trim().toUpperCase() : '',
            caso: row.CASO ? row.CASO.split(',').map(s => s.trim()) : [],
            ubicacion: row.PERFIL_UBICACION ? row.PERFIL_UBICACION.split(',').map(s => s.trim()) : [],
            temporalidad: row.LOGICA_TEMPORAL ? row.LOGICA_TEMPORAL.split(',').map(s => s.trim().toUpperCase()) : [],
            etapa: parseInt(row.ETAPA) || 99,
            prioridad: parseInt(row.PRIORIDAD) || 0,
            titulo: row.TITULO_VISIBLE || "Acción",
            contenido: row.CONTENIDO_MD || "",
            contactos: row.CONTACTOS ? row.CONTACTOS.split(',') : []
        })).filter(a => a.id);

        document.getElementById('loader').style.display = 'none';
        renderView('intro');

    } catch (e) {
        console.error(e);
        status.innerText = "Error de conexión";
        status.classList.add("text-red-600", "font-bold");
        errorMsg.classList.remove('hidden');
        errorMsg.innerHTML = `<strong>Error al cargar datos.</strong><br>Verifique su conexión a internet.`;
    }
}

async function loadRouteData() {
    const loader = document.getElementById('loader');
    const status = document.getElementById('loaderStatus');
    loader.style.display = 'flex';
    status.innerText = "Calculando Ruta Maestra...";

    const routeId = state.answers.p1;
    const url = ROUTES_MAP[routeId];

    if (!url) {
        CURRENT_ROUTE_DATA = [];
        loader.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(url);
        const text = await res.text();
        const data = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
        CURRENT_ROUTE_DATA = data.map(row => ({
            paso: row.PASO ? row.PASO.trim() : '',
            titulo: row.TITULO || '',
            descripcion: row.DESCRIPCION || '',
            contenido: row.CONTENIDO_MD || ''
        }));
    } catch (e) {
        console.error("Error cargando ruta:", e);
        CURRENT_ROUTE_DATA = [];
    } finally {
        loader.style.display = 'none';
    }
}

// --- 5. RENDERIZADO UI ---
function renderView(stepId) {
    state.currentStep = stepId;
    const config = steps[stepId];
    const container = document.getElementById('viewContainer');
    const progressContainer = document.getElementById('progressContainer');

    if (stepId === 'intro') {
        progressContainer.classList.add('opacity-0');
    } else {
        progressContainer.classList.remove('opacity-0');
        document.getElementById('progressBar').style.width = config.progress;
    }

    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');

    if (stepId === 'intro' || stepId === 'results') {
        document.getElementById('navButtons').classList.add('hidden');
    } else {
        document.getElementById('navButtons').classList.remove('hidden');

        // Configuración del botón Atrás / Volver
        if (stepId === 'p4') {
            backBtn.className = 'text-gov-blue border-2 border-gov-blue hover:bg-blue-50 font-bold flex items-center px-6 py-2 rounded-full transition-colors shadow-sm';
            backBtn.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg> Volver al inicio`;
        } else {
            backBtn.className = 'text-gov-blue font-bold hover:underline flex items-center px-4 py-2 transition-colors';
            backBtn.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg> Atrás`;
        }

        nextBtn.classList.add('hidden');
    }

    let html = '';

    if (config.type === 'intro') {
        html += `
                    <div class="text-center py-6">
                        <div class="mx-auto mb-6">
                            <img src="logoMinJus.png" alt="Ministerio de Justicia y del Derecho" class="mx-auto w-24 h-24 object-contain">
                        </div>
                        <h2 class="text-3xl font-bold text-gov-blue mb-4">${config.title}</h2>
                        <p class="text-gray-600 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">${config.description}</p>
                        <p class="text-gov-blue font-medium italic text-xl mb-4">¿Busca a una persona desaparecida?</p>
                        <button onclick="goNext()" class="bg-gov-blue text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-gov-dark-blue transition-all transform hover:scale-105 flex items-center mx-auto mb-8">
                            ${config.btnLabel}
                            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                        <div class="bg-gov-bg border border-blue-100 rounded-lg p-5 mt-4 text-sm text-gray-600 flex items-start text-left max-w-2xl mx-auto">
                            <svg class="w-6 h-6 mr-3 mt-0.5 text-gov-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            <div>
                                <span class="font-bold block text-gov-dark-blue mb-1">Protección de Datos</span>
                                ${config.disclaimer}
                            </div>
                        </div>
                    </div>`;
    }
    else if (config.type === 'results') {
        html += generateResultsEngine();
        document.getElementById('navButtons').classList.add('hidden');
    }
    else {
        html += `<h2 class="text-2xl font-bold text-gov-blue mb-3">${config.title}</h2>
                    ${config.description ? `<p class="text-gray-600 mb-6 text-lg">${config.description}</p>` : ''}
                    ${config.alert ? `<div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 font-bold rounded-r">${config.alert}</div>` : ''}`;

        if (config.type === 'single-choice' || config.type === 'multi-choice') {
            const isMulti = config.type === 'multi-choice';
            if (isMulti) {
                nextBtn.classList.remove('hidden');
                // Banner destacado para multi-choice
                html += `<div class="bg-blue-50 border-2 border-gov-blue rounded-lg p-4 mb-6 flex items-start">
                            <svg class="w-6 h-6 text-gov-blue mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p class="font-bold text-gov-dark-blue text-base">Puede seleccionar <strong class="text-gov-blue">múltiples opciones</strong></p>
                            </div>
                        </div>`;
            }
            const wrapperClass = isMulti ? 'grid md:grid-cols-2 gap-2 mb-6' : 'space-y-3';

            html += `<div class="${wrapperClass}">`;
            config.options.forEach(opt => {
                let isSelected = false;
                if (isMulti) {
                    let collection = stepId === 'p3.4' ? state.answers.p3_characteristics : state.answers.p4_profile;
                    isSelected = collection.includes(opt.id);
                }

                if (!isMulti) {
                    html += `
                            <div class="mb-3"><div class="relative flex items-center">
                                <button onclick="handleChoice('${opt.id}')" class="btn-gov group !mb-0 pr-12">
                                    <span class="text-lg text-left">${opt.label}</span>
                                    <svg class="w-6 h-6 text-blue-200 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                                ${opt.help ? `<button onclick="event.stopPropagation(); toggleHelp('help-${opt.id}')" class="absolute right-4 text-gov-blue hover:text-gov-dark-blue p-2 z-10" title="Ver ayuda"><svg class="w-6 h-6 bg-white rounded-full border border-gov-blue text-gov-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>` : ''}
                            </div>
                            ${opt.help ? `<div id="help-${opt.id}" class="hidden mt-2 mx-4 text-sm text-gov-dark-blue bg-blue-50 p-3 rounded-b-lg border-x border-b border-blue-100">${opt.help}</div>` : ''}</div>`;
                } else {
                    html += `
                            <div onclick="toggleMulti(this, '${opt.id}', '${stepId}')" class="checkbox-card ${isSelected ? 'selected' : ''} flex flex-col !items-start cursor-pointer hover:shadow-md transition-all">
                                <div class="flex items-center w-full">
                                    <div class="checkbox-mark flex-shrink-0">${isSelected ? '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>' : '<div class="w-5 h-5 border-2 border-gray-400 rounded"></div>'}</div>
                                    <span class="text-gray-700 font-semibold flex-1 ml-3 text-base">${opt.label}</span>
                                    ${opt.help ? `<button onclick="event.stopPropagation(); toggleHelp('help-${opt.id}')" class="ml-2 text-gov-blue hover:bg-blue-100 rounded-full p-1 transition-colors flex-shrink-0" title="Ver ayuda"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>` : ''}
                                </div>
                                ${opt.help ? `<div id="help-${opt.id}" class="hidden w-full mt-2 text-sm text-gov-dark-blue bg-blue-50 p-2 rounded border border-blue-100 text-left">${opt.help}</div>` : ''}
                            </div>`;
                }
            });
            html += '</div>';
        }
        else if (config.type === 'dropdown' || config.type === 'municipality-city') {
            nextBtn.classList.remove('hidden');
            if (config.type === 'dropdown') {
                html += `<div class="mb-6"><select id="selectInput" onchange="this.classList.remove('border-red-500', 'ring-2', 'ring-red-200')" class="w-full p-4 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-gov-blue"><option value="">Seleccione una opción...</option>${config.data.map(i => `<option value="${i}">${i}</option>`).join('')}</select></div>`;
            } else {
                html += `
                        <div class="space-y-6"><div><label class="block text-gray-700 font-bold mb-2 text-sm uppercase tracking-wide">Municipio</label><select id="municipalityInput" onchange="this.classList.remove('border-red-500', 'ring-2', 'ring-red-200')" class="w-full p-4 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-gov-blue">${config.municipalityData.map(i => `<option value="${i}">${i}</option>`).join('')}</select></div><div class="bg-blue-50 p-4 rounded border border-blue-100"><label class="block text-gov-blue font-bold mb-2 text-sm uppercase tracking-wide flex items-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>Ciudad Principal más cercana</label><p class="text-xs text-gray-500 mb-2">Seleccione dónde le quedaría más fácil recibir atención presencial.</p><select id="cityInput" onchange="this.classList.remove('border-red-500', 'ring-2', 'ring-red-200')" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gov-blue"><option value="">Seleccione...</option>${config.cityData.map(i => `<option value="${i}">${i}</option>`).join('')}</select></div></div>`;
            }
        }
        else if (config.type === 'date-year-picker') {
            nextBtn.classList.remove('hidden');
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div><label class="block text-gray-700 font-bold mb-2 text-sm uppercase tracking-wide">Mes</label><select id="monthInput" class="w-full p-4 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-gov-blue appearance-none bg-white"><option value="">Seleccione...</option>${months.map(m => `<option value="${m}">${m}</option>`).join('')}</select></div><div><label class="block text-gray-700 font-bold mb-2 text-sm uppercase tracking-wide">Año (4 dígitos)</label><input type="number" id="yearInput" placeholder="Ej: 2020" min="1900" max="2025" class="w-full p-4 border border-gray-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-gov-blue" oninput="if(this.value.length > 4) this.value = this.value.slice(0,4);"></div></div><div id="dateError" class="text-red-600 font-bold hidden mb-4 bg-red-50 p-3 rounded border border-red-200 text-center">⚠️ Por favor ingrese un año válido entre 1900 y 2025 y seleccione el mes.</div>`;
        }
        else if (config.type === 'textarea') {
            nextBtn.classList.remove('hidden');
            html += `<textarea id="narrativeInput" class="w-full p-4 border border-gray-300 rounded-lg h-40 outline-none focus:border-gov-blue text-lg" placeholder="Ej: Vestía jean azul, camisa roja. Tiene una cicatriz en la ceja..."></textarea>`;
        }
    }
    container.innerHTML = html;
}

// --- 6. LOGICA DE NAVEGACIÓN ---
function handleChoice(val) {
    const cur = state.currentStep;
    if (cur === 'p2') state.answers.p2 = val;
    if (cur === 'p2.4_conflict') state.answers.p2_sub = val;
    if (cur === 'p3_type') state.answers.p3_type = val;
    if (cur === 'p1') state.answers.p1 = val;
    if (['p1_conflict', 'p1_crime', 'p1_migration'].includes(cur)) state.answers.p1_sub = val;
    state.history.push(cur);
    let next = '';
    if (cur === 'p2') { if (val === '2.1') next = 'p3_type'; else next = 'p2_date'; }
    else if (cur === 'p3_type') { if (val === '3.1') next = 'p3.1'; else if (val === '3.2') next = 'p3.2'; else next = 'p3.3'; }
    else if (cur === 'p1') { if (val === '4.1') next = 'p1_conflict'; else if (val === '4.2') next = 'p1_crime'; else if (val === '4.5') next = 'p1_migration'; else next = 'p_narrative'; }
    else if (['p1_conflict', 'p1_crime', 'p1_migration'].includes(cur)) { next = 'p_narrative'; }
    renderView(next);
}
function toggleMulti(el, val, step) {
    el.classList.toggle('selected');
    el.querySelector('.checkbox-mark').innerHTML = el.classList.contains('selected') ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>' : '';
    let arr = step === 'p3.4' ? state.answers.p3_characteristics : state.answers.p4_profile;
    if (arr.includes(val)) arr.splice(arr.indexOf(val), 1); else arr.push(val);
}
async function goNext() {
    const cur = state.currentStep;
    const currentConfig = steps[cur];
    if (currentConfig && currentConfig.type === 'dropdown') {
        const select = document.getElementById('selectInput');
        if (!select.value) { select.classList.add('border-red-500', 'ring-2', 'ring-red-200'); select.focus(); return; }
        state.answers.p3_detail = select.value;
    }
    if (currentConfig && currentConfig.type === 'municipality-city') {
        const muniSelect = document.getElementById('municipalityInput');
        const citySelect = document.getElementById('cityInput');
        let valid = true;
        if (!muniSelect.value) { muniSelect.classList.add('border-red-500', 'ring-2', 'ring-red-200'); valid = false; }
        if (!citySelect.value) { citySelect.classList.add('border-red-500', 'ring-2', 'ring-red-200'); valid = false; }
        if (!valid) return;
        state.answers.p3_sub_detail = (muniSelect.value === 'Otro') ? '' : muniSelect.value;
        state.answers.p3_detail = (citySelect.value === 'Otro') ? 'Bogotá D.C.' : citySelect.value;
    }

    if (currentConfig && currentConfig.type === 'textarea') {
        state.answers.narrative = document.getElementById('narrativeInput').value;
    }

    if (cur === 'p2_date') {
        const month = document.getElementById('monthInput').value;
        const year = document.getElementById('yearInput').value;
        const yearNum = parseInt(year);
        if (!month || !year || year.length !== 4 || yearNum < 1900 || yearNum > 2025) { document.getElementById('dateError').classList.remove('hidden'); return; }
        state.answers.p2_date_month = month;
        state.answers.p2_date_year = year;
    }
    if (cur === 'p4' && state.answers.p4_profile.length === 0) state.answers.p4_profile.push('1.11');
    if (cur === 'p3.4' && state.answers.p3_characteristics.length === 0) state.answers.p3_characteristics.push('3.4.10');

    state.history.push(cur);
    let next = '';
    if (cur === 'intro') next = 'p4';
    else if (cur === 'p4') next = 'p2';
    else if (cur === 'p2_date') next = 'p3_type';
    else if (['p3.1', 'p3.2', 'p3.3'].includes(cur)) next = 'p3.4';
    else if (cur === 'p3.4') next = 'p1';
    else if (cur === 'p_narrative') next = 'results';

    if (next === 'results') {
        await loadRouteData();
    }

    renderView(next);
}
function goBack() { if (state.history.length > 0) renderView(state.history.pop()); }

// --- 7. EL MOTOR DE LÓGICA (ACTUALIZADO) ---
function generateResultsEngine() {
    const isReciente = state.answers.p2 === '2.1';
    const temporalContext = isReciente ? 'URGENTE' : 'HISTORICO';

    let conflictDateContext = null;
    if (!isReciente && (state.answers.p1 === '4.1' || state.answers.p1_sub?.startsWith('4.1'))) {
        const year = parseInt(state.answers.p2_date_year);
        const monthName = state.answers.p2_date_month;
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthIndex = months.indexOf(monthName);
        const dateCutoff = new Date(2016, 11, 1);
        const dateUser = new Date(year, monthIndex, 1);
        conflictDateContext = (dateUser < dateCutoff) ? 'PRE_2016' : 'POST_2016';
    }

    const userTags = new Set();
    if (state.answers.p1) userTags.add(state.answers.p1);
    if (state.answers.p1_sub) userTags.add(state.answers.p1_sub);
    state.answers.p4_profile.forEach(t => userTags.add(t));
    state.answers.p3_characteristics.forEach(t => userTags.add(t));

    let matchedActions = DB_ACCIONES.filter(action => {
        const casoMatch = action.caso.includes('TODOS') || action.caso.some(c => userTags.has(c));
        const ubiMatch = action.ubicacion.includes('TODOS') || action.ubicacion.some(u => userTags.has(u));
        if (!casoMatch || !ubiMatch) return false;
        const timeMatch = action.temporalidad.includes('AMBAS') || action.temporalidad.includes(temporalContext);
        if (!timeMatch) return false;
        if (conflictDateContext) {
            if (conflictDateContext === 'PRE_2016' && action.temporalidad.includes('POST_2016') && !action.temporalidad.includes('PRE_2016')) return false;
            if (conflictDateContext === 'POST_2016' && action.temporalidad.includes('PRE_2016') && !action.temporalidad.includes('POST_2016')) return false;
        }
        return true;
    });

    const uniqueMap = new Map();
    matchedActions.forEach(action => {
        if (!uniqueMap.has(action.id) || action.prioridad > uniqueMap.get(action.id).prioridad) {
            uniqueMap.set(action.id, action);
        }
    });
    const finalActions = Array.from(uniqueMap.values());
    finalActions.sort((a, b) => a.etapa - b.etapa);

    const legalActions = finalActions.filter(a => a.categoria === 'ACCION LEGAL');
    const ownActions = finalActions.filter(a => a.categoria === 'ACCION PROPIA');
    const supportActions = finalActions.filter(a => a.categoria === 'APOYO EXTRA');
    const narrative = state.answers.narrative || '';

    // --- FUNCIÓN DE PROCESAMIENTO DE CONTENIDO ---
    const processActionContent = (action) => {
        let rawContent = action.contenido;
        if (rawContent.includes('INFORMACIONADICIONAL')) {
            const infoText = narrative ? `**${narrative}**` : '';
            rawContent = rawContent.replace(/INFORMACIONADICIONAL/g, infoText);
        }
        if (rawContent.includes('CONTACTOINMEDIATO')) {
            const contactIds = action.contactos;
            const contactDetails = contactIds.map(id => {
                const cleanId = id.trim();
                const candidates = DB_CONTACTOS.filter(c => c.ID_ENTIDAD === cleanId);
                if (candidates.length === 0) return '';

                const userMuni = state.answers.p3_sub_detail || '';
                const userCity = state.answers.p3_detail || '';
                let bestMatch = null;
                if (userMuni) bestMatch = candidates.find(c => c.MUNICIPIO === userMuni);
                if (!bestMatch && userCity) bestMatch = candidates.find(c => c.CIUDAD === userCity);
                if (!bestMatch) bestMatch = candidates.find(c => c.PAIS === 'Colombia' && c.CIUDAD === 'Nacional' && (!c.MUNICIPIO || c.MUNICIPIO.trim() === ''));
                if (!bestMatch) bestMatch = candidates.find(c => c.PAIS === 'Colombia' && c.CIUDAD && c.CIUDAD.toLowerCase().startsWith('bogo') && (!c.MUNICIPIO || c.MUNICIPIO.trim() === ''));

                if (!bestMatch) return '';
                return `<div class="bg-blue-50 border-l-4 border-gov-blue p-4 my-3 rounded-r-lg shadow-sm text-base [&_a]:text-gov-blue [&_a]:font-semibold [&_a]:underline [&_a:hover]:text-gov-dark-blue [&_a]:transition-colors">${processMarkdownLinks(marked.parse(bestMatch.CONTENIDO_MD))}</div>`;
            }).join('');
            rawContent = rawContent.replace(/CONTACTOINMEDIATO/g, contactDetails);
        }
        return processMarkdownLinks(marked.parse(rawContent));
    };

    // --- RENDERIZADO ACCIONES (WEB: Acordeones) ---
    const renderActionList = (actions) => {
        if (actions.length === 0) return '<div class="p-6 bg-gray-50 text-gray-500 rounded-lg text-center border border-gray-200">No hay acciones específicas para este criterio.</div>';
        return actions.map((action, index) => {
            const htmlContent = processActionContent(action);
            const showConnector = index < actions.length - 1;
            const displayStep = index + 1; // Numeración secuencial para mostrar al usuario
            return `
                    <div class="relative">
                        <details name="guide-accordion" class="group bg-white border-2 border-gray-200 rounded-lg mb-3 shadow-sm hover:shadow-md hover:border-gov-blue transition-all">
                            <summary class="flex items-center p-4 cursor-pointer select-none">
                                <div class="flex items-center flex-1">
                                    <span class="bg-gov-blue text-white text-sm font-bold px-3 py-1.5 rounded-lg mr-4 border-2 border-gov-dark-blue min-w-[40px] text-center shadow-sm">Paso ${displayStep}</span>
                                    <span class="font-bold text-gov-dark-blue text-lg">${action.titulo}</span>
                                </div>
                                <svg class="chevron w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </summary>
                            <div class="p-5 pt-2 text-gray-700 leading-relaxed border-t border-gray-100 bg-gray-50 text-base md-content">${htmlContent}</div>
                        </details>
                        ${showConnector ? '<div class="flex justify-center mb-2"><svg class="w-6 h-6 text-gov-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg></div>' : ''}
                    </div>`;
        }).join('');
    };

    // --- RENDERIZADO ACCIONES (IMPRESIÓN: Bloques expandidos) ---
    const renderActionListPrint = (actions) => {
        if (actions.length === 0) return '<div class="print-item text-gray-500 italic">No aplica para este caso.</div>';
        return actions.map((action, index) => {
            const htmlContent = processActionContent(action);
            const displayStep = index + 1; // Numeración secuencial solo para mostrar
            return `
                    <div class="print-item">
                        <div class="print-title">Paso ${displayStep}. ${action.titulo}</div>
                        <div class="print-content md-content">${htmlContent}</div>
                    </div>`;
        }).join('');
    };

    // --- PROCESAMIENTO NODOS RUTA ---
    const processRouteNodes = () => {
        if (!CURRENT_ROUTE_DATA || CURRENT_ROUTE_DATA.length === 0) return [];
        const nodes = CURRENT_ROUTE_DATA.map(row => ({ ...row, cleanId: row.paso.replace('BIF', '').trim(), isBif: row.paso.startsWith('BIF'), children: [] }));
        const bifMap = {};
        nodes.filter(n => n.isBif).forEach(n => { bifMap[n.cleanId] = n; });
        const root = [];
        nodes.forEach(node => {
            if (node.paso === 'SEPARADOR') { root.push(node); return; }
            let bestParent = null, maxLen = 0;
            Object.keys(bifMap).forEach(prefix => {
                const isChild = node.cleanId.startsWith(prefix) && node.cleanId !== prefix;
                if (isChild && prefix.length > maxLen) { maxLen = prefix.length; bestParent = bifMap[prefix]; }
            });
            if (bestParent) bestParent.children.push(node); else root.push(node);
        });
        return root;
    };

    const routeNodes = processRouteNodes();

    // --- RENDER RUTA (WEB) ---
    const renderRouteRecursive = (nodeList, groupName = 'guide-accordion') => {
        if (!nodeList || nodeList.length === 0) return '';
        return nodeList.map(node => {
            const mdContent = processMarkdownLinks(marked.parse(node.contenido || ''));
            if (node.paso === 'SEPARADOR') {
                return `<div class="mt-8 mb-4 bg-gov-dark-blue text-white p-4 rounded-lg shadow-md"><h4 class="font-bold text-lg">${node.titulo}</h4><div class="text-sm opacity-90 mt-1 md-content">${mdContent}</div></div>`;
            }
            if (node.isBif) {
                const childrenHtml = renderRouteRecursive(node.children, `guide-accordion-${node.cleanId}`);
                return `<details name="${groupName}" class="group bg-blue-50 border border-blue-200 rounded-lg mb-3 shadow-sm hover:shadow-md transition-all ml-0"><summary class="flex items-center p-4 cursor-pointer select-none"><div class="flex items-center flex-1"><span class="bg-gov-dark-blue text-white text-xs px-2 py-1 rounded mr-3 font-extrabold border border-blue-900 min-w-[24px] text-center">Opc</span><span class="font-bold text-gov-dark-blue text-lg">${node.titulo}</span></div><svg class="chevron w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></summary><div class="p-5 pt-2 text-gray-700 leading-relaxed border-t border-blue-100 bg-white text-base md-content">${mdContent}${childrenHtml ? `<div class="mt-4 pt-4 border-t border-gray-100 pl-4 border-l-2 border-blue-100 space-y-2">${childrenHtml}</div>` : ''}</div></details>`;
            } else {
                return `<details name="${groupName}" class="group bg-white border border-gray-200 rounded-lg mb-2 shadow-sm hover:shadow-md transition-all"><summary class="flex items-center p-4 cursor-pointer select-none"><div class="flex items-center flex-1"><span class="bg-blue-100 text-gov-blue text-xs px-2 py-1 rounded mr-3 font-extrabold border border-blue-200 min-w-[24px] text-center">${node.paso}</span><span class="font-bold text-gov-dark-blue text-lg">${node.titulo}</span></div><svg class="chevron w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></summary><div class="p-5 pt-2 text-gray-700 leading-relaxed border-t border-gray-100 bg-gray-50 text-base md-content">${mdContent}</div></details>`;
            }
        }).join('');
    };

    // --- RENDER RUTA (IMPRESIÓN) ---
    const renderRouteRecursivePrint = (nodeList, depth = 0) => {
        if (!nodeList || nodeList.length === 0) return '';
        return nodeList.map(node => {
            const mdContent = processMarkdownLinks(marked.parse(node.contenido || ''));
            if (node.paso === 'SEPARADOR') {
                return `<div class="mt-4 mb-2 bg-gray-100 p-2 border-b-2 border-gov-dark-blue"><h4 class="font-bold text-lg text-gov-dark-blue">${node.titulo}</h4><div class="text-xs text-gray-600 md-content">${mdContent}</div></div>`;
            }

            const indentClass = depth > 0 ? 'ml-4 border-l-2 border-gray-300 pl-4' : '';
            const titlePrefix = node.isBif ? 'OPCIÓN' : node.paso;

            let childrenHtml = '';
            if (node.isBif && node.children.length > 0) {
                childrenHtml = renderRouteRecursivePrint(node.children, depth + 1);
            }

            return `
                    <div class="print-item ${indentClass}">
                        <div class="print-title text-sm"><span class="bg-gray-200 px-1 rounded text-xs mr-2 font-mono">${titlePrefix}</span> ${node.titulo}</div>
                        <div class="print-content md-content text-sm mb-2">${mdContent}</div>
                        ${childrenHtml}
                    </div>`;
        }).join('');
    };

    // HTML Contactos Web
    let contactsHTML = '';
    let contactsHTMLPrint = '';
    if (DB_CONTACTOS.length > 0) {
        let localContacts = DB_CONTACTOS.filter(c => (c.Ciudad === state.answers.p3_detail || c.Cobertura === 'NACIONAL') && c.Activa === 'SI');
        // Web HTML
        contactsHTML = localContacts.map(c => `
                    <li class="bg-white p-4 rounded border border-blue-100 shadow-sm mb-2">
                        <strong class="block text-gov-blue text-lg">${c.Nombre_Corto || c.Nombre_Largo}</strong>
                        <span class="block text-sm text-gray-700 mt-1">${c.Que_Hace_Resumen || ''}</span>
                        <div class="mt-2 text-sm text-gray-600">📞 ${c.Telefono_Principal || c.Linea_Gratuita} <br>📍 ${c.Direccion || 'Nacional'}</div>
                    </li>`).join('');
        if (contactsHTML) contactsHTML = `<div class="mt-4 bg-blue-50 p-6 rounded-lg border border-blue-100"><ul class="space-y-0">${contactsHTML}</ul></div>`;

        // Print HTML
        contactsHTMLPrint = localContacts.map(c => `
                    <div class="mb-2 pb-2 border-b border-gray-100">
                        <strong class="block text-gov-blue">${c.Nombre_Corto || c.Nombre_Largo}</strong>
                        <div class="text-xs text-gray-600">📞 ${c.Telefono_Principal || c.Linea_Gratuita} | 📍 ${c.Direccion || 'Nacional'}</div>
                    </div>`).join('');
        if (contactsHTMLPrint) contactsHTMLPrint = `<div class="mt-4 p-4 border border-gray-300 rounded"><h3 class="font-bold text-sm mb-2">Directorio de Apoyo Local</h3>${contactsHTMLPrint}</div>`;
    }

    const lugarTexto = state.answers.p3_sub_detail ? `${state.answers.p3_sub_detail}, ${state.answers.p3_detail}` : (state.answers.p3_detail || 'Nacional');
    const fechaTexto = isReciente ? "Reciente" : (state.answers.p2_date_year ? `${state.answers.p2_date_month} ${state.answers.p2_date_year}` : "Histórico");

    // --- CONSTRUCCIÓN HTML FINAL ---
    // 1. Contenido Web
    const contentLegal = `<div class="space-y-2">${renderActionList(legalActions)}</div>`;
    const contentOwn = `<div class="space-y-2">${renderActionList(ownActions)}</div>`;
    const contentSupport = `<div class="space-y-2 mb-8">${renderActionList(supportActions)}</div>${contactsHTML}`;
    const contentMaster = `<div class="space-y-2">${renderRouteRecursive(routeNodes)}</div>`;

    // 2. Contenido Impresión
    const printHTML = `
            <div id="print-area" class="hidden">
                <div class="mb-8 border-b-2 border-gov-blue pb-4">
                    <img src="logoGovCO.png" class="h-12 mb-4" alt="Logo MinJusticia">
                    <h1 class="print-header">Guía de Búsqueda - Plan de Acción Personalizado</h1>
                    <p class="text-sm text-gray-600">Generado el: ${new Date().toLocaleDateString()} | Lugar de Búsqueda: ${lugarTexto}</p>
                </div>
                
                <div class="print-section bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                    <h2 class="font-bold text-lg mb-2 text-gov-dark-blue">Perfil del Caso</h2>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Tiempo:</strong> ${fechaTexto}</div>
                        <div><strong>Ubicación:</strong> ${lugarTexto}</div>
                        <div><strong>Tipo:</strong> ${getProfiles()}</div>
                        <div class="col-span-2"><strong>Contexto:</strong> ${matchedActions.length} acciones identificadas.</div>
                    </div>
                    ${narrative ? `<div class="mt-2 pt-2 border-t border-gray-200 text-sm"><strong>Notas:</strong> ${narrative}</div>` : ''}
                </div>
                
                <h2 class="print-subheader">1. Acciones Legales y Humanitarias</h2>
                <div class="print-section">${renderActionListPrint(legalActions)}</div>
                
                <h2 class="print-subheader">2. Acciones Personales</h2>
                <div class="print-section">${renderActionListPrint(ownActions)}</div>
                
                <h2 class="print-subheader">3. Apoyos Complementarios</h2>
                <div class="print-section">
                    ${renderActionListPrint(supportActions)}
                    ${contactsHTMLPrint}
                </div>
                
                <h2 class="print-subheader" style="page-break-before: always;">4. Ruta Completa de Búsqueda</h2>
                <div class="print-section">${renderRouteRecursivePrint(routeNodes)}</div>
                
                <div class="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                    <p>Ministerio de Justicia y del Derecho - Colombia</p>
                    <p>Esta guía es informativa y no constituye un documento legal vinculante. Llame siempre a las líneas oficiales.</p>
                </div>
            </div>`;

    // Retorno Combinado
    return `
                <div class="print:hidden">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-800 mb-1">Ruta de Acción Personalizada</h3>
                        <p class="text-gray-600 text-base md:text-lg font-semibold mb-2">Siga estos pasos en orden secuencial. Complete cada paso antes de avanzar al siguiente.</p>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-6">
                        <button id="btn-legal" onclick="switchTab('legal')" class="tab-btn active">Acciones Legales y Humanitarias</button>
                        <button id="btn-propias" onclick="switchTab('propias')" class="tab-btn">Acciones Personales</button>
                        <button id="btn-apoyos" onclick="switchTab('apoyos')" class="tab-btn">Apoyos Complementarios</button>
                        <button id="btn-maestra" onclick="switchTab('maestra')" class="tab-btn">Ruta Completa de Búsqueda</button>
                    </div>
                    <div id="tab-legal" class="tab-content fade-in">
                        <div class="bg-blue-50 border-l-4 border-gov-blue p-4 mb-4 rounded-r-lg">
                            <p class="text-sm font-semibold text-gov-dark-blue"><strong>Importante:</strong> Las acciones se presentan en un orden sugerido; comience por las primeras y avance según las alternativas que mejor se ajusten a su caso.</p>
                        </div>
                        ${contentLegal}
                    </div>
                    <div id="tab-propias" class="tab-content hidden fade-in">
                        <div class="bg-blue-50 border-l-4 border-gov-blue p-4 mb-4 rounded-r-lg">
                            <p class="text-sm font-semibold text-gov-dark-blue"><strong>Importante:</strong> Las acciones se presentan en un orden sugerido; comience por las primeras y avance según las alternativas que mejor se ajusten a su caso.</p>
                        </div>
                        ${contentOwn}
                    </div>
                    <div id="tab-apoyos" class="tab-content hidden fade-in">
                        <div class="bg-blue-50 border-l-4 border-gov-blue p-4 mb-4 rounded-r-lg">
                            <p class="text-sm font-semibold text-gov-dark-blue"><strong>Importante:</strong> Las acciones se presentan en un orden sugerido; comience por las primeras y avance según las alternativas que mejor se ajusten a su caso.</p>
                        </div>
                        ${contentSupport}
                    </div>
                    <div id="tab-maestra" class="tab-content hidden fade-in">
                        ${contentMaster}
                    </div>
                    
                    <div class="mt-12 flex flex-col items-center gap-4">
                        <div class="flex flex-wrap justify-center items-center gap-4 w-full">
                            <button onclick="goBack()" class="bg-white text-gov-blue border-2 border-gov-blue px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition shadow-md flex items-center justify-center h-12">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                Volver
                            </button>
                            <button onclick="window.print()" class="bg-white text-gov-blue border-2 border-gov-blue px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition shadow-md flex items-center justify-center h-12">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Descargar Guía Completa (PDF)
                            </button>
                            <button onclick="location.reload()" class="bg-white text-gray-600 border-2 border-gray-300 px-6 py-3 rounded-full font-bold hover:bg-gray-50 transition shadow-sm flex items-center justify-center h-12">
                                Nueva Consulta
                            </button>
                        </div>
                        ${SURVEY_FORM_URL ? `<a href="${SURVEY_FORM_URL}" target="_blank" rel="noopener noreferrer" class="bg-white text-gov-blue border-2 border-gov-blue px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition shadow-md flex items-center justify-center h-12">
                            ⭐ Califica tu experiencia
                        </a>` : ''}
                    </div>
                </div>
                ${printHTML}`;
}

function getProfiles() {
    const map = { '1.1': 'Menor de edad', '1.2': 'Líder/Rol Público', '1.3': 'Fuerza Pública', '1.4': 'Actor Armado', '1.5': 'Condición Especial/Mayor', '1.6': 'Migrante/Extranjero', '1.7': 'Mujer (Riesgo)', '1.8': 'Comunidad Étnica', '1.9': 'LGBTIQ+', '1.10': 'Desaparición Colectiva' };
    return state.answers.p4_profile.map(id => map[id] || id).join(', ') || "General";
}

loadData();
