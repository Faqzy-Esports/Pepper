// UI Management Module
class UIManager {
    constructor() {
        this.setupModals();
        this.setupEventListeners();
    }

    setupModals() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.closest('.modal'));
            }
        });
    }

    setupEventListeners() {
        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tab-button')) {
                const tab = e.target.closest('.tab-button');
                const tabsContainer = tab.closest('.tabs');
                const tabPaneId = tab.dataset.tab;

                if (!tabsContainer) return;

                tabsContainer.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const panes = document.querySelectorAll(`[data-pane="${tabPaneId}"]`);
                document.querySelectorAll('[data-pane]').forEach(p => p.classList.add('hidden'));
                panes.forEach(p => p.classList.remove('hidden'));
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => form.reset());
            const inputs = modal.querySelectorAll('input, textarea');
            inputs.forEach(el => el.value = '');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, duration);
    }

    createPackCard(pack, index = 0) {
        return `
            <div class="pack-card" data-pack-id="${pack.id}" style="animation-delay: ${index * 0.05}s;">
                <div class="pack-card-image" style="background-image: url('${pack.cover}'); background-size: cover; background-position: center;">
                    <span class="pack-category-badge">${pack.category}</span>
                </div>
                <div class="pack-card-body">
                    <h3 class="pack-card-title">${pack.name}</h3>
                    <p class="pack-card-author">${pack.author}</p>
                    <p class="pack-card-description">${pack.description.substring(0, 80)}...</p>
                    <div class="pack-card-footer">
                        <div class="pack-card-stats">
                            <span class="stat"><span class="stat-icon">⬇️</span>${this.formatNumber(pack.downloads)}</span>
                            <span class="stat"><span class="stat-icon">❤️</span>${this.formatNumber(pack.likes)}</span>
                            <span class="stat"><span class="stat-icon">⭐</span>${pack.rating.toFixed(1)}</span>
                        </div>
                        <span class="pack-version">v${pack.version}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderPackGrid(packs, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = packs.map((pack, index) => this.createPackCard(pack, index)).join('');
    }

    updateAccountButton() {
        const btn = document.getElementById('accountButton');
        if (!btn) return;

        if (authManager.isLoggedIn()) {
            const user = authManager.getCurrentUser();
            const displayName = user.displayName || user.username;
            const initial = displayName.charAt(0).toUpperCase();

            if (user.avatarUrl) {
                btn.innerHTML = `<img src="${user.avatarUrl}" alt="${displayName}" class="account-avatar"> ${displayName}`;
            } else {
                btn.innerHTML = `<span class="account-initial">${initial}</span> ${displayName}`;
            }
            btn.dataset.logged = 'true';
        } else {
            btn.textContent = 'Account';
            btn.dataset.logged = 'false';
        }
    }

    showLoading(element) {
        if (element) {
            element.innerHTML = '<div class="spinner"></div>';
        }
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

const uiManager = new UIManager();
