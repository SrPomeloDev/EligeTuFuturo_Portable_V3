'use strict';

// =============================================
// ESTADO GLOBAL
// =============================================
const estado = {
    instituciones: [],
    institucionesFiltradas: [],
    favoritos: new Set(),
    comparar: new Set(),
    puntajesTest: { ciencias: 0, social: 0, creativo: 0, negocios: 0, tecnologia: 0 },
    preguntaActual: 0,
    cargando: true,
    excel: {
        datos: [],
        cambiosPendientes: new Map(),
        idsEliminados: new Set(),
        subVista: 'excel'
    }
};

// =============================================
// APLICACIÓN PRINCIPAL
// =============================================
const app = {

    // ----------------------------------------
    // INICIALIZACIÓN
    // ----------------------------------------
    async iniciar() {
        this._cargarTema();
        this._cargarEstadoLocal();
        this._registrarEventos();

        // Mostrar spinner en la grilla mientras carga
        const grilla = document.getElementById('grilla-instituciones');
        if (grilla) grilla.innerHTML = this._htmlCargando();

        try {
            // cargarDatos() viene de datos.js — devuelve { instituciones, fuente }
            const resultado = await cargarDatos();

            if (Array.isArray(resultado)) {
                estado.instituciones = resultado;
            } else if (resultado && resultado.instituciones) {
                estado.instituciones = resultado.instituciones;
                // Actualizar indicador según fuente
                const indicador = document.getElementById('conexion-status');
                if (indicador) {
                    if (resultado.fuente === 'online') {
                        indicador.textContent = '🟢 En línea';
                    } else if (resultado.fuente === 'cache') {
                        indicador.textContent = '🟡 Caché (sin internet)';
                    } else {
                        indicador.textContent = '🔴 Sin conexión';
                    }
                }
            } else {
                estado.instituciones = [];
            }
            estado.institucionesFiltradas = [...estado.instituciones];

            // Validar que los favoritos y comparar cargados existan en las instituciones
            if (estado.instituciones.length > 0) {
                const idsValidos = new Set(estado.instituciones.map(i => i.id));
                [...estado.favoritos].forEach(id => {
                    if (!idsValidos.has(id)) estado.favoritos.delete(id);
                });
                [...estado.comparar].forEach(id => {
                    if (!idsValidos.has(id)) estado.comparar.delete(id);
                });
                this._guardarEstadoLocal();
            }

        } catch (error) {
            console.error("Error crítico:", error);
            estado.instituciones = [];
            estado.institucionesFiltradas = [];
        } finally {
            estado.cargando = false;
            this._actualizarEstadisticasInicio();
            this._llenarSelectInstituciones();
            this._actualizarContadores();
            // Pintar la grilla al terminar de cargar (aunque estemos en inicio)
            this._aplicarFiltros();
        }
    },

    // ----------------------------------------
    // NAVEGACIÓN
    // ----------------------------------------
    navegar(ruta) {
        document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
        document.querySelectorAll('[data-ruta]').forEach(a => a.classList.remove('activo'));

        const vista = document.getElementById(ruta);
        if (vista) vista.classList.add('activa');

        const enlace = document.querySelector(`[data-ruta="${ruta}"]`);
        if (enlace) enlace.classList.add('activo');

        // Cerrar menú móvil
        document.getElementById('enlaces-nav')?.classList.remove('activo');
        const btnMenu = document.getElementById('btn-menu-movil');
        if (btnMenu) { btnMenu.textContent = '☰'; btnMenu.setAttribute('aria-expanded', 'false'); }

        const acciones = {
            explorar: () => this._aplicarFiltros(),
            comparar: () => this.renderizarComparar(),
            favoritos: () => this.renderizarFavoritos(),
            admin: () => this.inicializarExcelAdmin()
        };
        if (acciones[ruta]) acciones[ruta]();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ----------------------------------------
    // INICIO — ESTADÍSTICAS
    // ----------------------------------------
    _actualizarEstadisticasInicio() {
        const totalCarreras = estado.instituciones.reduce((s, i) => s + (i.carreras?.length || 0), 0);
        const el1 = document.getElementById('stat-instituciones');
        const el2 = document.getElementById('stat-carreras');
        if (el1) el1.textContent = `+${estado.instituciones.length}`;
        if (el2) el2.textContent = `+${totalCarreras}`;
    },

    // ----------------------------------------
    // EXPLORAR — FILTROS Y TARJETAS
    // ----------------------------------------
    renderizarExplorar() {
        this._aplicarFiltros();
    },

    _aplicarFiltros() {
        const busqueda = (document.getElementById('input-busqueda')?.value || '').toLowerCase().trim();
        const tipo = document.getElementById('filtro-tipo')?.value || '';
        const modalidad = document.getElementById('filtro-modalidad')?.value || '';
        const precioMax = parseFloat(document.getElementById('filtro-precio')?.value) || Infinity;

        estado.institucionesFiltradas = estado.instituciones.filter(inst => {
            const enNombre = inst.nombre?.toLowerCase().includes(busqueda);
            const enSigla = inst.sigla?.toLowerCase().includes(busqueda);
            const enCarreras = inst.carreras?.some(c => c.nombre?.toLowerCase().includes(busqueda));
            const enTags = inst.tags?.some(t => t?.toLowerCase().includes(busqueda));
            const coincideBusqueda = !busqueda || enNombre || enSigla || enCarreras || enTags;
            const coincideTipo = !tipo || inst.tipo === tipo;
            const coincideModalidad = !modalidad || inst.modalidad === modalidad;
            const coincidePrecio = (inst.costoMensual || 0) <= precioMax;
            return coincideBusqueda && coincideTipo && coincideModalidad && coincidePrecio;
        });

        const contador = document.getElementById('contador-resultados');
        if (contador) {
            if (estado.cargando) {
                contador.textContent = '';
            } else {
                contador.textContent = estado.institucionesFiltradas.length === 0
                    ? 'Sin resultados'
                    : `${estado.institucionesFiltradas.length} institución(es) encontrada(s)`;
            }
        }
        this._renderizarGrilla('grilla-instituciones', estado.institucionesFiltradas);
    },

    limpiarFiltros() {
        ['input-busqueda', 'filtro-tipo', 'filtro-modalidad', 'filtro-precio'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this._aplicarFiltros();
    },

    // ----------------------------------------
    // RENDERIZADO DE TARJETAS
    // ----------------------------------------
    _renderizarGrilla(idGrilla, lista) {
        const grilla = document.getElementById(idGrilla);
        if (!grilla) return;

        if (estado.cargando) {
            grilla.innerHTML = this._htmlCargando();
            return;
        }

        if (!lista || lista.length === 0) {
            grilla.innerHTML = `
                <div class="estado-vacio">
                    <div class="icono-vacio">🔍</div>
                    <h3>Sin resultados</h3>
                    <p>Prueba con otros filtros.</p>
                    <button class="btn btn-secundario" onclick="app.limpiarFiltros()">Limpiar filtros</button>
                </div>`;
            return;
        }
        grilla.innerHTML = lista.map(inst => this._htmlTarjeta(inst)).join('');
    },

    _htmlTarjeta(inst) {
        const esFav = estado.favoritos.has(inst.id);
        const enComp = estado.comparar.has(inst.id);
        const compLleno = estado.comparar.size >= 3 && !enComp;
        const precioHTML = inst.costoMensual === 0
            ? '<span class="precio-gratis">Gratuita</span>'
            : `<span class="precio-pago">Bs ${(inst.costoMensual || 0).toLocaleString('es-BO')}/mes</span>`;

        const etiquetasCarreras = (inst.carreras || []).slice(0, 3).map(c =>
            `<span class="etiqueta-carrera">${c.nombre}</span>`
        ).join('') + ((inst.carreras?.length || 0) > 3
            ? `<span class="etiqueta-carrera etiqueta-mas">+${inst.carreras.length - 3}</span>`
            : '');

        return `
        <article class="tarjeta-inst panel-cristal" data-id="${inst.id}">
            <div class="tarjeta-cabecera">
                <div class="tarjeta-identidad">
                    <span class="tipo-badge tipo-${inst.tipo === 'Universidad' ? 'u' : 'i'}">${inst.tipo}</span>
                    <h3 class="tarjeta-nombre">${inst.nombre}</h3>
                    <span class="tarjeta-sigla">${inst.sigla}</span>
                </div>
                <button class="btn-fav ${esFav ? 'fav-activo' : ''}"
                    onclick="app.toggleFavorito(${inst.id})"
                    aria-label="${esFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                    ${esFav ? '❤️' : '🤍'}
                </button>
            </div>

            <div class="tarjeta-meta">
                <span>📍 ${inst.ubicacion || '—'}</span>
                <span>📚 ${inst.modalidad || '—'}</span>
                ${inst.becas ? '<span class="meta-beca">🎓 Becas</span>' : ''}
            </div>

            <div class="tarjeta-valoracion">
                ${this._generarEstrellas(inst.valoracion || 0)}
                <span class="num-resenas">(${inst.numResenas || 0})</span>
            </div>

            ${inst.LinkResenas || inst.linkResenas ? `<div class="tarjeta-link-resenas"><a href="${inst.LinkResenas || inst.linkResenas}" target="_blank" rel="noopener noreferrer">Ver reseñas</a></div>` : ''}

            <div class="tarjeta-carreras">${etiquetasCarreras}</div>

            <div class="tarjeta-pie">
                <div>${precioHTML}</div>
                <div class="tarjeta-acciones">
                    <button class="btn btn-sm btn-secundario" onclick="app.verDetalles(${inst.id})">
                        Ver detalles
                    </button>
                    <button
                        class="btn btn-sm ${enComp ? 'btn-acento' : 'btn-primario'}"
                        onclick="app.toggleComparar(${inst.id})"
                        ${compLleno ? 'disabled title="Máximo 3"' : ''}>
                        ${enComp ? '✓ Comparando' : '+ Comparar'}
                    </button>
                </div>
            </div>
        </article>`;
    },

    // ----------------------------------------
    // COMPARAR
    // ----------------------------------------
    toggleComparar(id) {
        if (estado.comparar.has(id)) {
            estado.comparar.delete(id);
        } else {
            if (estado.comparar.size >= 3) {
                this._toast('Solo puedes comparar hasta 3 instituciones', 'advertencia');
                return;
            }
            estado.comparar.add(id);
            this._toast('Agregada a comparación', 'exito');
        }
        this._actualizarContadores();
        this._guardarEstadoLocal();
        this._refrescarVistaActual();
    },

    renderizarComparar() {
        const wrapper = document.getElementById('tabla-comparacion-wrapper');
        const vacio = document.getElementById('comparar-vacio');

        if (estado.comparar.size === 0) {
            if (wrapper) wrapper.innerHTML = '';
            if (vacio) vacio.style.display = 'block';
            return;
        }
        if (vacio) vacio.style.display = 'none';

        const instituciones = [...estado.comparar]
            .map(id => estado.instituciones.find(i => i.id === id))
            .filter(Boolean);

        const filas = [
            { etiqueta: '🏛️ Tipo',          clave: 'tipo' },
            { etiqueta: '📍 Ubicación',       clave: 'ubicacion' },
            { etiqueta: '📚 Modalidad',       clave: 'modalidad' },
            { etiqueta: '✅ Acreditación',    clave: 'acreditacion' },
            { etiqueta: '💰 Costo mensual',   clave: 'costoMensual',     fmt: v => v === 0 ? '<strong class="precio-gratis">Gratuita</strong>' : `Bs ${v.toLocaleString('es-BO')}` },
            { etiqueta: '📋 Inscripción',     clave: 'costoInscripcion', fmt: v => v === 0 ? 'Gratuita' : `Bs ${v.toLocaleString('es-BO')}` },
            { etiqueta: '🎓 Becas',           clave: 'becas',            fmt: v => v ? '<span class="si">✓ Sí</span>' : '<span class="no">✗ No</span>' },
            { etiqueta: '⭐ Valoración',      clave: 'valoracion',       fmt: v => `${(v || 0).toFixed(1)} / 5.0` },
            { etiqueta: '📖 Carreras',        clave: 'carreras',         fmt: v => `${(v || []).length}` },
        ];

        const encabezados = instituciones.map(inst => `
            <th class="col-inst">
                <span class="tipo-badge tipo-${inst.tipo === 'Universidad' ? 'u' : 'i'}">${inst.tipo}</span>
                <strong>${inst.sigla}</strong>
                <p class="comp-nombre">${inst.nombre}</p>
                <button class="btn-quitar-comp" onclick="app.toggleComparar(${inst.id})">✕ Quitar</button>
            </th>`).join('');

        const filasHTML = filas.map(f => {
            const celdas = instituciones.map(inst => {
                const val = inst[f.clave];
                return `<td>${f.fmt ? f.fmt(val) : (val || '—')}</td>`;
            }).join('');
            return `<tr><th class="col-etiqueta">${f.etiqueta}</th>${celdas}</tr>`;
        }).join('');

        const filasCarreras = instituciones.map(inst => {
            const items = (inst.carreras || []).slice(0, 5).map(c =>
                `<li>${c.nombre}${c.duracion ? ` <em>(${c.duracion})</em>` : ''}</li>`
            ).join('');
            const mas = (inst.carreras?.length || 0) > 5 ? `<li class="mas-items">+${inst.carreras.length - 5} más</li>` : '';
            return `<td><ul class="lista-carreras-comp">${items}${mas}</ul></td>`;
        }).join('');

        const filasBtn = instituciones.map(inst =>
            `<td><button class="btn btn-sm btn-secundario" onclick="app.verDetalles(${inst.id})">Ver detalles</button></td>`
        ).join('');

        wrapper.innerHTML = `
            <div class="tabla-scroll">
                <table class="tabla-comparar">
                    <thead><tr><th class="col-etiqueta"></th>${encabezados}</tr></thead>
                    <tbody>
                        ${filasHTML}
                        <tr><th class="col-etiqueta">📋 Carreras principales</th>${filasCarreras}</tr>
                        <tr class="fila-acciones"><th class="col-etiqueta"></th>${filasBtn}</tr>
                    </tbody>
                </table>
            </div>`;
    },

    // ----------------------------------------
    // FAVORITOS
    // ----------------------------------------
    toggleFavorito(id) {
        if (estado.favoritos.has(id)) {
            estado.favoritos.delete(id);
            this._toast('Eliminado de favoritos', 'info');
        } else {
            estado.favoritos.add(id);
            this._toast('¡Guardado en favoritos!', 'exito');
        }
        this._actualizarContadores();
        this._guardarEstadoLocal();
        this._refrescarVistaActual();
        this._actualizarBtnFavModal(id);
    },

    renderizarFavoritos() {
        const grilla = document.getElementById('grilla-favoritos');
        const vacio = document.getElementById('favoritos-vacio');

        if (estado.favoritos.size === 0) {
            if (grilla) grilla.innerHTML = '';
            if (vacio) vacio.style.display = 'block';
            return;
        }
        if (vacio) vacio.style.display = 'none';

        const favs = [...estado.favoritos]
            .map(id => estado.instituciones.find(i => i.id === id))
            .filter(Boolean);

        this._renderizarGrilla('grilla-favoritos', favs);
    },

    exportarPDF() {
        if (typeof html2pdf === 'undefined') {
            this._toast('PDF no disponible sin conexión.', 'advertencia');
            return;
        }
        const elemento = document.getElementById('contenido-favoritos');
        html2pdf().set({
            margin: 10,
            filename: 'elige-tu-futuro-favoritos.pdf',
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(elemento).save();
        this._toast('Generando PDF...', 'info');
    },

    // ----------------------------------------
    // MODAL DE DETALLES
    // ----------------------------------------
    verDetalles(id) {
        const inst = estado.instituciones.find(i => i.id === id);
        if (!inst) return;

        const modal = document.getElementById('modal-detalles');
        const cuerpo = document.getElementById('cuerpo-modal');
        const esFav = estado.favoritos.has(id);
        const estrellas = this._generarEstrellas(inst.valoracion || 0);
        const precioTexto = (inst.costoMensual || 0) === 0 ? 'Gratuita' : `Bs ${inst.costoMensual.toLocaleString('es-BO')}/mes`;
        const inscripTexto = (inst.costoInscripcion || 0) === 0 ? 'Gratuita' : `Bs ${inst.costoInscripcion.toLocaleString('es-BO')}`;

        const carrerasHTML = (inst.carreras || []).map(c => `
            <div class="carrera-item">
                <span class="carrera-nombre">${c.nombre}</span>
                ${c.duracion ? `<span class="carrera-duracion">⏱ ${c.duracion}</span>` : ''}
                ${c.area ? `<span class="carrera-area">${c.area}</span>` : ''}
            </div>`).join('');

        // Indicador de conexión
        const indicadorConexion = navigator.onLine ? '🟢 En línea' : '🔴 Sin conexión';

        let resenasHTML = '';
        
        // Envolver reseñas en un recuadro elegante
        let contenidoResenas = '';
        if (inst.resenas?.length) {
            contenidoResenas = inst.resenas.map(r => `
                <div class="resena-item">
                    <div class="resena-cab">
                        <strong>${r.autor}</strong>
                        <span class="resena-estrellas">${'⭐'.repeat(r.estrellas)}</span>
                    </div>
                    <p>${r.texto}</p>
                </div>`).join('');
        } else {
            contenidoResenas = '<p class="sin-resenas">Sin reseñas disponibles.</p>';
        }
        
        // Mostrar reseñas en un recuadro elegante con indicador
        resenasHTML = `
            <div class="bloque-resenas-container">
                <div class="resenas-header">
                    <span class="resenas-titulo">💬 Reseñas y Opiniones</span>
                    <span class="indicador-conexion">${indicadorConexion}</span>
                </div>
                <div class="resenas-contenido">
                    ${contenidoResenas}
                </div>
            </div>`;
        
        if (inst.LinkResenas) {
            resenasHTML += `
                <div class="modal-link-resenas" style="margin-top: 14px; text-align: center;">
                    <a href="${inst.LinkResenas}" target="_blank" rel="noopener noreferrer"
                       class="btn btn-secundario" style="display:inline-flex;align-items:center;gap:8px;">
                        📍 Ver reseñas en Google Maps ↗
                    </a>
                </div>`;
        }

        cuerpo.innerHTML = `
            <div class="modal-cab">
                <span class="tipo-badge tipo-${inst.tipo === 'Universidad' ? 'u' : 'i'}">${inst.tipo}</span>
                <h2 id="titulo-modal">${inst.nombre}</h2>
                <p class="modal-sub">${inst.sigla} · ${inst.ubicacion || ''}</p>
                <div class="modal-val">${estrellas} <span class="num-resenas">(${inst.numResenas || 0} reseñas)</span></div>
                ${inst.descripcion ? `<p class="modal-desc">${inst.descripcion}</p>` : ''}
            </div>

            <div class="modal-info-grid">
                <div class="modal-bloque">
                    <h3>📋 Información</h3>
                    <dl class="info-dl">
                        <dt>Modalidad</dt><dd>${inst.modalidad || '—'}</dd>
                        <dt>Costo mensual</dt><dd class="${(inst.costoMensual || 0) === 0 ? 'precio-gratis' : ''}">${precioTexto}</dd>
                        <dt>Inscripción</dt><dd>${inscripTexto}</dd>
                        <dt>Acreditación</dt><dd>${inst.acreditacion || '—'}</dd>
                        <dt>Becas</dt><dd>${inst.becas ? '✓ Disponibles' : '✗ No disponibles'}</dd>
                    </dl>
                </div>
                <div class="modal-bloque">
                    <h3>📞 Contacto</h3>
                    <div class="modal-contactos">
                        ${inst.telefono ? `<a href="tel:${inst.telefono}" class="contacto-link">📱 ${inst.telefono}</a>` : ''}
                        ${inst.email ? `<a href="mailto:${inst.email}" class="contacto-link">✉️ ${inst.email}</a>` : ''}
                        ${inst.web ? `<a href="${inst.web}" target="_blank" rel="noopener noreferrer" class="contacto-link">🌐 Sitio web ↗</a>` : ''}
                        ${!inst.telefono && !inst.email && !inst.web ? '<p>Sin datos de contacto.</p>' : ''}
                    </div>
                </div>
            </div>

            <div class="modal-bloque">
                <h3>🎓 Carreras <span class="num-carreras">(${(inst.carreras || []).length})</span></h3>
                <div class="grilla-carreras">${carrerasHTML}</div>
            </div>

            <div class="modal-bloque">
                ${resenasHTML}
            </div>

            <div class="modal-acciones">
                <button id="btn-fav-modal"
                    class="btn ${esFav ? 'btn-acento' : 'btn-secundario'}"
                    onclick="app.toggleFavorito(${id})">
                    ${esFav ? '❤️ En favoritos' : '🤍 Guardar'}
                </button>
                <button class="btn btn-primario" onclick="app.cerrarModal(); app.navegar('consulta')">
                    📨 Hacer consulta
                </button>
            </div>`;

        modal.dataset.instId = id;
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    },

    cerrarModal() {
        const modal = document.getElementById('modal-detalles');
        modal.classList.remove('visible');
        document.body.style.overflow = '';
        delete modal.dataset.instId;
    },

    _actualizarBtnFavModal(id) {
        const modal = document.getElementById('modal-detalles');
        if (!modal.classList.contains('visible') || parseInt(modal.dataset.instId) !== id) return;
        const btn = document.getElementById('btn-fav-modal');
        if (!btn) return;
        const esFav = estado.favoritos.has(id);
        btn.className = `btn ${esFav ? 'btn-acento' : 'btn-secundario'}`;
        btn.textContent = esFav ? '❤️ En favoritos' : '🤍 Guardar';
    },

    // ----------------------------------------
    // TEST VOCACIONAL
    // ----------------------------------------
    iniciarTest() {
        estado.puntajesTest = { ciencias: 0, social: 0, creativo: 0, negocios: 0, tecnologia: 0 };
        estado.preguntaActual = 0;

        document.getElementById('test-intro').style.display = 'none';
        document.getElementById('resultados-test').style.display = 'none';
        document.getElementById('contenedor-test').style.display = 'block';

        this._mostrarPregunta(0);
    },

    _mostrarPregunta(indice) {
        if (typeof PREGUNTAS_TEST === 'undefined') return;
        const pregunta = PREGUNTAS_TEST[indice];
        const total = PREGUNTAS_TEST.length;

        document.getElementById('num-pregunta').textContent = `Pregunta ${indice + 1} de ${total}`;
        document.getElementById('texto-pregunta').textContent = pregunta.texto;
        document.getElementById('relleno-progreso').style.width = `${(indice / total) * 100}%`;

        document.getElementById('contenedor-opciones').innerHTML = pregunta.opciones.map(op => `
            <button class="btn-opcion" onclick="app._responderPregunta('${op.perfil}')">
                ${op.texto}
            </button>`).join('');
    },

    _responderPregunta(perfil) {
        estado.puntajesTest[perfil] = (estado.puntajesTest[perfil] || 0) + 1;
        estado.preguntaActual++;

        if (typeof PREGUNTAS_TEST !== 'undefined' && estado.preguntaActual < PREGUNTAS_TEST.length) {
            this._mostrarPregunta(estado.preguntaActual);
        } else {
            this._mostrarResultadosTest();
        }
    },

    _mostrarResultadosTest() {
        document.getElementById('contenedor-test').style.display = 'none';
        if (typeof PERFILES_VOCACIONALES === 'undefined') return;

        const [perfilClave] = Object.entries(estado.puntajesTest).sort(([, a], [, b]) => b - a);
        const perfil = PERFILES_VOCACIONALES[perfilClave[0]];

        document.getElementById('resultado-perfil').textContent = `${perfil.emoji} ${perfil.nombre}`;
        document.getElementById('descripcion-perfil').textContent = perfil.descripcion;

        const sugeridas = estado.instituciones.filter(inst =>
            (inst.carreras || []).some(c =>
                perfil.carreras?.includes(c.nombre) || perfil.areasRelacionadas?.includes(c.area)
            )
        ).slice(0, 6);

        const grilla = document.getElementById('carreras-recomendadas');
        grilla.innerHTML = sugeridas.length > 0
            ? sugeridas.map(inst => this._htmlTarjeta(inst)).join('')
            : '<p class="sin-resultados">Explora la sección <strong>Explorar</strong> para ver todas las opciones.</p>';

        document.getElementById('resultados-test').style.display = 'block';
        document.getElementById('resultados-test').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    reiniciarTest() {
        document.getElementById('resultados-test').style.display = 'none';
        document.getElementById('contenedor-test').style.display = 'none';
        document.getElementById('test-intro').style.display = 'block';
    },

    // ----------------------------------------
    // FORMULARIO DE CONSULTA → GOOGLE SHEETS
    // enviarConsulta() viene de datos.js
    // ----------------------------------------
    async _enviarFormulario(e) {
        e.preventDefault();

        const campos = {
            nombre:        document.getElementById('f-nombre')?.value.trim(),
            telefono:      document.getElementById('f-telefono')?.value.trim(),
            email:         document.getElementById('f-email')?.value.trim(),
            institucion:   document.getElementById('f-institucion')?.value,
            carrera:       document.getElementById('f-carrera')?.value.trim(),
            mensaje:       document.getElementById('f-mensaje')?.value.trim(),
            consentimiento: document.getElementById('f-consentimiento')?.checked,
            fecha:         new Date().toLocaleString('es-BO'),
        };

        // Limpiar errores previos
        document.querySelectorAll('.error-campo').forEach(el => { el.textContent = ''; el.hidden = true; });

        // Validación
        const errores = [];
        if (!campos.nombre)    errores.push(['error-nombre',   'El nombre es obligatorio.']);
        if (!campos.telefono)  errores.push(['error-telefono', 'El teléfono es obligatorio.']);
        if (campos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email))
            errores.push(['error-email', 'El email no tiene formato válido.']);
        if (!campos.mensaje)   errores.push(['error-mensaje',  'El mensaje es obligatorio.']);
        if (!campos.consentimiento) errores.push(['error-consentimiento', 'Debes aceptar para continuar.']);

        if (errores.length > 0) {
            errores.forEach(([id, msg]) => {
                const el = document.getElementById(id);
                if (el) { el.textContent = msg; el.hidden = false; }
            });
            return;
        }

        const btn = document.querySelector('#formulario-consulta [type="submit"]');
        const txtBtn = document.getElementById('texto-btn-enviar');
        if (btn) btn.disabled = true;
        if (txtBtn) txtBtn.textContent = '⏳ Enviando...';

        // enviarConsulta() viene de datos.js — envía accion=nuevaConsulta
        const resultado = await enviarConsulta(campos);

        if (btn) btn.disabled = false;
        if (txtBtn) txtBtn.textContent = '📨 Enviar Consulta';

        const msgEl = document.getElementById('msg-formulario');
        if (resultado.exito) {
            msgEl.className = 'msg-formulario msg-exito';
            msgEl.textContent = '✅ ¡Consulta enviada! Te contactaremos pronto.';
            document.getElementById('formulario-consulta').reset();
        } else {
            msgEl.className = 'msg-formulario msg-error';
            msgEl.textContent = '❌ Error al enviar. Intenta de nuevo.';
        }
        setTimeout(() => { if (msgEl) { msgEl.textContent = ''; msgEl.className = 'msg-formulario'; } }, 6000);
    },

    // ----------------------------------------
    // TOAST NOTIFICATIONS
    // ----------------------------------------
    _toast(mensaje, tipo = 'info') {
        const contenedor = document.getElementById('contenedor-toast');
        if (!contenedor) return;

        const iconos = { exito: '✅', info: 'ℹ️', advertencia: '⚠️', error: '❌' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `<span>${iconos[tipo] || 'ℹ️'}</span><span>${mensaje}</span>`;
        contenedor.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('visible'));
        });

        setTimeout(() => {
            toast.classList.remove('visible');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3000);
    },

    // ----------------------------------------
    // HELPERS
    // ----------------------------------------
    _generarEstrellas(val) {
        const llenas = Math.floor(val);
        const media = (val % 1) >= 0.5 ? 1 : 0;
        const vacias = 5 - llenas - media;
        return `<span class="estrellas">${'★'.repeat(llenas)}${media ? '½' : ''}${'☆'.repeat(vacias)}</span>`;
    },

    _actualizarContadores() {
        const cc = document.getElementById('contador-comparar');
        const cf = document.getElementById('contador-favoritos');
        if (cc) cc.textContent = estado.comparar.size;
        if (cf) cf.textContent = estado.favoritos.size;
    },

    _llenarSelectInstituciones() {
        const select = document.getElementById('f-institucion');
        if (!select) return;
        // Limpiar opciones anteriores excepto la primera
        while (select.options.length > 1) select.remove(1);
        estado.instituciones.forEach(inst => {
            const op = document.createElement('option');
            op.value = inst.nombre;
            op.textContent = `${inst.sigla} — ${inst.nombre}`;
            select.appendChild(op);
        });
    },

    _refrescarVistaActual() {
        const id = document.querySelector('.vista.activa')?.id;
        if (id === 'explorar') this._renderizarGrilla('grilla-instituciones', estado.institucionesFiltradas);
        if (id === 'favoritos') this.renderizarFavoritos();
        if (id === 'comparar') this.renderizarComparar();
    },

    _htmlCargando() {
        return `<div class="estado-cargando"><div class="spinner"></div><p>Cargando datos...</p></div>`;
    },

    // ----------------------------------------
    // PERSISTENCIA LOCAL
    // ----------------------------------------
    _guardarEstadoLocal() {
        try {
            localStorage.setItem('etf_favs', JSON.stringify([...estado.favoritos]));
            localStorage.setItem('etf_comp', JSON.stringify([...estado.comparar]));
        } catch (_) {}
    },

    _cargarEstadoLocal() {
        try {
            const f = localStorage.getItem('etf_favs');
            const c = localStorage.getItem('etf_comp');
            if (f) {
                const arr = JSON.parse(f);
                estado.favoritos = new Set(Array.isArray(arr) ? arr.filter(id => id !== null && id !== undefined && id !== '') : []);
            }
            if (c) {
                const arr = JSON.parse(c);
                estado.comparar = new Set(Array.isArray(arr) ? arr.filter(id => id !== null && id !== undefined && id !== '') : []);
            }
        } catch (_) {}
    },

    // ----------------------------------------
    // REGISTRO DE EVENTOS
    // ----------------------------------------
    _registrarEventos() {
        // Navegación
        document.querySelectorAll('[data-ruta]').forEach(el => {
            el.addEventListener('click', e => { e.preventDefault(); this.navegar(el.dataset.ruta); });
        });

        // Menú móvil
        document.getElementById('btn-menu-movil')?.addEventListener('click', () => {
            const nav = document.getElementById('enlaces-nav');
            const abierto = nav.classList.toggle('activo');
            document.getElementById('btn-menu-movil').setAttribute('aria-expanded', String(abierto));
            document.getElementById('btn-menu-movil').textContent = abierto ? '✕' : '☰';
        });

        // Cambio de tema
        document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTema());

        // Indicador de conexión y eventos de sincronización (Supabase)
        this._actualizarIndicadorConexion();
        window.addEventListener('online', () => this._actualizarIndicadorConexion());
        window.addEventListener('offline', () => this._actualizarIndicadorConexion());

        window.addEventListener('etf:datosFrescos', (e) => {
            console.log("⚡ Evento etf:datosFrescos recibido. Actualizando estado...");
            if (e.detail && Array.isArray(e.detail.instituciones)) {
                estado.instituciones = e.detail.instituciones;
                estado.institucionesFiltradas = [...estado.instituciones];
                this._actualizarEstadisticasInicio();
                this._llenarSelectInstituciones();
                this._refrescarVistaActual();
            }
            this._actualizarIndicadorConexion();
        });

        window.addEventListener('etf:sincronizado', () => {
            this._toast('Cambios offline sincronizados con Supabase', 'exito');
            this._actualizarIndicadorConexion();
        });

        // Filtros con debounce
        const debounceFiltros = this._debounce(() => this._aplicarFiltros(), 280);
        document.getElementById('input-busqueda')?.addEventListener('input', debounceFiltros);
        document.getElementById('filtro-tipo')?.addEventListener('change', () => this._aplicarFiltros());
        document.getElementById('filtro-modalidad')?.addEventListener('change', () => this._aplicarFiltros());
        document.getElementById('filtro-precio')?.addEventListener('input', debounceFiltros);

        // Modal: cerrar con clic fuera y ESC
        document.getElementById('modal-detalles')?.addEventListener('click', e => {
            if (e.target === document.getElementById('modal-detalles')) this.cerrarModal();
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') this.cerrarModal(); });

        // Formulario de consulta
        document.getElementById('formulario-consulta')?.addEventListener('submit', e => this._enviarFormulario(e));
    },

    // ----------------------------------------
    // MÉTODOS DEL PANEL ADMINISTRATIVO Y EDITOR EXCEL
    // ----------------------------------------
    
    columnasExcel: [
        { clave: 'acciones_fila', titulo: 'Acción', readonly: true },
        { clave: 'id', titulo: 'ID', readonly: true },
        { clave: 'nombre', titulo: 'Nombre *', required: true },
        { clave: 'sigla', titulo: 'Sigla' },
        { clave: 'tipo', titulo: 'Tipo', type: 'select', opciones: ['Universidad', 'Instituto'] },
        { clave: 'ubicacion', titulo: 'Ubicación' },
        { clave: 'modalidad', titulo: 'Modalidad', type: 'select', opciones: ['Presencial', 'Virtual', 'Semi-presencial'] },
        { clave: 'costoMensual', titulo: 'Costo Mensual (Bs)', type: 'number' },
        { clave: 'costoInscripcion', titulo: 'Costo Inscripción (Bs)', type: 'number' },
        { clave: 'becas', titulo: 'Becas', type: 'boolean' },
        { clave: 'acreditacion', titulo: 'Acreditación' },
        { clave: 'carreras', titulo: 'Carreras (sep. por comas)' },
        { clave: 'tags', titulo: 'Etiquetas/Tags (sep. por comas)' },
        { clave: 'telefono', titulo: 'Teléfono' },
        { clave: 'email', titulo: 'Email' },
        { clave: 'web', titulo: 'Sitio Web' },
        { clave: 'LinkResenas', titulo: 'Link Reseñas' },
        { clave: 'descripcion', titulo: 'Descripción' },
        { clave: 'valoracion', titulo: 'Valoración (1-5)', type: 'number' },
        { clave: 'numResenas', titulo: 'Num Reseñas', type: 'number' }
    ],

    inicializarExcelAdmin() {
        console.log('📊 Inicializando Editor Excel...');
        estado.excel.cambiosPendientes = new Map();
        estado.excel.idsEliminados = new Set();
        // Hacemos una copia profunda de las instituciones de estado.instituciones
        estado.excel.datos = JSON.parse(JSON.stringify(estado.instituciones || []));
        
        this.cambiarSubVistaAdmin(estado.excel.subVista || 'excel');
        this.actualizarBadgesBotonesExcel();
    },

    cambiarSubVistaAdmin(subvista) {
        estado.excel.subVista = subvista;
        
        // Manejar estilo activo en las pestañas
        document.querySelectorAll('.btn-admin-tab').forEach(btn => {
            btn.classList.remove('activo');
        });
        
        const tabs = document.querySelectorAll('.btn-admin-tab');
        if (subvista === 'excel' && tabs[0]) tabs[0].classList.add('activo');
        if (subvista === 'consultas' && tabs[1]) tabs[1].classList.add('activo');

        // Mostrar u ocultar las subvistas
        const excelSection = document.getElementById('subvista-admin-excel');
        const consultasSection = document.getElementById('subvista-admin-consultas');

        if (excelSection && consultasSection) {
            if (subvista === 'excel') {
                excelSection.style.display = 'block';
                consultasSection.style.display = 'none';
                this.renderizarExcelGrid();
            } else {
                excelSection.style.display = 'none';
                consultasSection.style.display = 'block';
                this.cargarConsultasAdminUI();
            }
        }
    },

    renderizarExcelGrid() {
        const cabecerasRow = document.getElementById('tabla-excel-cabeceras');
        const cuerpoRow = document.getElementById('tabla-excel-cuerpo');
        if (!cabecerasRow || !cuerpoRow) return;

        // 1. Renderizar Cabeceras
        cabecerasRow.innerHTML = this.columnasExcel.map(col => `
            <th>${col.titulo}</th>
        `).join('');

        // 2. Renderizar Cuerpo de la Tabla
        if (estado.excel.datos.length === 0) {
            cuerpoRow.innerHTML = `
                <tr>
                    <td colspan="${this.columnasExcel.length}" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        No hay instituciones en la base de datos. Haz clic en "Añadir Fila" para comenzar.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpoRow.innerHTML = estado.excel.datos.map(row => {
            // Si está marcada como eliminada localmente, no la mostramos en la grilla
            if (estado.excel.idsEliminados.has(row.id)) return '';

            const celdasHTML = this.columnasExcel.map(col => {
                const clave = col.clave;
                let valor = row[clave] !== undefined ? row[clave] : '';

                // Formatos especiales
                if (clave === 'acciones_fila') {
                    return `<td style="text-align:center; padding: 4px;">
                        <button class="btn btn-sm" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px;" onclick="app.eliminarFilaExcelGrid('${row.id}')" title="Eliminar fila">🗑️</button>
                    </td>`;
                }
                
                if (clave === 'id') {
                    const idMostrar = String(row.id).startsWith('temp-') ? '🆕' : row.id;
                    return `<td style="text-align:center; font-weight:700; background:var(--bg-elevated); color:var(--text-secondary);">${idMostrar}</td>`;
                }

                if (col.type === 'boolean') {
                    const isChecked = valor === true ? 'checked' : '';
                    return `<td style="text-align:center;">
                        <input type="checkbox" ${isChecked} onchange="app.editarCeldaExcel('${row.id}', '${clave}', this)">
                    </td>`;
                }

                if (col.type === 'select') {
                    const opcionesHTML = (col.opciones || []).map(op => {
                        const isSelected = valor === op ? 'selected' : '';
                        return `<option value="${op}" ${isSelected}>${op}</option>`;
                    }).join('');
                    return `<td style="padding: 2px;">
                        <select style="width:100%; border:none; background:transparent; color:var(--text-primary); font-family:var(--font-main); padding: 4px 6px;" onchange="app.editarCeldaExcel('${row.id}', '${clave}', this)">
                            ${opcionesHTML}
                        </select>
                    </td>`;
                }

                if (clave === 'carreras') {
                    valor = Array.isArray(valor) ? valor.map(c => c.nombre || c).join(', ') : (valor || '');
                } else if (clave === 'tags') {
                    valor = Array.isArray(valor) ? valor.join(', ') : (valor || '');
                }

                // Celdas normales editables (span o texto crudo)
                const isNumeric = col.type === 'number' ? 'inputmode="decimal"' : '';
                return `<td>
                    <div class="celda-editable" contenteditable="true" ${isNumeric} onblur="app.editarCeldaExcel('${row.id}', '${clave}', this)">${valor}</div>
                </td>`;
            }).join('');

            return `<tr>${celdasHTML}</tr>`;
        }).join('');
    },

    editarCeldaExcel(rowId, clave, elemento) {
        // Encontrar la fila correspondiente en nuestros datos de trabajo
        const row = estado.excel.datos.find(r => String(r.id) === String(rowId));
        if (!row) return;

        let valorNuevo;

        if (elemento.type === 'checkbox') {
            valorNuevo = elemento.checked;
        } else if (elemento.tagName === 'SELECT') {
            valorNuevo = elemento.value;
        } else {
            // Es un div con contenteditable
            valorNuevo = elemento.innerText.trim();
        }

        // Conversión de tipos según la clave
        const colDef = this.columnasExcel.find(c => c.clave === clave);
        if (colDef && colDef.type === 'number') {
            valorNuevo = valorNuevo === '' ? 0 : parseFloat(valorNuevo);
            if (isNaN(valorNuevo)) valorNuevo = 0;
        }

        if (clave === 'carreras') {
            valorNuevo = valorNuevo === '' 
                ? [] 
                : valorNuevo.split(',').map(c => ({ nombre: c.trim(), duracion: '', area: '' }));
        } else if (clave === 'tags') {
            valorNuevo = valorNuevo === '' 
                ? [] 
                : valorNuevo.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        // Comprobar si realmente hubo un cambio para no registrar cambios innecesarios
        // (Conversión simple a string para arrays/objetos)
        const valorViejoStr = typeof row[clave] === 'object' ? JSON.stringify(row[clave]) : String(row[clave]);
        const valorNuevoStr = typeof valorNuevo === 'object' ? JSON.stringify(valorNuevo) : String(valorNuevo);

        if (valorViejoStr === valorNuevoStr) return;

        // Actualizar el valor en nuestra copia local de trabajo
        row[clave] = valorNuevo;

        // Registrar en los cambios pendientes
        estado.excel.cambiosPendientes.set(rowId, row);
        
        this.actualizarBadgesBotonesExcel();
    },

    agregarFilaExcel() {
        const idTemp = `temp-${Date.now()}`;
        const nuevaFila = {
            id: idTemp,
            nombre: 'Nueva Institución',
            sigla: '',
            tipo: 'Universidad',
            ubicacion: 'Santa Cruz de la Sierra',
            descripcion: '',
            telefono: '',
            email: '',
            web: '',
            LinkResenas: '',
            costoMensual: 0,
            costoInscripcion: 0,
            carreras: [],
            becas: false,
            modalidad: 'Presencial',
            acreditacion: '',
            tags: [],
            valoracion: 4.0,
            numResenas: 0
        };

        // Agregar al inicio para fácil visibilidad
        estado.excel.datos.unshift(nuevaFila);
        estado.excel.cambiosPendientes.set(idTemp, nuevaFila);

        this.renderizarExcelGrid();
        this.actualizarBadgesBotonesExcel();
        this._toast('Fila nueva añadida al inicio', 'info');
    },

    eliminarFilaExcelGrid(rowId) {
        // Si el ID es temporal (nueva fila no guardada), simplemente la removemos de la memoria
        if (String(rowId).startsWith('temp-')) {
            estado.excel.datos = estado.excel.datos.filter(r => String(r.id) !== String(rowId));
            estado.excel.cambiosPendientes.delete(rowId);
        } else {
            // Si es un ID real de la base de datos, lo marcamos para eliminar
            estado.excel.idsEliminados.add(parseInt(rowId));
            // También lo removemos de cambios pendientes por si se editó antes de borrar
            estado.excel.cambiosPendientes.delete(rowId);
        }

        this.renderizarExcelGrid();
        this.actualizarBadgesBotonesExcel();
        this._toast('Fila eliminada visualmente. Guarda para aplicar.', 'advertencia');
    },

    actualizarBadgesBotonesExcel() {
        const count = estado.excel.cambiosPendientes.size + estado.excel.idsEliminados.size;
        const badge = document.getElementById('cambios-pendientes-badge');
        const btnGuardar = document.getElementById('btn-guardar-excel');

        if (badge && btnGuardar) {
            if (count > 0) {
                badge.textContent = `${count} cambio(s) pendiente(s)`;
                badge.style.display = 'inline-block';
                btnGuardar.disabled = false;
                btnGuardar.classList.add('btn-acento');
            } else {
                badge.style.display = 'none';
                btnGuardar.disabled = true;
            }
        }
    },

    async guardarCambiosExcel() {
        const btnGuardar = document.getElementById('btn-guardar-excel');
        const originalText = btnGuardar ? btnGuardar.innerHTML : '';
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '⏳ Guardando...';
        }

        try {
            const modificados = Array.from(estado.excel.cambiosPendientes.values());
            const eliminados = Array.from(estado.excel.idsEliminados);

            // Validar campos obligatorios (nombre de instituciones)
            const sinNombre = modificados.some(r => !r.nombre || r.nombre.trim() === 'Nueva Institución' || r.nombre.trim() === '');
            if (sinNombre) {
                this._toast('Por favor, proporciona un nombre válido para todas las instituciones nuevas/modificadas', 'error');
                if (btnGuardar) {
                    btnGuardar.disabled = false;
                    btnGuardar.innerHTML = originalText;
                }
                return;
            }

            // Llamamos a la función de datos.js para persistir en Supabase
            await guardarCambiosExcel(modificados, eliminados);

            this._toast('¡Base de datos de Supabase actualizada exitosamente!', 'exito');

            // 1. Recargar datos principales de la app
            estado.cargando = true;
            const resultado = await cargarDatos();
            if (resultado && resultado.instituciones) {
                estado.instituciones = resultado.instituciones;
                estado.institucionesFiltradas = [...estado.instituciones];
            }
            estado.cargando = false;

            // 2. Reiniciar el panel de administración
            this.inicializarExcelAdmin();
            
            // 3. Actualizar vistas normales de la página
            this._actualizarEstadisticasInicio();
            this._llenarSelectInstituciones();
            this._refrescarVistaActual();

        } catch (error) {
            console.error('Error al guardar cambios Excel en Supabase:', error);
            this._toast(`Error al guardar: ${error.message || error}`, 'error');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = originalText;
            }
        }
    },

    recargarDatosExcel() {
        const count = estado.excel.cambiosPendientes.size + estado.excel.idsEliminados.size;
        if (count > 0 && !confirm('Tienes cambios sin guardar en la tabla. ¿Estás seguro de que deseas recargar y perder tus cambios?')) {
            return;
        }
        this.inicializarExcelAdmin();
        this._toast('Editor Excel recargado desde Supabase', 'info');
    },

    // ----------------------------------------
    // MÉTODOS DE LA SUBVISTA CONSULTAS RECIBIDAS
    // ----------------------------------------

    async cargarConsultasAdminUI() {
        const cuerpo = document.getElementById('tabla-consultas-cuerpo');
        if (!cuerpo) return;

        cuerpo.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 2rem;"><div class="spinner" style="margin:0 auto 10px;"></div>Cargando consultas desde Supabase...</td></tr>`;

        try {
            const consultas = await cargarConsultasAdmin();

            if (consultas.length === 0) {
                cuerpo.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 2rem; color: var(--text-muted);">No has recibido ninguna consulta aún.</td></tr>`;
                return;
            }

            cuerpo.innerHTML = consultas.map(c => {
                const fechaStr = new Date(c.fecha).toLocaleString('es-BO');
                return `
                    <tr>
                        <td style="text-align:center;">
                            <button class="btn btn-sm" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px;" onclick="app.eliminarConsultaUI(${c.id})">🗑️ Borrar</button>
                        </td>
                        <td style="white-space:nowrap; font-size:0.82rem;">${fechaStr}</td>
                        <td style="font-weight:600;">${escapeHtml(c.nombre)}</td>
                        <td><a href="tel:${c.telefono}" style="color:var(--primary); text-decoration:none;">📞 ${c.telefono}</a></td>
                        <td>${c.email ? `<a href="mailto:${c.email}" style="color:var(--primary); text-decoration:none;">✉️ ${c.email}</a>` : '—'}</td>
                        <td style="font-weight:500;">${c.institucion ? escapeHtml(c.institucion) : '—'}</td>
                        <td>${c.carrera ? escapeHtml(c.carrera) : '—'}</td>
                        <td style="max-width:250px; font-size:0.85rem; line-height:1.4;">${escapeHtml(c.mensaje)}</td>
                        <td style="text-align:center; font-weight:700; color:${c.consentimiento ? 'var(--success)' : '#ef4444'}">${c.consentimiento ? 'SÍ' : 'NO'}</td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error(error);
            cuerpo.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 2rem; color: #ef4444;">Error al cargar las consultas. Verifica tu conexión.</td></tr>`;
        }
    },

    async recargarConsultasAdmin() {
        this.cargarConsultasAdminUI();
        this._toast('Consultas recargadas desde Supabase', 'info');
    },

    async eliminarConsultaUI(id) {
        if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta consulta de la base de datos de Supabase?')) {
            const exito = await eliminarConsultaAdmin(id);
            if (exito) {
                this._toast('Consulta eliminada', 'exito');
                this.cargarConsultasAdminUI();
            } else {
                this._toast('Error al eliminar la consulta', 'error');
            }
        }
    },

    _debounce(fn, ms) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
    },

    // ----------------------------------------
    // GESTIÓN DE TEMA (CLARO/OSCURO)
    // ----------------------------------------
    _cargarTema() {
        const tema = localStorage.getItem('etf_tema') || 'light';
        document.documentElement.setAttribute('data-theme', tema);
        this._actualizarIconoTema(tema);
    },

    toggleTema() {
        const actual = document.documentElement.getAttribute('data-theme') || 'light';
        const nuevo = actual === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nuevo);
        localStorage.setItem('etf_tema', nuevo);
        this._actualizarIconoTema(nuevo);
    },

    _actualizarIconoTema(tema) {
        const btn = document.getElementById('btn-theme-toggle');
        if (btn) {
            btn.textContent = tema === 'dark' ? '☀️' : '🌙';
            btn.setAttribute('aria-label', tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        }
    },

    // ----------------------------------------
    // INDICADOR DE CONEXIÓN
    // ----------------------------------------
    _actualizarIndicadorConexion() {
        const indicador = document.getElementById('conexion-status');
        if (!indicador) return;

        if (navigator.onLine) {
            if (typeof hayPendientes === 'function' && hayPendientes()) {
                indicador.textContent = '🟡 Sincronizando...';
                indicador.className = 'status-indicator cache';
            } else if (estado.instituciones && estado.instituciones.length > 0) {
                indicador.textContent = '🟢 En línea';
                indicador.className = 'status-indicator';
            } else {
                indicador.textContent = '🟢 En línea';
                indicador.className = 'status-indicator';
            }
        } else {
            indicador.textContent = '🔴 Sin conexión';
            indicador.className = 'status-indicator offline';
        }
    }
};

// =============================================
// ARRANCAR
// =============================================
document.addEventListener('DOMContentLoaded', () => app.iniciar());
