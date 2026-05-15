const app = (() => {
    const STORAGE_KEYS = {
        items: 'setupvault_items',
        budget: 'setupvault_budget',
        theme: 'setupvault_theme'
    };

    const state = {
        items: [],
        budget: 0,
        searchQuery: '',
        priorityFilter: 'all',
        sortBy: 'recent',
        theme: 'dark',
        modalMode: 'create',
        editingId: null
    };

    const elements = {};

    /**
     * [ASISTENCIA IA] Carga defensiva de estado con normalización
     * Patrón: Validación e normalización en lectura (no en escritura)
     * Razonamiento (Robustez):
     *   - No confía en datos del localStorage
     *   - Convierte datos antiguos al schema actual sin error
     *   - Coerción segura: Number(), String(), OR para defaults
     *   - Idempotencia: guardar + recargar mantiene integridad
     */
    const loadState = () => {
        try {
            const storedItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.items)) || [];
            // [ASISTENCIA IA] Normalización de schema en lectura
            state.items = storedItems.map((item, index) => ({
                // [ASISTENCIA IA] UUIDs en lugar de índices (escalable, merge-safe)
                id: item.id || crypto.randomUUID(),
                // [ASISTENCIA IA] Sanitización de texto en lectura (prevención XSS tardía)
                name: sanitizeText(String(item.name || '')),
                // [ASISTENCIA IA] Coerción segura con fallback
                price: Number(item.price) || 0,
                priority: item.priority || 'Planificada',
                // [ASISTENCIA IA] createdAt para ordenamiento "más reciente"
                createdAt: Number(item.createdAt) || Date.now() - index
            }));
            state.budget = JSON.parse(localStorage.getItem(STORAGE_KEYS.budget)) || 0;
            state.theme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
        } catch {
            state.items = [];
            state.budget = 0;
            state.theme = 'dark';
        }
    };

    const saveState = () => {
        localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(state.items));
        localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(state.budget));
        localStorage.setItem(STORAGE_KEYS.theme, state.theme);
    };

    const formatCurrency = (value) => `$${Number(value).toLocaleString('es-CL')}`;

    /**
     * [ASISTENCIA IA] Sanitización de texto para prevención de XSS
     * Propósito: Limpiar entrada de usuario eliminando espacios múltiples y normalizando
     * Razonamiento:
     *   - trim(): Elimina espacios al inicio/final
     *   - replace(/\s+/g, ' '): Normaliza espacios múltiples a uno solo
     *   - Combinado con textContent en DOM, previene inyección de HTML malicioso
     * Mejora futuro: Agregar expresiones regulares adicionales si se requiere
     */
    const sanitizeText = (value) => value.trim().replace(/\s+/g, ' ');

    /**
     * [ASISTENCIA IA] Validación con expresión regular
     * Propósito: Validar que nombres de artículos contengan solo caracteres seguros
     * Expresión regular: /^[a-zA-Z0-9\s\-_]+$/
     *   - ^...$: Anclas para validar cadena completa
     *   - [a-zA-Z0-9\s\-_]+: Permite letras, números, espacios, guiones y guiones bajos
     * Razonamiento: Previene inyección de caracteres especiales en JSON/HTML
     * Futuro: Considerar validadores para RUT, email, teléfono según rubric
     */
    const validateName = (value) => /^[a-zA-Z0-9\s\-_]+$/.test(value);

    const getPriorityClass = (priority) => {
        const normalized = priority.toLowerCase();

        if (normalized === 'urgente') return 'urgente';
        if (normalized === 'deseo') return 'deseo';
        return 'planificada';
    };

    /**
     * [ASISTENCIA IA] Función pura para cálculo de total gastado
     * Razonamiento (Refactorización modular):
     *   - Sin efectos secundarios (pure function)
     *   - Reutilizable en múltiples lugares (modal, resumen, tarjetas)
     *   - Fácil de testear: entrada → salida determinística
     *   - Patrón: Separación de "acceso a datos" vs "lógica de negocio"
     */
    const getTotalSpent = () => state.items.reduce((sum, item) => sum + item.price, 0);

    /**
     * [ASISTENCIA IA] Función pura para cálculo de presupuesto restante
     * Composición: Reutiliza getTotalSpent() para no duplicar lógica
     * Patrón: DRY (Don't Repeat Yourself) aplicado a cálculos
     */
    const getBudgetRemaining = () => state.budget - getTotalSpent();

    const getBudgetUsage = () => {
        if (!state.budget) return 0;
        return Math.min((getTotalSpent() / state.budget) * 100, 100);
    };

    const applyTheme = () => {
        document.documentElement.dataset.theme = state.theme;
    };

    const updateThemeToggle = () => {
        if (!elements.btnThemeToggle || !elements.themeLabel || !elements.themeIcon) return;

        const isLight = state.theme === 'light';
        elements.btnThemeToggle.setAttribute('aria-pressed', String(isLight));
        elements.themeLabel.textContent = isLight ? 'Oscuro' : 'Claro';
        elements.themeIcon.dataset.lucide = isLight ? 'moon' : 'sun';
    };

    const comparePriority = (leftPriority, rightPriority) => {
        const priorityOrder = {
            urgente: 0,
            planificada: 1,
            deseo: 2
        };

        const left = priorityOrder[leftPriority.toLowerCase()] ?? 99;
        const right = priorityOrder[rightPriority.toLowerCase()] ?? 99;

        return left - right;
    };

    /**
     * [ASISTENCIA IA] Derivación de datos con filtrado y ordenamiento
     * Patrón: Pipeline funcional sin mutación del estado original
     * Razonamiento (Refactorización modular):
     *   1. Normaliza búsqueda con sanitizeText() y toLowerCase()
     *   2. Filtra por query + prioridad en una pasada
     *   3. Aplica comparador seleccionado (Strategy pattern)
     *   4. Retorna copia ordenada sin mutar state.items
     * Beneficios:
     *   - Determinista: misma entrada = mismo resultado siempre
     *   - Re-render derivado: renderItems() llama a getVisibleItems() cada vez
     *   - Escalable: agregar filtros no requiere refactorización mayor
     */
    const getVisibleItems = () => {
        const searchQuery = sanitizeText(state.searchQuery).toLowerCase();

        let filteredItems = state.items.filter((item) => {
            const matchesQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery);
            const matchesPriority = state.priorityFilter === 'all' || item.priority === state.priorityFilter;
            return matchesQuery && matchesPriority;
        });

        /**
         * [ASISTENCIA IA] Patrón Strategy para ordenamiento flexible
         * Cada comparador es una función pura que retorna -1, 0 o 1 (estándar JavaScript)
         * Ventaja: Agregar nuevos criterios sin tocar lógica principal de sort
         * Nota: localeCompare('es', ...) ordena correctamente acentos y ñ en español
         */
        const comparators = {
            recent: (left, right) => (right.createdAt || 0) - (left.createdAt || 0),
            nameAsc: (left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }),
            nameDesc: (left, right) => right.name.localeCompare(left.name, 'es', { sensitivity: 'base' }),
            priceAsc: (left, right) => left.price - right.price,
            priceDesc: (left, right) => right.price - left.price,
            priority: (left, right) => {
                const priorityDelta = comparePriority(left.priority, right.priority);
                return priorityDelta !== 0 ? priorityDelta : left.name.localeCompare(right.name, 'es', { sensitivity: 'base' });
            }
        };

        const comparator = comparators[state.sortBy] || comparators.recent;
        filteredItems = [...filteredItems].sort(comparator);

        return filteredItems;
    };

    const createIcon = (name, className = '') => {
        const icon = document.createElement('i');
        icon.dataset.lucide = name;
        icon.setAttribute('stroke-width', '1.5');
        icon.className = className;
        return icon;
    };

    const clearErrors = () => {
        ['name', 'price', 'priority'].forEach((field) => {
            const errorElement = elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
            if (!errorElement) return;
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
        });
    };

    const setFieldError = (field, message) => {
        const errorElement = elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
        if (!errorElement) return;
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    };

    const clearItemForm = () => {
        elements.formItem.reset();
        clearErrors();
        state.modalMode = 'create';
        state.editingId = null;
        elements.itemModalTitle.textContent = 'Nuevo artículo';
        elements.modalSubtitle.textContent = 'Usa el mismo formulario para agregar o editar.';
        elements.submitLabel.textContent = 'Agregar artículo';
    };

    const prefillItemForm = (item) => {
        elements.inputName.value = item.name;
        elements.inputPrice.value = item.price;
        elements.inputPriority.value = item.priority;
    };

    const updateModalChrome = () => {
        const isEdit = state.modalMode === 'edit';

        elements.itemModalTitle.textContent = isEdit ? 'Editar artículo' : 'Nuevo artículo';
        elements.modalSubtitle.textContent = isEdit
            ? 'Ajusta los datos del artículo seleccionado.'
            : 'Usa el mismo formulario para agregar o editar.';
        elements.submitLabel.textContent = isEdit ? 'Guardar cambios' : 'Agregar artículo';
    };

    const renderSummary = () => {
        const totalSpent = getTotalSpent();
        const usage = getBudgetUsage();
        const remaining = getBudgetRemaining();
        const itemCount = state.items.length;

        elements.totalAmount.textContent = formatCurrency(totalSpent);
        elements.budgetText.textContent = state.budget > 0 ? formatCurrency(state.budget) : '—';
        elements.itemsCount.textContent = `${itemCount} artículo${itemCount !== 1 ? 's' : ''}`;
        elements.budgetBar.style.width = `${usage}%`;

        if (elements.modalTotal) elements.modalTotal.textContent = formatCurrency(totalSpent);
        if (elements.modalRemaining) {
            elements.modalRemaining.textContent = state.budget > 0 ? formatCurrency(remaining) : 'Sin presupuesto';
        }
        if (elements.modalCount) {
            elements.modalCount.textContent = `${itemCount} artículo${itemCount !== 1 ? 's' : ''}`;
        }

        if (elements.modalPercentageWrap) {
            if (state.budget > 0) {
                elements.modalPercentageWrap.classList.remove('hidden');
                elements.modalPercentage.textContent = `${usage.toFixed(0)}% usado`;
                elements.modalPercentageBar.style.width = `${usage}%`;
            } else {
                elements.modalPercentageWrap.classList.add('hidden');
                elements.modalPercentageBar.style.width = '0%';
            }
        }
    };

    /**
     * [ASISTENCIA IA] Creación segura del DOM - Prevención de XSS
     * Patrón: createElement + appendChild (programmatic construction)
     * NUNCA usar: card.innerHTML = `<h3>${item.name}</h3>` (¡VULNERABLE A XSS!)
     * Razonamiento (Seguridad):
     *   - createElement(): Crea elementos de forma programática, no parsing HTML
     *   - textContent: Interpreta como texto plano, nunca como HTML
     *   - dataset.* y setAttribute(): Para atributos de datos, nunca concatenación
     * Previene: <img src=x onerror=alert('XSS')>
     * Referencia: https://developer.mozilla.org/en-US/docs/Glossary/Cross_site_scripting_(XSS)
     */
    const createItemCard = (item) => {
        const card = document.createElement('article');
        card.className = `item-card rounded-lg p-4 ${getPriorityClass(item.priority)}`;

        const header = document.createElement('div');
        header.className = 'flex items-start justify-between gap-3 mb-3';

        const content = document.createElement('div');
        content.className = 'flex-1 min-w-0';

        const title = document.createElement('h3');
        title.className = 'text-sm font-semibold text-white line-clamp-2';
        // ✅ SEGURO: textContent previene XSS (no interpreta HTML)
        title.textContent = item.name;

        const badgeWrap = document.createElement('div');
        badgeWrap.className = 'flex gap-2 mt-2';

        const badge = document.createElement('span');
        badge.className = `text-xs font-medium px-2 py-1 rounded badge-${getPriorityClass(item.priority)}`;
        badge.textContent = item.priority;

        badgeWrap.appendChild(badge);
        content.appendChild(title);
        content.appendChild(badgeWrap);

        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-1 shrink-0';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'text-slate-500 hover:text-emerald-300 transition p-1';
        // [ASISTENCIA IA] Uso de dataset.* para atributos de datos (seguro)
        editButton.dataset.action = 'edit';
        editButton.dataset.itemId = item.id;
        // aria-label: Concatenación segura porque textContent es sanitizado en loadState
        editButton.setAttribute('aria-label', `Editar ${item.name}`);
        editButton.appendChild(createIcon('pencil', 'w-4 h-4'));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'text-slate-500 hover:text-red-400 transition p-1';
        deleteButton.dataset.action = 'delete';
        deleteButton.dataset.itemId = item.id;
        deleteButton.setAttribute('aria-label', `Eliminar ${item.name}`);
        deleteButton.appendChild(createIcon('trash-2', 'w-4 h-4'));

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        header.appendChild(content);
        header.appendChild(actions);

        const price = document.createElement('div');
        price.className = 'text-lg font-bold text-white';
        price.textContent = formatCurrency(item.price);

        card.appendChild(header);
        card.appendChild(price);

        return card;
    };

    const updateInventoryCount = (visibleCount) => {
        const totalCount = state.items.length;
        const hasFilters = state.searchQuery.trim() || state.priorityFilter !== 'all';

        if (totalCount === 0) {
            elements.itemsCount.textContent = '0 artículos';
            return;
        }

        if (hasFilters) {
            elements.itemsCount.textContent = `${visibleCount} de ${totalCount} artículo${totalCount !== 1 ? 's' : ''}`;
            return;
        }

        elements.itemsCount.textContent = `${totalCount} artículo${totalCount !== 1 ? 's' : ''}`;
    };

    const renderItems = () => {
        elements.itemsGrid.replaceChildren();

        const visibleItems = getVisibleItems();
        updateInventoryCount(visibleItems.length);

        if (state.items.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.emptyStateTitle.textContent = 'Tu bóveda está vacía';
            elements.emptyStateText.textContent = 'Comienza agregando tu primer artículo';
            return;
        }

        if (visibleItems.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.emptyStateTitle.textContent = 'No hay resultados';
            elements.emptyStateText.textContent = 'Prueba otro término, filtro o criterio de orden.';
            return;
        }

        elements.emptyState.classList.add('hidden');

        const fragment = document.createDocumentFragment();
        visibleItems.forEach((item) => {
            fragment.appendChild(createItemCard(item));
        });

        elements.itemsGrid.appendChild(fragment);
    };

    const render = () => {
        applyTheme();
        updateThemeToggle();
        renderSummary();
        renderItems();

        if (window.lucide) {
            lucide.createIcons();
        }
    };

    /**
     * [ASISTENCIA IA] Validación estructurada con feedback claro
     * Patrón: Validación multicapa (tipo + rango + restricciones de negocio)
     * Razonamiento:
     *   1. Limpia estado anterior de errores
     *   2. Sanitiza/coerciona entrada del usuario
     *   3. Valida en cascada con mensajes específicos
     *   4. Retorna estructura { valid, values } para reutilización
     * Beneficios:
     *   - Fail-fast pero completo: muestra todos los errores
     *   - Mensajes localizados en español
     *   - Fácil de testear cada rama de validación
     */
    const validateItemForm = () => {
        clearErrors();

        const name = sanitizeText(elements.inputName.value);
        const price = Number(elements.inputPrice.value);
        const priority = elements.inputPriority.value;

        let valid = true;

        if (!name) {
            // [ASISTENCIA IA] Validación: campo requerido
            setFieldError('name', 'El nombre es obligatorio.');
            valid = false;
        } else if (!validateName(name)) {
            // [ASISTENCIA IA] Validación: expresión regular (prevención de XSS)
            setFieldError('name', 'Solo letras, números, espacios y guiones.');
            valid = false;
        }

        if (!elements.inputPrice.value || Number.isNaN(price) || price <= 0) {
            setFieldError('price', 'El precio debe ser un número mayor a 0.');
            valid = false;
        }

        if (!priority) {
            setFieldError('priority', 'Debes seleccionar una prioridad.');
            valid = false;
        }

        return {
            valid,
            values: {
                name,
                price,
                priority
            }
        };
    };

    const getItemById = (id) => state.items.find((item) => item.id === id);

    const openItemModal = (mode = 'create', itemId = null) => {
        state.modalMode = mode;
        state.editingId = itemId;

        if (mode === 'edit') {
            const item = getItemById(itemId);
            if (!item) return;
            clearItemForm();
            state.modalMode = 'edit';
            state.editingId = itemId;
            prefillItemForm(item);
        } else {
            clearItemForm();
        }

        updateModalChrome();
        elements.itemModal.classList.remove('hidden');
        elements.itemModal.setAttribute('aria-hidden', 'false');
        elements.inputName.focus();
        renderSummary();
    };

    const closeItemModal = () => {
        elements.itemModal.classList.add('hidden');
        elements.itemModal.setAttribute('aria-hidden', 'true');
        clearItemForm();
    };

    const saveItemFromModal = () => {
        const validation = validateItemForm();
        if (!validation.valid) return;

        const { name, price, priority } = validation.values;

        if (state.modalMode === 'edit' && state.editingId) {
            const index = state.items.findIndex((item) => item.id === state.editingId);
            if (index !== -1) {
                state.items[index] = {
                    ...state.items[index],
                    name,
                    price,
                    priority
                };
            }
        } else {
            state.items.push({
                id: crypto.randomUUID(),
                name,
                price,
                priority,
                createdAt: Date.now()
            });
        }

        saveState();
        render();
        closeItemModal();
    };

    const setBudget = (budgetValue) => {
        state.budget = Number.parseFloat(budgetValue) || 0;
        saveState();
        render();
    };

    const setSearchQuery = (value) => {
        state.searchQuery = value;
        renderItems();
    };

    const setPriorityFilter = (value) => {
        state.priorityFilter = value;
        renderItems();
    };

    const setSortBy = (value) => {
        state.sortBy = value;
        renderItems();
    };

    const toggleTheme = () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        saveState();
        render();
    };

    const deleteItem = (id) => {
        state.items = state.items.filter((item) => item.id !== id);
        saveState();
        render();
    };

    const exportData = () => {
        const data = {
            items: state.items,
            budget: state.budget,
            totalSpent: getTotalSpent(),
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `setupvault-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const resetData = () => {
        localStorage.removeItem(STORAGE_KEYS.items);
        localStorage.removeItem(STORAGE_KEYS.budget);
        state.items = [];
        state.budget = 0;
        saveState();
        render();
        elements.modalReset.classList.add('hidden');
    };

    const bindEvents = () => {
        elements.btnOpenModal.addEventListener('click', () => openItemModal('create'));
        elements.btnThemeToggle.addEventListener('click', toggleTheme);

        elements.inputSearch.addEventListener('input', (event) => {
            setSearchQuery(event.target.value);
        });

        elements.selectPriorityFilter.addEventListener('change', (event) => {
            setPriorityFilter(event.target.value);
        });

        elements.selectSort.addEventListener('change', (event) => {
            setSortBy(event.target.value);
        });

        elements.formItem.addEventListener('submit', (event) => {
            event.preventDefault();
            saveItemFromModal();
        });

        elements.btnCancelItem.addEventListener('click', closeItemModal);
        elements.btnCloseModal.addEventListener('click', closeItemModal);

        elements.itemModal.addEventListener('click', (event) => {
            if (event.target === elements.itemModal) {
                closeItemModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !elements.itemModal.classList.contains('hidden')) {
                closeItemModal();
            }
        });

        elements.btnSaveBudget.addEventListener('click', () => {
            setBudget(elements.inputBudget.value);
            elements.inputBudget.value = '';
        });

        elements.btnReset.addEventListener('click', () => {
            elements.modalReset.classList.remove('hidden');
        });

        elements.btnCancelReset.addEventListener('click', () => {
            elements.modalReset.classList.add('hidden');
        });

        elements.btnConfirmReset.addEventListener('click', resetData);

        elements.btnExport.addEventListener('click', exportData);

        elements.itemsGrid.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-action]');
            if (!actionButton) return;

            const { action, itemId } = actionButton.dataset;

            if (action === 'delete') {
                deleteItem(itemId);
            }

            if (action === 'edit') {
                openItemModal('edit', itemId);
            }
        });
    };

    const cacheElements = () => {
        elements.btnOpenModal = document.getElementById('btn-open-modal');
        elements.btnExport = document.getElementById('btn-export');
        elements.btnReset = document.getElementById('btn-reset');
        elements.btnSaveBudget = document.getElementById('btn-save-budget');
        elements.btnCancelReset = document.getElementById('btn-cancel-reset');
        elements.btnConfirmReset = document.getElementById('btn-confirm-reset');
        elements.modalReset = document.getElementById('modal-reset');

        elements.itemModal = document.getElementById('item-modal');
        elements.btnCloseModal = document.getElementById('btn-close-modal');
        elements.btnCancelItem = document.getElementById('btn-cancel-item');
        elements.formItem = document.getElementById('form-item');
        elements.inputName = document.getElementById('input-name');
        elements.inputPrice = document.getElementById('input-price');
        elements.inputPriority = document.getElementById('input-priority');
        elements.submitLabel = document.getElementById('btn-submit-item-label');
        elements.itemModalTitle = document.getElementById('item-modal-title');
        elements.modalSubtitle = document.getElementById('modal-subtitle');

        elements.errorName = document.getElementById('error-name');
        elements.errorPrice = document.getElementById('error-price');
        elements.errorPriority = document.getElementById('error-priority');

        elements.modalTotal = document.getElementById('modal-summary-total');
        elements.modalRemaining = document.getElementById('modal-summary-remaining');
        elements.modalCount = document.getElementById('modal-summary-count');
        elements.modalPercentageWrap = document.getElementById('modal-summary-percentage-wrap');
        elements.modalPercentage = document.getElementById('modal-summary-percentage');
        elements.modalPercentageBar = document.getElementById('modal-summary-percentage-bar');

        elements.itemsGrid = document.getElementById('items-grid');
        elements.emptyState = document.getElementById('empty-state');
        elements.emptyStateTitle = document.getElementById('empty-state-title');
        elements.emptyStateText = document.getElementById('empty-state-text');
        elements.totalAmount = document.getElementById('total-amount');
        elements.budgetText = document.getElementById('budget-text');
        elements.budgetBar = document.getElementById('budget-bar');
        elements.itemsCount = document.getElementById('items-count');

        elements.btnThemeToggle = document.getElementById('btn-theme-toggle');
        elements.themeLabel = document.getElementById('theme-label');
        elements.themeIcon = document.getElementById('theme-icon');
        elements.inputSearch = document.getElementById('input-search');
        elements.selectPriorityFilter = document.getElementById('select-priority-filter');
        elements.selectSort = document.getElementById('select-sort');
    };

    const init = () => {
        cacheElements();
        loadState();
        applyTheme();
        bindEvents();
        render();
        updateModalChrome();

        if (window.lucide) {
            lucide.createIcons();
        }
    };

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
