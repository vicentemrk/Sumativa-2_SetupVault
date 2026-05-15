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
        sortBy: 'priority',
        theme: 'dark',
        modalMode: 'create',
        editingId: null
    };

    const elements = {};

    /**
     * Load persisted state and normalize incoming records.
     *
     * Implementation notes (senior dev):
     * - Do not trust data from localStorage: parse defensively and coerce types.
     * - Ensure every item has a stable identifier (`id`) and a numeric `createdAt` to
     *   preserve chronological ordering across versions of the app.
     * - Sanitize textual fields at read-time so downstream rendering can assume a
     *   consistent, safe shape and avoid duplicated sanitization logic.
     */
    const loadState = () => {
        try {
            const storedItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.items)) || [];
            // Normalización de esquema en tiempo de lectura (schema validation)
            state.items = storedItems.map((item, index) => ({
                // Transición a UUIDs v4 para identificadores únicos y merge-safe
                id: item.id || crypto.randomUUID(),
                // Sanitización estricta de inputs (Defensa en profundidad contra XSS)
                name: sanitizeText(String(item.name || '')),
                // Coerción de tipos segura con fallback numérico
                price: Number(item.price) || 0,
                priority: item.priority || 'Planificada',
                // Timestamp inmutable para preservación del ordenamiento cronológico
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
     * Normalize and sanitize free-form text input.
     *
     * Rationale:
     * - Trim leading/trailing whitespace and collapse repeated spaces to a single
     *   space to keep values consistent and prevent accidental formatting issues.
     * - Keep this function small and deterministic so it can be unit-tested easily.
     */
    const sanitizeText = (value) => value.trim().replace(/\s+/g, ' ');

    const normalizeSearchText = (value) => sanitizeText(String(value || ''))
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    /**
     * Validate an item name. Accepts letters (including common accented chars),
     * numbers, spaces, dashes and underscores.
     *
     * Notes:
     * - This is an application-level constraint to keep names human-friendly and
     *   predictable. It is not a substitute for escaping or using `textContent`
     *   when rendering values to the DOM.
     */
    const validateName = (value) => /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/.test(value);

    /**
     * Función pura para el cálculo del total gastado.
     * Extraída para maximizar la reutilización, facilitar el testing unitario y
     * garantizar la ausencia de efectos secundarios en el estado global.
     */
    const getTotalSpent = () => state.items.reduce((sum, item) => sum + item.price, 0);

    /**
     * Función pura para calcular el presupuesto remanente.
     * Aplica el principio DRY mediante la composición sobre getTotalSpent().
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
        elements.themeIcon.className = isLight ? 'bi bi-moon-fill fs-6' : 'bi bi-sun-fill fs-6';
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
     * Map priority text to CSS class name.
     * Used for styling item cards and badges by priority level.
     */
    const getPriorityClass = (priority) => {
        const normalized = priority.toLowerCase().replace(/\s+/g, '');
        if (normalized === 'urgente') return 'urgente';
        if (normalized === 'planificada') return 'planificada';
        if (normalized === 'deseo') return 'deseo';
        return 'planificada'; // Default fallback
    };

    /**
     * Pipeline funcional para la derivación de datos (filtrado y ordenamiento).
     * Mantiene estricta inmutabilidad sobre el estado original.
     * Retorna una proyección ordenada y filtrada optimizada para renderizados reactivos.
     */
    const getVisibleItems = () => {
        const searchQuery = normalizeSearchText(state.searchQuery);

        let filteredItems = state.items.filter((item) => {
            const matchesQuery = !searchQuery || normalizeSearchText(item.name).includes(searchQuery);
            const matchesPriority = state.priorityFilter === 'all' || item.priority === state.priorityFilter;
            return matchesQuery && matchesPriority;
        });

        /**
         * Implementación del Patrón Strategy para la lógica de ordenamiento.
         * Desacopla los criterios de ordenamiento de la ejecución.
         * Utiliza localeCompare('es', { sensitivity: 'base' }) para un soporte robusto de i18n.
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
        icon.className = `bi bi-${name} ${className}`.trim();
        return icon;
    };

    const clearErrors = () => {
        ['name', 'price', 'priority'].forEach((field) => {
            const errorElement = elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
            if (!errorElement) return;
            errorElement.textContent = '';
            errorElement.classList.add('d-none');
        });
    };

    const setFieldError = (field, message) => {
        const errorElement = elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
        if (!errorElement) return;
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
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
                elements.modalPercentageWrap.classList.remove('d-none');
                elements.modalPercentage.textContent = `${usage.toFixed(0)}% usado`;
                elements.modalPercentageBar.style.width = `${usage}%`;
            } else {
                elements.modalPercentageWrap.classList.add('d-none');
                elements.modalPercentageBar.style.width = '0%';
            }
        }
    };

    /**
     * Create a DOM node for an inventory item using safe DOM APIs.
     *
     * Implementation intent (senior dev):
     * - Construct nodes with `createElement` and set textual content via
     *   `textContent` to avoid HTML parsing and XSS risks.
     * - Keep node construction local to this function so testing and
     *   visual updates are predictable and side-effect free (except DOM append).
     */
    const createItemCard = (item, index = 0) => {
        const column = document.createElement('article');
        column.className = 'col-12 col-md-6 col-lg-4';
        column.style.animationDelay = `${index * 0.05}s`;

        const card = document.createElement('div');
        card.className = `card app-card item-card priority-${getPriorityClass(item.priority)} h-100`;

        const body = document.createElement('div');
        body.className = 'card-body p-4 d-flex flex-column gap-3';

        const header = document.createElement('div');
        header.className = 'd-flex align-items-start justify-content-between gap-3';

        const content = document.createElement('div');
        content.className = 'flex-grow-1 min-w-0';

        const title = document.createElement('h3');
        title.className = 'h6 fw-semibold text-white mb-0 text-break';
        title.textContent = item.name;

        const badge = document.createElement('span');
        badge.className = `badge rounded-pill badge-${getPriorityClass(item.priority)} mt-2`;
        badge.textContent = item.priority;

        content.appendChild(title);
        content.appendChild(badge);

        const actions = document.createElement('div');
        actions.className = 'd-flex align-items-center gap-2 flex-shrink-0';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center';
        editButton.dataset.action = 'edit';
        editButton.dataset.itemId = item.id;
        editButton.setAttribute('aria-label', `Editar ${item.name}`);
        editButton.appendChild(createIcon('pencil-square', 'fs-6'));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center';
        deleteButton.dataset.action = 'delete';
        deleteButton.dataset.itemId = item.id;
        deleteButton.setAttribute('aria-label', `Eliminar ${item.name}`);
        deleteButton.appendChild(createIcon('trash3', 'fs-6'));

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        header.appendChild(content);
        header.appendChild(actions);

        const price = document.createElement('div');
        price.className = 'h5 fw-bold text-white mb-0';
        price.textContent = formatCurrency(item.price);

        body.appendChild(header);
        body.appendChild(price);
        card.appendChild(body);
        column.appendChild(card);

        return column;
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
            elements.emptyState.classList.remove('d-none');
            elements.emptyStateTitle.textContent = 'Tu bóveda está vacía';
            elements.emptyStateText.textContent = 'Comienza agregando tu primer artículo';
            return;
        }

        if (visibleItems.length === 0) {
            elements.emptyState.classList.remove('d-none');
            elements.emptyStateTitle.textContent = 'No hay resultados';
            elements.emptyStateText.textContent = 'Prueba otro término, filtro o criterio de orden.';
            return;
        }

        elements.emptyState.classList.add('d-none');

        const fragment = document.createDocumentFragment();
        visibleItems.forEach((item, index) => {
            fragment.appendChild(createItemCard(item, index));
        });

        elements.itemsGrid.appendChild(fragment);
    };

    const render = () => {
        applyTheme();
        updateThemeToggle();
        renderSummary();
        renderItems();
    };

    /**
     * Validate the item form and return a structured result.
     *
     * Strategy:
     * - Sanitize and coerce values first.
     * - Apply domain rules (required fields, numeric ranges, regex constraints).
     * - Provide field-level error messages to the caller to display in the UI.
     *
     * Returns: { valid: boolean, values: { name, price, priority } }
     */
    const validateItemForm = () => {
        clearErrors();

        const name = sanitizeText(elements.inputName.value);
        const price = Number(elements.inputPrice.value);
        const priority = elements.inputPriority.value;

        let valid = true;

        if (!name) {
            // Validación de integridad: campo mandatorio
            setFieldError('name', 'El nombre es obligatorio.');
            valid = false;
        } else if (!validateName(name)) {
            // Validación de seguridad: mitigación proactiva contra inyección de payloads
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
        elements.itemModal.classList.remove('d-none');
        elements.itemModal.setAttribute('aria-hidden', 'false');
        elements.inputName.focus();
        renderSummary();
    };

    const closeItemModal = () => {
        elements.itemModal.classList.add('d-none');
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
        const parsedBudget = Number.parseFloat(String(budgetValue).replace(/[^\d.,-]/g, '').replace(',', '.'));
        state.budget = Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : 0;
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
        elements.modalReset.classList.add('d-none');
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
            if (event.key === 'Escape' && !elements.itemModal.classList.contains('d-none')) {
                closeItemModal();
            }
        });

        elements.btnSaveBudget.addEventListener('click', () => {
            setBudget(elements.inputBudget?.value);
            if (elements.inputBudget) elements.inputBudget.value = '';
        });

        elements.btnReset.addEventListener('click', () => {
            elements.modalReset.classList.remove('d-none');
        });

        elements.btnCancelReset.addEventListener('click', () => {
            elements.modalReset.classList.add('d-none');
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
        elements.inputBudget = document.getElementById('input-budget');
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
        
        // Sync UI with initial state
        elements.selectSort.value = state.sortBy;
        
        render();
        updateModalChrome();

    };

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
