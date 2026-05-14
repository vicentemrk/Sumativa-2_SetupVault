const app = (() => {
    const STORAGE_KEYS = {
        items: 'setupvault_items',
        budget: 'setupvault_budget'
    };

    const elements = {};

    const state = {
        items: [],
        budget: 0
    };

    const loadState = () => {
        try {
            state.items = JSON.parse(localStorage.getItem(STORAGE_KEYS.items)) || [];
            state.budget = JSON.parse(localStorage.getItem(STORAGE_KEYS.budget)) || 0;
        } catch {
            state.items = [];
            state.budget = 0;
        }
    };

    const saveState = () => {
        localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(state.items));
        localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(state.budget));
    };

    const formatCurrency = (value) => `$${Number(value).toLocaleString('es-CL')}`;

    const getTotalSpent = () => state.items.reduce((sum, item) => sum + item.price, 0);

    const validateName = (name) => /^[a-zA-Z0-9\s\-_]+$/.test(name);

    const getPriorityClass = (priority) => {
        const normalized = priority.toLowerCase();
        if (normalized === 'urgente') return 'urgente';
        if (normalized === 'deseo') return 'deseo';
        return 'planificada';
    };

    const createItemCard = (item) => {
        const card = document.createElement('article');
        card.className = `item-card rounded-lg p-4 ${getPriorityClass(item.priority)}`;

        const header = document.createElement('div');
        header.className = 'flex items-start justify-between mb-3';

        const content = document.createElement('div');
        content.className = 'flex-1 min-w-0';

        const title = document.createElement('h3');
        title.className = 'text-sm font-semibold text-white line-clamp-2';
        title.textContent = item.name;

        const badgeWrap = document.createElement('div');
        badgeWrap.className = 'flex gap-2 mt-2';

        const badge = document.createElement('span');
        badge.className = `text-xs font-medium px-2 py-1 rounded badge-${getPriorityClass(item.priority)}`;
        badge.textContent = item.priority;

        badgeWrap.appendChild(badge);
        content.appendChild(title);
        content.appendChild(badgeWrap);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'text-slate-500 hover:text-red-400 transition p-1';
        removeButton.setAttribute('aria-label', `Eliminar ${item.name}`);
        removeButton.dataset.deleteId = item.id;
        removeButton.innerHTML = '<i data-lucide="trash" stroke-width="1.5" class="w-4 h-4"></i>';

        header.appendChild(content);
        header.appendChild(removeButton);

        const price = document.createElement('div');
        price.className = 'text-lg font-bold text-white';
        price.textContent = formatCurrency(item.price);

        card.appendChild(header);
        card.appendChild(price);

        return card;
    };

    const render = () => {
        const total = getTotalSpent();
        const percentage = state.budget > 0 ? (total / state.budget) * 100 : 0;

        elements.totalAmount.textContent = formatCurrency(total);
        elements.budgetText.textContent = state.budget > 0 ? formatCurrency(state.budget) : '—';
        elements.budgetBar.style.width = `${Math.min(percentage, 100)}%`;
        elements.itemsCount.textContent = `${state.items.length} artículo${state.items.length !== 1 ? 's' : ''}`;

        elements.itemsGrid.replaceChildren();

        if (state.items.length === 0) {
            elements.emptyState.classList.remove('hidden');
            return;
        }

        elements.emptyState.classList.add('hidden');
        const fragment = document.createDocumentFragment();
        state.items.forEach((item) => {
            fragment.appendChild(createItemCard(item));
        });
        elements.itemsGrid.appendChild(fragment);

        if (window.lucide) {
            lucide.createIcons();
        }
    };

    const addItem = (name, price, priority) => {
        const cleanName = name.trim();
        const parsedPrice = Number(price);

        if (!cleanName || !price || !priority) return false;
        if (!validateName(cleanName)) return false;
        if (Number.isNaN(parsedPrice) || parsedPrice <= 0) return false;

        state.items.push({
            id: crypto.randomUUID(),
            name: cleanName,
            price: parsedPrice,
            priority
        });

        saveState();
        render();
        return true;
    };

    const setBudget = (budget) => {
        state.budget = Number.parseFloat(budget) || 0;
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
        render();
        elements.modalReset.classList.add('hidden');
    };

    const bindEvents = () => {
        elements.formItem.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = elements.inputName.value;
            const price = elements.inputPrice.value;
            const priority = elements.inputPriority.value;

            if (addItem(name, price, priority)) {
                elements.formItem.reset();
                elements.inputName.focus();
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
            const deleteButton = event.target.closest('[data-delete-id]');
            if (!deleteButton) return;
            deleteItem(deleteButton.dataset.deleteId);
        });
    };

    const cacheElements = () => {
        elements.formItem = document.getElementById('form-item');
        elements.inputName = document.getElementById('input-name');
        elements.inputPrice = document.getElementById('input-price');
        elements.inputPriority = document.getElementById('input-priority');
        elements.inputBudget = document.getElementById('input-budget');
        elements.btnSaveBudget = document.getElementById('btn-save-budget');
        elements.btnReset = document.getElementById('btn-reset');
        elements.btnCancelReset = document.getElementById('btn-cancel-reset');
        elements.btnConfirmReset = document.getElementById('btn-confirm-reset');
        elements.btnExport = document.getElementById('btn-export');
        elements.modalReset = document.getElementById('modal-reset');
        elements.itemsGrid = document.getElementById('items-grid');
        elements.emptyState = document.getElementById('empty-state');
        elements.totalAmount = document.getElementById('total-amount');
        elements.budgetText = document.getElementById('budget-text');
        elements.budgetBar = document.getElementById('budget-bar');
        elements.itemsCount = document.getElementById('items-count');
    };

    const init = () => {
        cacheElements();
        loadState();
        bindEvents();
        render();
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
