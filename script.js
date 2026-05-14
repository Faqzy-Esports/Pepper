// Pepper - Resource Pack Repository
// Advanced pack management system

class PepperApp {
    constructor() {
        this.packs = this.loadPacks();
        this.currentUser = this.loadUser();
        this.currentPack = null;
        this.currentGalleryIndex = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderFeaturedPacks();
        this.renderBrowsePacks();
        this.updateAccountUI();
    }

    // ===== Data Management =====
    loadPacks() {
        const stored = localStorage.getItem('pepper_packs');
        if (!stored) {
            return this.getDefaultPacks();
        }
        return JSON.parse(stored);
    }

    getDefaultPacks() {
        return [
            {
                id: 1,
                name: "Crystal Clear",
                author: "ArtisticDev",
                category: "Texture",
                description: "A stunning crystalline texture pack with enhanced visuals",
                fullDescription: "# Crystal Clear\n\nA professional texture pack designed to enhance your gaming experience with crystal-clear graphics and smooth transitions.\n\n## Features\n- High-resolution textures (128x)\n- Enhanced lighting effects\n- Smooth model transitions\n- Compatible with all versions\n\n## Installation\n1. Download the pack\n2. Open your resource packs folder\n3. Extract the zip file\n4. Activate in game settings",
                version: "2.5.0",
                downloads: 15420,
                likes: 3210,
                cover: "https://via.placeholder.com/400x300?text=Crystal+Clear",
                gallery: [
                    "https://via.placeholder.com/300x300?text=Gallery+1",
                    "https://via.placeholder.com/300x300?text=Gallery+2",
                    "https://via.placeholder.com/300x300?text=Gallery+3"
                ],
                versions: [
                    { version: "2.5.0", date: "2026-05-13", changelog: "Fixed lighting bugs, improved textures", downloads: 5230 },
                    { version: "2.4.0", date: "2026-05-01", changelog: "Added new blocks, performance improvements", downloads: 4510 },
                    { version: "2.3.0", date: "2026-04-15", changelog: "Initial release", downloads: 5680 }
                ],
                uploadedBy: null,
                featured: true,
                uploadDate: "2026-04-15"
            },
            {
                id: 2,
                name: "Neon Dreams",
                author: "VividStudio",
                category: "Shader",
                description: "Futuristic neon-themed visual enhancements",
                fullDescription: "# Neon Dreams\n\nTransform your world with stunning neon effects and cyberpunk aesthetics.\n\n## Features\n- Neon glow effects\n- Enhanced particles\n- Custom water rendering\n- Cyberpunk color palette",
                version: "1.8.0",
                downloads: 12850,
                likes: 2890,
                cover: "https://via.placeholder.com/400x300?text=Neon+Dreams",
                gallery: [
                    "https://via.placeholder.com/300x300?text=Neon+1",
                    "https://via.placeholder.com/300x300?text=Neon+2"
                ],
                versions: [
                    { version: "1.8.0", date: "2026-05-10", changelog: "Updated effects, better performance", downloads: 4320 },
                    { version: "1.7.0", date: "2026-04-25", changelog: "Added neon particles", downloads: 4265 }
                ],
                uploadedBy: null,
                featured: true,
                uploadDate: "2026-04-25"
            },
            {
                id: 3,
                name: "Minimal UI",
                author: "CleanDesign",
                category: "UI",
                description: "Minimalist user interface for a cleaner experience",
                fullDescription: "# Minimal UI\n\nA clean, distraction-free UI for focused gameplay.\n\n## Features\n- Simplified menu\n- Flat design elements\n- Better visibility\n- Dark theme",
                version: "1.2.0",
                downloads: 8900,
                likes: 1950,
                cover: "https://via.placeholder.com/400x300?text=Minimal+UI",
                gallery: [
                    "https://via.placeholder.com/300x300?text=UI+1"
                ],
                versions: [
                    { version: "1.2.0", date: "2026-05-08", changelog: "Fixed UI scaling", downloads: 3450 }
                ],
                uploadedBy: null,
                featured: false,
                uploadDate: "2026-05-08"
            }
        ];
    }

    savePacks() {
        localStorage.setItem('pepper_packs', JSON.stringify(this.packs));
    }

    loadUser() {
        const stored = localStorage.getItem('pepper_user');
        return stored ? JSON.parse(stored) : null;
    }

    saveUser() {
        if (this.currentUser) {
            localStorage.setItem('pepper_user', JSON.stringify(this.currentUser));
        }
    }

