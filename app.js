/**
 * SetupVault - Lógica de Negocio y Manipulación del DOM
 * Arquitectura: Módulo IIFE (Immediately Invoked Function Expression) para encapsulación.
 * Enfoque en Ciberseguridad (Prevención XSS) y rendimiento.
 */

(function () {
    'use strict';

    // ==========================================
    // 1. ESTADO DE LA APLICACIÓN (STATE)
    // ==========================================
    
    // Arreglo central que almacena los artículos del setup
    let setupItems = [];
    let mainBudget = 0;
    let editingId = null; // ID del artículo en edición
    const STORAGE_KEY = 'setupVault_items';
    const BUDGET_KEY = 'setupVault_budget';

    // ==========================================
    // 2. REFERENCIAS AL DOM
    // ==========================================
    const form = document.getElementById('setup-form');
    const inputName = document.getElementById('item-name');
    const inputPrice = document.getElementById('item-price');
    const inputPriority = document.getElementById('item-priority');
    
    const errorName = document.getElementById('error-name');
    const errorPrice = document.getElementById('error-price');
    const errorPriority = document.getElementById('error-priority');
    
    const itemsGrid = document.getElementById('items-grid');
    const emptyState = document.getElementById('empty-state');
    const totalAmountEl = document.getElementById('total-amount');
    
    // Controles de Presupuesto
    const inputMainBudget = document.getElementById('main-budget-input');
    const btnSaveBudget = document.getElementById('btn-save-budget');
    const budgetBalanceEl = document.getElementById('budget-balance');
    
    // Botones de acción general
    const btnSubmit = document.querySelector('.btn-submit');
    const btnExportJson = document.getElementById('btn-export-json');
    const btnHardReset = document.getElementById('btn-hard-reset');
    const modalReset = document.getElementById('modal-reset');
    const btnCancelReset = document.getElementById('btn-cancel-reset');
    const btnConfirmReset = document.getElementById('btn-confirm-reset');

    // ==========================================
    // 3. INICIALIZACIÓN
    // ==========================================
    function init() {
        cargarDatos();
        configurarEventos();
        renderizarLista();
    }

    // ==========================================
    // 4. PERSISTENCIA DE DATOS (LOCALSTORAGE)
    // ==========================================
    
    /**
     * Carga los datos desde localStorage de forma segura.
     */
    function cargarDatos() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                setupItems = JSON.parse(data);
            }
            
            const budgetData = localStorage.getItem(BUDGET_KEY);
            if (budgetData) {
                mainBudget = parseFloat(budgetData);
                inputMainBudget.value = mainBudget;
            }
        } catch (error) {
            console.error('Error al parsear los datos locales:', error);
            setupItems = []; // Fallback a estado limpio
            mainBudget = 0;
        }
    }

    /**
     * Guarda el estado actual en localStorage.
     */
    function guardarDatos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(setupItems));
    }

    // ==========================================
    // 5. VALIDACIONES Y SEGURIDAD
    // ==========================================

    /**
     * Limpia los mensajes de error visuales en el DOM.
     */
    function limpiarErrores() {
        errorName.textContent = '';
        errorPrice.textContent = '';
        errorPriority.textContent = '';
    }

    /**
     * Sanitiza el string eliminando espacios múltiples y recortando bordes.
     * @param {string} str 
     * @returns {string} String sanitizado
     */
    function sanitizarTexto(str) {
        return str.trim().replace(/\s+/g, ' ');
    }

    /**
     * Valida los inputs del formulario usando Regex y reglas lógicas.
     * Muestra errores en el DOM sin usar alert().
     * @returns {boolean} true si es válido, false si hay errores.
     */
    function validarFormulario() {
        limpiarErrores();
        let esValido = true;

        const nombre = sanitizarTexto(inputName.value);
        const precio = parseFloat(inputPrice.value);
        const prioridad = inputPriority.value;

        // Validar Nombre: Sólo letras, números, espacios y guiones permitidos (Regex de seguridad)
        // Evita el ingreso de caracteres extraños que podrían intentar inyección de código.
        const regexNombre = /^[a-zA-Z0-9\s\-]+$/;
        
        if (nombre.length === 0) {
            errorName.textContent = 'El nombre no puede estar vacío.';
            esValido = false;
        } else if (!regexNombre.test(nombre)) {
            errorName.textContent = 'El nombre solo debe contener letras, números y guiones.';
            esValido = false;
        }

        // Validar Precio: Debe ser estrictamente mayor a 0 y un número válido.
        if (isNaN(precio) || precio <= 0) {
            errorPrice.textContent = 'El precio debe ser un número mayor a 0.';
            esValido = false;
        }

        // Validar Prioridad: Debe estar seleccionada.
        if (!prioridad) {
            errorPriority.textContent = 'Debes seleccionar una prioridad.';
            esValido = false;
        }

        return esValido;
    }

    // ==========================================
    // 6. LÓGICA DE NEGOCIO (CRUD)
    // ==========================================

    /**
     * Crea un nuevo artículo o actualiza uno existente y lo añade al estado.
     */
    function agregarArticulo(e) {
        e.preventDefault(); // Evita recarga de la página

        if (!validarFormulario()) {
            return; // Si no pasa la validación, aborta
        }

        const nombreLimpio = sanitizarTexto(inputName.value);
        const precioLimpio = parseFloat(inputPrice.value);
        const prioridadLimpia = inputPriority.value;

        if (editingId) {
            // MODO EDICIÓN
            const index = setupItems.findIndex(item => item.id === editingId);
            if (index !== -1) {
                setupItems[index] = {
                    id: editingId,
                    nombre: nombreLimpio,
                    precio: precioLimpio,
                    prioridad: prioridadLimpia
                };
            }
            // Restaurar estado del formulario
            editingId = null;
            btnSubmit.innerHTML = '<i class="ph ph-plus-circle"></i> Agregar al Presupuesto';
            btnSubmit.style.backgroundColor = 'var(--color-planificada)';
        } else {
            // MODO CREACIÓN
            const nuevoArticulo = {
                id: crypto.randomUUID(), // ID único nativo seguro
                nombre: nombreLimpio,
                precio: precioLimpio,
                prioridad: prioridadLimpia
            };
            setupItems.push(nuevoArticulo);
        }

        guardarDatos();
        renderizarLista();
        
        form.reset(); // Limpia el formulario
        inputName.focus(); // Mejora de UX (Devuelve el foco)
    }

    /**
     * Carga un artículo en el formulario para ser editado.
     * @param {string} id - UUID del artículo a editar.
     */
    function cargarParaEdicion(id) {
        const articulo = setupItems.find(item => item.id === id);
        if (articulo) {
            inputName.value = articulo.nombre;
            inputPrice.value = articulo.precio;
            inputPriority.value = articulo.prioridad;
            editingId = id;
            
            // Cambiar la UI del botón para indicar edición
            btnSubmit.innerHTML = '<i class="ph ph-floppy-disk"></i> Guardar Cambios';
            btnSubmit.style.backgroundColor = 'var(--color-urgente)'; // Llama la atención sobre la edición activa
            inputName.focus();
        }
    }

    /**
     * Elimina un artículo del arreglo buscando por su ID.
     * @param {string} id - UUID del artículo a borrar.
     */
    function eliminarArticulo(id) {
        setupItems = setupItems.filter(item => item.id !== id);
        guardarDatos();
        renderizarLista();
    }

    /**
     * Obtiene el presupuesto total sumando los precios usando .reduce()
     * @returns {number} Suma total
     */
    function obtenerPresupuestoTotal() {
        return setupItems.reduce((total, item) => total + item.precio, 0);
    }

    /**
     * Guarda el presupuesto principal introducido por el usuario.
     */
    function guardarPresupuestoPrincipal() {
        const valor = parseFloat(inputMainBudget.value);
        if (!isNaN(valor) && valor >= 0) {
            mainBudget = valor;
            localStorage.setItem(BUDGET_KEY, mainBudget.toString());
            renderizarLista(); // Re-renderizar para actualizar el balance
        }
    }

    /**
     * Exporta los datos actuales a un archivo JSON de forma segura.
     */
    function exportarAJSON() {
        const dataExport = {
            presupuesto_principal: mainBudget,
            articulos: setupItems,
            fecha_exportacion: new Date().toISOString()
        };

        const jsonString = JSON.stringify(dataExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `SetupVault_Backup_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Limpieza de memoria
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ==========================================
    // 7. MANIPULACIÓN DEL DOM (RENDERIZADO SEGURO)
    // ==========================================

    /**
     * Renderiza la lista de elementos en el Grid.
     * OBLIGATORIO: Uso de document.createElement y textContent para evitar vulnerabilidades XSS.
     * Prohibido estrictamente innerHTML para datos que vienen del usuario.
     */
    function renderizarLista() {
        // Limpiar contenedor seguro
        itemsGrid.replaceChildren();

        // Calcular y mostrar presupuesto
        const total = obtenerPresupuestoTotal();
        const formateadorCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });
        
        totalAmountEl.textContent = formateadorCLP.format(total);

        // Actualizar balance comparativo con el presupuesto principal
        if (mainBudget > 0) {
            const diferencia = mainBudget - total;
            budgetBalanceEl.className = 'budget-balance'; // Limpiar clases
            
            if (diferencia >= 0) {
                budgetBalanceEl.textContent = `Restante: ${formateadorCLP.format(diferencia)}`;
                budgetBalanceEl.classList.add('balance-positive');
            } else {
                budgetBalanceEl.textContent = `Excedido por: ${formateadorCLP.format(Math.abs(diferencia))}`;
                budgetBalanceEl.classList.add('balance-negative');
            }
        } else {
            budgetBalanceEl.textContent = "Ingresa tu presupuesto total";
            budgetBalanceEl.className = 'budget-balance';
        }

        // Manejar estado vacío
        if (setupItems.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        // ORDENAMIENTO: Mostrar "Urgente" primero.
        // Asignamos pesos temporales: Urgente = 1, Planificada = 2, Deseo = 3
        const ordenPrioridad = {
            'Urgente': 1,
            'Planificada': 2,
            'Deseo': 3
        };

        // Clonamos el array para no mutar el original en el sort
        const itemsOrdenados = [...setupItems].sort((a, b) => {
            return ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad];
        });

        // Creación segura de elementos del DOM
        itemsOrdenados.forEach(item => {
            // Contenedor principal de la tarjeta
            const card = document.createElement('div');
            card.classList.add('item-card');
            card.setAttribute('data-priority', item.prioridad); // Atributo para CSS

            // Cabecera (Nombre y Badge)
            const header = document.createElement('div');
            header.classList.add('item-header');

            const title = document.createElement('h3');
            title.classList.add('item-name');
            title.textContent = item.nombre; // Seguro contra XSS

            const badge = document.createElement('span');
            badge.classList.add('item-priority-badge', `badge-${item.prioridad.toLowerCase()}`);
            badge.textContent = item.prioridad;

            header.appendChild(title);
            header.appendChild(badge);

            // Precio
            const priceEl = document.createElement('div');
            priceEl.classList.add('item-price');
            priceEl.textContent = new Intl.NumberFormat('es-CL', { 
                style: 'currency', 
                currency: 'CLP' 
            }).format(item.precio);

            // Contenedor de Botones (Acciones)
            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('item-actions');

            // Botón Editar
            const btnEdit = document.createElement('button');
            btnEdit.classList.add('btn-edit-item');
            btnEdit.setAttribute('aria-label', `Editar ${item.nombre}`);
            btnEdit.setAttribute('data-id', item.id);
            const iconEdit = document.createElement('i');
            iconEdit.classList.add('ph', 'ph-pencil');
            btnEdit.appendChild(iconEdit);

            // Botón Eliminar
            const btnDelete = document.createElement('button');
            btnDelete.classList.add('btn-delete-item');
            btnDelete.setAttribute('aria-label', `Eliminar ${item.nombre}`);
            btnDelete.setAttribute('data-id', item.id); // Identificador para Event Delegation
            const iconDelete = document.createElement('i');
            iconDelete.classList.add('ph', 'ph-trash');
            btnDelete.appendChild(iconDelete);

            actionsContainer.appendChild(btnEdit);
            actionsContainer.appendChild(btnDelete);

            // Agrupando contenido
            card.appendChild(header);
            card.appendChild(priceEl);
            card.appendChild(actionsContainer);

            // Insertar tarjeta en el Grid
            itemsGrid.appendChild(card);
        });
    }

    // ==========================================
    // 8. FUNCIONES DEL MODAL (HARD RESET)
    // ==========================================

    function abrirModal() {
        modalReset.classList.remove('hidden');
        modalReset.setAttribute('aria-hidden', 'false');
    }

    function cerrarModal() {
        modalReset.classList.add('hidden');
        modalReset.setAttribute('aria-hidden', 'true');
    }

    function ejecutarHardReset() {
        localStorage.removeItem(STORAGE_KEY);
        setupItems = [];
        renderizarLista();
        cerrarModal();
    }

    // ==========================================
    // 9. CONFIGURACIÓN DE EVENTOS (DELEGACIÓN)
    // ==========================================
    function configurarEventos() {
        // Evento de submit del formulario
        form.addEventListener('submit', agregarArticulo);

        // Delegación de Eventos para botones dentro del Grid (Eliminar y Editar)
        itemsGrid.addEventListener('click', (e) => {
            const btnDelete = e.target.closest('.btn-delete-item');
            const btnEdit = e.target.closest('.btn-edit-item');
            
            if (btnDelete) {
                const id = btnDelete.getAttribute('data-id');
                eliminarArticulo(id);
            } else if (btnEdit) {
                const id = btnEdit.getAttribute('data-id');
                cargarParaEdicion(id);
            }
        });

        // Guardar Presupuesto Principal
        btnSaveBudget.addEventListener('click', guardarPresupuestoPrincipal);

        // Exportar a JSON
        btnExportJson.addEventListener('click', exportarAJSON);

        // Eventos del Modal Hard Reset
        btnHardReset.addEventListener('click', abrirModal);
        btnCancelReset.addEventListener('click', cerrarModal);
        btnConfirmReset.addEventListener('click', ejecutarHardReset);

        // Cerrar modal clickeando fuera de la caja
        modalReset.addEventListener('click', (e) => {
            if (e.target === modalReset) {
                cerrarModal();
            }
        });
    }

    // Inicializar la aplicación cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', init);

})();