    // ===== Event Listeners =====
    setupEventListeners() {
        // Upload Button
        document.getElementById('uploadBtn').addEventListener('click', () => this.openModal('uploadModal'));

        // Account Button
        document.getElementById('accountBtn').addEventListener('click', () => this.openModal('accountModal'));

        // Modal Close
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Upload Form
        document.getElementById('uploadForm').addEventListener('submit', (e) => this.handleUploadPack(e));

        // Auth Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // Auth Toggles
        document.getElementById('toggleRegister').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('accountLogin').classList.add('hidden');
            document.getElementById('accountRegister').classList.remove('hidden');
        });

        document.getElementById('toggleLogin').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('accountRegister').classList.add('hidden');
            document.getElementById('accountLogin').classList.remove('hidden');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Profile Buttons
        document.getElementById('myUploadsBtn').addEventListener('click', () => this.showMyUploads());
        document.getElementById('myLikesBtn').addEventListener('click', () => this.showMyLikes());

        // Search and Filter
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterPacks());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterPacks());
        document.getElementById('sortFilter').addEventListener('change', () => this.filterPacks());

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });

        // Back Buttons
        document.getElementById('backBtn').addEventListener('click', () => this.backToHome());
        document.getElementById('backFromUploads').addEventListener('click', () => this.backToHome());
        document.getElementById('backFromLikes').addEventListener('click', () => this.backToHome());

        // Gallery
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('gallery-image')) {
                this.openLightbox(e.target.src);
            }
        });

        // Lightbox Navigation
        document.querySelector('.close-lightbox')?.addEventListener('click', () => this.closeLightbox());
        document.querySelector('.prev-image')?.addEventListener('click', () => this.prevImage());
        document.querySelector('.next-image')?.addEventListener('click', () => this.nextImage());

        // Update Version Button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'updateBtn') {
                this.openModal('updateModal');
            }
        });

        document.getElementById('updateForm')?.addEventListener('submit', (e) => this.handleUploadVersion(e));

        // Pack Card Clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pack-card')) {
                const packCard = e.target.closest('.pack-card');
                const packId = parseInt(packCard.dataset.packId);
                this.showPackDetail(packId);
            }
        });

        // Like Button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'likeBtn') {
                this.toggleLike();
            }
        });

        // Download Button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'downloadBtn') {
                this.handleDownload();
            }
        });
    }

    // ===== Modal Management =====
    openModal(modalId) {
        if (!this.currentUser && (modalId === 'uploadModal' || modalId === 'updateModal')) {
            this.showNotification('Please login first to upload packs', 'error');
            this.openModal('accountModal');
            return;
        }

        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        
        if (modalId === 'accountModal') {
            if (this.currentUser) {
                document.getElementById('accountLogin').classList.add('hidden');
                document.getElementById('accountRegister').classList.add('hidden');
                document.getElementById('accountProfile').classList.remove('hidden');
                document.getElementById('profileUsername').textContent = this.currentUser.username;
                document.getElementById('profileEmail').textContent = this.currentUser.email;
            } else {
                document.getElementById('accountLogin').classList.remove('hidden');
                document.getElementById('accountRegister').classList.add('hidden');
                document.getElementById('accountProfile').classList.add('hidden');
            }
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            modal.querySelectorAll('input, textarea').forEach(el => el.value = '');
        }
    }

    // ===== Authentication =====
    handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        // Simple auth (in real app, would use backend)
        this.currentUser = {
            username: email.split('@')[0],
            email: email,
            password: password,
            likedPacks: [],
            uploadedPacks: []
        };

        this.saveUser();
        this.showNotification('Logged in successfully!', 'success');
        this.closeModal(document.getElementById('accountModal'));
        this.updateAccountUI();
    }

    handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const username = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        this.currentUser = {
            username: username,
            email: email,
            password: password,
            likedPacks: [],
            uploadedPacks: []
        };

        this.saveUser();
        this.showNotification('Account created successfully!', 'success');
        this.closeModal(document.getElementById('accountModal'));
        this.updateAccountUI();
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('pepper_user');
        this.showNotification('Logged out successfully', 'success');
        this.closeModal(document.getElementById('accountModal'));
        this.updateAccountUI();
    }

    updateAccountUI() {
        const accountBtn = document.getElementById('accountBtn');
        if (this.currentUser) {
            accountBtn.textContent = '✓';
            accountBtn.style.background = 'var(--success)';
        } else {
            accountBtn.textContent = '👤';
            accountBtn.style.background = '';
        }
    }

    // ===== Pack Management =====
    handleUploadPack(e) {
        e.preventDefault();

        if (!this.currentUser) {
            this.showNotification('Please login first', 'error');
            return;
        }

        const packName = document.getElementById('packName').value;
        const packAuthor = document.getElementById('packAuthor').value;
        const packDesc = document.getElementById('packDesc').value;
        const packCategory = document.getElementById('packCategory').value;
        const packFullDesc = document.getElementById('packFullDesc').value;

        const newPack = {
            id: this.packs.length + 1,
            name: packName,
            author: packAuthor,
            category: packCategory,
            description: packDesc,
            fullDescription: packFullDesc,
            version: "1.0.0",
            downloads: 0,
            likes: 0,
            cover: "https://via.placeholder.com/400x300?text=" + encodeURIComponent(packName),
            gallery: [],
            versions: [
                {
                    version: "1.0.0",
                    date: new Date().toISOString().split('T')[0],
                    changelog: "Initial release",
                    downloads: 0
                }
            ],
            uploadedBy: this.currentUser.username,
            featured: false,
            uploadDate: new Date().toISOString().split('T')[0]
        };

        this.packs.push(newPack);
        this.currentUser.uploadedPacks.push(newPack.id);
        this.savePacks();
        this.saveUser();

        this.showNotification('Pack uploaded successfully!', 'success');
        this.closeModal(document.getElementById('uploadModal'));
        this.renderBrowsePacks();
    }

    handleUploadVersion(e) {
        e.preventDefault();

        if (!this.currentPack || this.currentPack.uploadedBy !== this.currentUser?.username) {
            this.showNotification('You can only update your own packs', 'error');
            return;
        }

        const newVersion = document.getElementById('newVersion').value;
        const changelog = document.getElementById('versionChangelog').value;

        const version = {
            version: newVersion,
            date: new Date().toISOString().split('T')[0],
            changelog: changelog,
            downloads: 0
        };

        this.currentPack.versions.unshift(version);
        this.currentPack.version = newVersion;
        this.savePacks();

        this.showNotification('Version uploaded successfully!', 'success');
        this.closeModal(document.getElementById('updateModal'));
        this.showPackDetail(this.currentPack.id);
    }

    // ===== Pack Display =====
    renderFeaturedPacks() {
        const featured = this.packs.filter(p => p.featured).slice(0, 6);
        const container = document.getElementById('featuredPacks');
        container.innerHTML = featured.map(pack => this.createPackCard(pack)).join('');
    }

    renderBrowsePacks() {
        this.filterPacks();
    }

    filterPacks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const sort = document.getElementById('sortFilter').value;

        let filtered = this.packs.filter(pack => {
            const matchesSearch = pack.name.toLowerCase().includes(searchTerm) ||
                                pack.author.toLowerCase().includes(searchTerm) ||
                                pack.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !category || pack.category === category;
            return matchesSearch && matchesCategory;
        });

        // Sort
        switch (sort) {
            case 'downloads':
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
            case 'likes':
                filtered.sort((a, b) => b.likes - a.likes);
                break;
            case 'recent':
                filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                break;
            case 'newest':
                filtered.sort((a, b) => b.id - a.id);
                break;
        }

        const container = document.getElementById('packGrid');
        container.innerHTML = filtered.map(pack => this.createPackCard(pack)).join('');
    }

    createPackCard(pack) {
        return `
            <div class="pack-card" data-pack-id="${pack.id}">
                <div class="pack-card-image" style="background-image: url('${pack.cover}'); background-size: cover;"></div>
                <div class="pack-card-content">
                    <div class="pack-card-title">${pack.name}</div>
                    <div class="pack-card-author">by ${pack.author}</div>
                    <span class="pack-card-category">${pack.category}</span>
                    <div class="pack-card-stats">
                        <span>⬇️ ${pack.downloads}</span>
                        <span>❤️ ${pack.likes}</span>
                        <span>v${pack.version}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showPackDetail(packId) {
        this.currentPack = this.packs.find(p => p.id === packId);
        if (!this.currentPack) return;

        document.getElementById('packTitle').textContent = this.currentPack.name;
        document.getElementById('packAuthor').textContent = `by ${this.currentPack.author}`;
        document.getElementById('packDownloads').textContent = this.currentPack.downloads;
        document.getElementById('packLikes').textContent = this.currentPack.likes;
        document.getElementById('packVersion').textContent = `v${this.currentPack.version}`;
        document.getElementById('packDescription').textContent = this.currentPack.description;
        document.getElementById('fullDescription').textContent = this.currentPack.fullDescription;
        
        const packCover = document.getElementById('packCover');
        packCover.style.backgroundImage = `url('${this.currentPack.cover}')`;
        packCover.style.backgroundSize = 'cover';

        // Update Like Button
        const likeBtn = document.getElementById('likeBtn');
        const isLiked = this.currentUser?.likedPacks.includes(this.currentPack.id);
        likeBtn.textContent = isLiked ? '❤️ Liked' : '🤍 Like';

        // Show/Hide Update Button
        const updateBtn = document.getElementById('updateBtn');
        if (this.currentUser?.username === this.currentPack.uploadedBy) {
            updateBtn.style.display = 'block';
        } else {
            updateBtn.style.display = 'none';
        }

        // Render Gallery
        this.renderGallery();

        // Render Versions
        this.renderVersions();

        // Switch to home view
        document.getElementById('homeView').classList.add('hidden');
        document.getElementById('packDetailView').classList.remove('hidden');

        // Reset to description tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.querySelector('.tab-btn').classList.add('active');
        document.getElementById('description').classList.add('active');
    }

    renderGallery() {
        const gallery = document.getElementById('galleryGrid');
        gallery.innerHTML = this.currentPack.gallery.map(img => 
            `<img src="${img}" alt="Gallery" class="gallery-image">`
        ).join('');
    }

    renderVersions() {
        const versions = document.getElementById('versionsList');
        versions.innerHTML = this.currentPack.versions.map(v => `
            <div class="version-item">
                <div class="version-header">
                    <span class="version-number">v${v.version}</span>
                    <span class="version-date">${v.date}</span>
                </div>
                <p class="version-changelog">${v.changelog}</p>
                <button class="version-download" onclick="app.downloadVersion('${v.version}')">Download v${v.version}</button>
            </div>
        `).join('');
    }

    // ===== User Features =====
    toggleLike() {
        if (!this.currentUser) {
            this.showNotification('Please login to like packs', 'error');
            return;
        }

        const index = this.currentUser.likedPacks.indexOf(this.currentPack.id);
        if (index > -1) {
            this.currentUser.likedPacks.splice(index, 1);
            this.currentPack.likes--;
            document.getElementById('likeBtn').textContent = '🤍 Like';
        } else {
            this.currentUser.likedPacks.push(this.currentPack.id);
            this.currentPack.likes++;
            document.getElementById('likeBtn').textContent = '❤️ Liked';
        }

        this.saveUser();
        this.savePacks();
        document.getElementById('packLikes').textContent = this.currentPack.likes;
    }

    handleDownload() {
        this.currentPack.downloads++;
        this.savePacks();
        document.getElementById('packDownloads').textContent = this.currentPack.downloads;
        this.showNotification(`Downloading ${this.currentPack.name} v${this.currentPack.version}`, 'success');
    }

    downloadVersion(version) {
        this.showNotification(`Downloading ${this.currentPack.name} v${version}`, 'success');
    }

    showMyUploads() {
        if (!this.currentUser) return;

        const uploads = this.packs.filter(p => this.currentUser.uploadedPacks.includes(p.id));
        const container = document.getElementById('myUploadsList');
        container.innerHTML = uploads.map(pack => this.createPackCard(pack)).join('');

        document.getElementById('accountModal').classList.add('hidden');
        document.getElementById('homeView').classList.add('hidden');
        document.getElementById('packDetailView').classList.add('hidden');
        document.getElementById('myUploadsView').classList.remove('hidden');
    }

    showMyLikes() {
        if (!this.currentUser) return;

        const likes = this.packs.filter(p => this.currentUser.likedPacks.includes(p.id));
        const container = document.getElementById('myLikesList');
        container.innerHTML = likes.map(pack => this.createPackCard(pack)).join('');

        document.getElementById('accountModal').classList.add('hidden');
        document.getElementById('homeView').classList.add('hidden');
        document.getElementById('packDetailView').classList.add('hidden');
        document.getElementById('myLikesView').classList.remove('hidden');
    }

    // ===== Navigation =====
    backToHome() {
        document.getElementById('homeView').classList.remove('hidden');
        document.getElementById('packDetailView').classList.add('hidden');
        document.getElementById('myUploadsView').classList.add('hidden');
        document.getElementById('myLikesView').classList.add('hidden');
    }

    // ===== Gallery & Lightbox =====
    openLightbox(src) {
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightboxImage');
        img.src = src;
        lightbox.classList.remove('hidden');
        lightbox.style.display = 'flex';
        lightbox.style.alignItems = 'center';
        lightbox.style.justifyContent = 'center';
        
        this.currentGalleryIndex = this.currentPack.gallery.indexOf(src);
    }

    closeLightbox() {
        document.getElementById('lightbox').classList.add('hidden');
    }

    prevImage() {
        if (this.currentGalleryIndex > 0) {
            this.currentGalleryIndex--;
            this.openLightbox(this.currentPack.gallery[this.currentGalleryIndex]);
        }
    }

    nextImage() {
        if (this.currentGalleryIndex < this.currentPack.gallery.length - 1) {
            this.currentGalleryIndex++;
            this.openLightbox(this.currentPack.gallery[this.currentGalleryIndex]);
        }
    }

    // ===== Tabs =====
    switchTab(e) {
        const tabName = e.target.dataset.tab;
        
        // Remove active from all
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Add active to current
        e.target.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    // ===== Notifications =====
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">×</button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PepperApp();
});
