// Main App Module
class PepperApp {
    constructor() {
        this.packList = [];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupFormHandlers();
        this.setupPackInteractions();
        this.setupTabHandlers();
        this.updateUI();
        this.loadHomePage();
    }

    loadHomePage() {
        this.updateHomeStats();
    }

    updateHomeStats() {
        const updateStats = async () => {
            let userCount = 0;
            let likeCount = 0;
            let packCount = 0;

            if (SupabaseService?.isReady?.()) {
                try {
                    [userCount, likeCount, packCount] = await Promise.all([
                        SupabaseService.getUserCount(),
                        SupabaseService.getTotalLikes(),
                        SupabaseService.getPackCount()
                    ]);
                } catch (error) {
                    console.error('Failed to fetch stats from Supabase:', error);
                }
            }

            const usersElement = document.getElementById('homeUsersCount');
            const likesElement = document.getElementById('homeLikesCount');
            const packsElement = document.getElementById('homePacksCount');

            if (usersElement) usersElement.textContent = uiManager.formatNumber(userCount);
            if (likesElement) likesElement.textContent = uiManager.formatNumber(likeCount);
            if (packsElement) packsElement.textContent = uiManager.formatNumber(packCount);
        };

        updateStats();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });

        document.getElementById('appLogo')?.addEventListener('click', () => {
            this.navigateTo('home');
        });
    }

    openUploadModal() {
        if (!authManager.isLoggedIn()) {
            uiManager.showNotification('Please login to upload', 'error');
            uiManager.openModal('authModal');
            return;
        }
        uiManager.openModal('uploadModal');
    }

    navigateTo(page) {
        // Hide all pages with animation
        document.querySelectorAll('.page').forEach(p => {
            p.classList.add('hidden');
            p.style.animation = 'none';
        });

        // Show target page with animation
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            targetPage.style.animation = 'fadeInUp 0.5s ease';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Load browse page data if needed
        if (page === 'browse') {
            setTimeout(() => this.loadBrowsePage(), 100);
        }

        if (page === 'home') {
            this.loadHomePage();
        }

        // Load detail page if needed
        if (page === 'detail') {
            // Detail page is loaded by viewPackDetail
        }
    }

    setupFormHandlers() {
        // Login Form
        document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                uiManager.showNotification('Please fill in all fields', 'error');
                return;
            }

            if (await authManager.login(email, password)) {
                uiManager.showNotification('Logged in successfully!', 'success');
                uiManager.closeModal(document.getElementById('authModal'));
                this.updateUI();
                this.updateHomeStats();
            } else {
                uiManager.showNotification('Invalid email or password', 'error');
            }
        });

        // Register Form
        document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value.trim();
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!email || !username || !password || !confirmPassword) {
                uiManager.showNotification('Please fill in all fields', 'error');
                return;
            }

            if (password !== confirmPassword) {
                uiManager.showNotification('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                uiManager.showNotification('Password must be at least 6 characters', 'error');
                return;
            }

            if (await authManager.register(email, username, password)) {
                uiManager.showNotification('Account created successfully!', 'success');
                uiManager.closeModal(document.getElementById('authModal'));
                this.updateUI();
                this.updateHomeStats();
            } else {
                uiManager.showNotification('Email already registered', 'error');
            }
        });

        // Upload Pack Form
        document.getElementById('uploadPackForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!authManager.isLoggedIn()) {
                uiManager.showNotification('Please login first', 'error');
                return;
            }

            const name = document.getElementById('uploadName').value.trim();
            const category = document.getElementById('uploadCategory').value;
            const description = document.getElementById('uploadDescription').value.trim();
            const fileInput = document.getElementById('uploadFile');
            const file = fileInput?.files?.[0];

            if (!name || !category || !description) {
                uiManager.showNotification('Please fill in all required fields', 'error');
                return;
            }

            if (!file) {
                uiManager.showNotification('Please choose a ZIP file to upload', 'error');
                return;
            }

            if (!file.name.toLowerCase().endsWith('.zip')) {
                uiManager.showNotification('Only .zip pack uploads are allowed', 'error');
                return;
            }

            const packData = {
                name: name,
                author: authManager.getCurrentUser().username,
                category: category,
                description: description,
                fullDescription: document.getElementById('uploadFullDescription').value || description,
                version: document.getElementById('uploadVersion').value || "1.0.0",
                cover: "https://wiki.megolm.com/images/b/b7/Minecraft_Oak_Leaves.jpg",
                gallery: [],
                tags: (document.getElementById('uploadTags').value || 'minecraft').split(',').map(t => t.trim()).filter(Boolean),
                compatibility: ["1.20"],
                uploadedBy: authManager.getCurrentUser().username,
                featured: false,
                downloads: 0,
                likes: 0,
                rating: 4.5,
                uploadDate: new Date().toISOString(),
                versions: [{
                    version: "1.0.0",
                    date: new Date().toLocaleDateString(),
                    changelog: "Initial release"
                }],
                downloadUrl: '',
                filePath: ''
            };

            if (SupabaseService?.isReady?.()) {
                try {
                    uiManager.showNotification('Uploading ZIP file to Supabase...', 'info');
                    const { publicUrl, path } = await SupabaseService.uploadPackZip(file);
                    packData.downloadUrl = publicUrl;
                    packData.filePath = path;
                } catch (error) {
                    console.error(error);
                    uiManager.showNotification('Supabase upload failed. Check configuration and try again.', 'error');
                    return;
                }
            }

            let newPack;
            if (SupabaseService?.isReady?.()) {
                try {
                    newPack = await SupabaseService.savePackMetadata(packData);
                } catch (error) {
                    console.error(error);
                    uiManager.showNotification('Unable to save pack metadata to Supabase.', 'error');
                    return;
                }
            } else {
                uiManager.showNotification('Supabase is not configured. Uploads are disabled.', 'error');
                return;
            }

            if (newPack && newPack.id) {
                await authManager.addUploadedPack(newPack.id);
                this.packList.unshift(newPack);
            }

            uiManager.showNotification('Pack uploaded successfully!', 'success');
            uiManager.closeModal(document.getElementById('uploadModal'));
            document.getElementById('uploadPackForm').reset();
            this.updateUI();
            this.navigateTo('browse');
        });

        // Auth Toggle
        document.getElementById('toggleRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
            document.getElementById('registerToggleP').classList.add('hidden');
            document.getElementById('loginToggleP').classList.remove('hidden');
        });

        document.getElementById('toggleLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('loginToggleP').classList.add('hidden');
            document.getElementById('registerToggleP').classList.remove('hidden');
        });

        // Account button
        document.getElementById('accountButton')?.addEventListener('click', () => {
            uiManager.openModal('authModal');
        });

        // Upload button
        document.getElementById('uploadBtn')?.addEventListener('click', () => {
            if (!authManager.isLoggedIn()) {
                uiManager.showNotification('Please login to upload', 'error');
                uiManager.openModal('authModal');
            } else {
                uiManager.openModal('uploadModal');
            }
        });

        // Profile Form
        document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const displayName = document.getElementById('profileDisplayName').value.trim();
            const avatarUrlInput = document.getElementById('profileAvatarUrl').value.trim();
            const avatarFile = document.getElementById('profileAvatarFile')?.files?.[0];
            const bio = document.getElementById('profileBio').value.trim();

            let avatarUrl = avatarUrlInput || '';
            if (avatarFile) {
                if (!SupabaseService?.isReady?.()) {
                    uiManager.showNotification('Supabase is not configured. Cannot upload an avatar image.', 'error');
                    return;
                }

                try {
                    const { publicUrl } = await SupabaseService.uploadProfileAvatar(avatarFile);
                    avatarUrl = publicUrl;
                } catch (error) {
                    console.error('Avatar upload failed:', error);
                    uiManager.showNotification('Avatar upload failed. Try a different image.', 'error');
                    return;
                }
            }

            if (await authManager.updateProfile({ displayName, bio, avatarUrl })) {
                uiManager.showNotification('Profile updated successfully!', 'success');
                this.updateUI();
            } else {
                uiManager.showNotification('Failed to update profile', 'error');
            }
        });
    }

    setupPackInteractions() {
        // Pack card clicks
        document.addEventListener('click', (e) => {
            const packCard = e.target.closest('.pack-card');
            if (packCard && !e.target.closest('button')) {
                const packId = parseInt(packCard.dataset.packId);
                this.viewPackDetail(packId);
            }
        });

        // Like button
        document.addEventListener('click', async (e) => {
            const likeTarget = e.target.closest('#likePack');
            if (likeTarget) {
                e.preventDefault();
                const packIdInput = document.getElementById('detailPackId');
                if (!packIdInput) return;

                const packId = parseInt(packIdInput.value);
                if (!authManager.isLoggedIn()) {
                    uiManager.showNotification('Please login to like packs', 'error');
                    return;
                }

                const pack = this.getPackById(packId);
                const wasLiked = authManager.isPackLiked(packId);
                const success = await authManager.toggleLike(packId);

                if (success && pack) {
                    pack.likes += wasLiked ? -1 : 1;
                    const packLikesEl = document.getElementById('packLikes');
                    const isLiked = authManager.isPackLiked(packId);

                    if (packLikesEl) {
                        packLikesEl.textContent = uiManager.formatNumber(pack.likes);
                        packLikesEl.style.animation = 'pulse 0.3s ease';
                    }

                    likeTarget.classList.toggle('liked', isLiked);
                    likeTarget.textContent = isLiked ? '❤️ Liked' : '🤍 Like';
                    uiManager.showNotification(isLiked ? 'Added to likes' : 'Removed from likes', 'success');

                    if (SupabaseService?.isReady?.()) {
                        SupabaseService.updatePackLikes(packId, pack.likes).catch(error => {
                            console.error('Failed to update pack likes in Supabase:', error);
                        });
                    }
                }
            }
        });

        // Download button
        document.addEventListener('click', (e) => {
            const downloadTarget = e.target.closest('#downloadPack');
            if (downloadTarget) {
                e.preventDefault();
                const packIdInput = document.getElementById('detailPackId');
                if (!packIdInput) return;

                const packId = parseInt(packIdInput.value);
                const pack = this.getPackById(packId);
                if (pack) {
                    pack.downloads++;

                    if (SupabaseService?.isReady?.()) {
                        SupabaseService.updatePackDownloads(packId, pack.downloads).catch(error => {
                            console.error('Failed to update downloads in Supabase:', error);
                        });
                    }

                    const packDownloadsEl = document.getElementById('packDownloads');
                    if (packDownloadsEl) {
                        packDownloadsEl.textContent = uiManager.formatNumber(pack.downloads);
                        packDownloadsEl.style.animation = 'pulse 0.3s ease';
                    }

                    if (pack.downloadUrl) {
                        window.open(pack.downloadUrl, '_blank');
                    }

                    uiManager.showNotification(`Downloading ${pack.name} v${pack.version}...`, 'success');
                }
            }
        });

        // Back button
        document.getElementById('backToDetail')?.addEventListener('click', () => {
            this.navigateTo('browse');
        });
    }

    setupTabHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                e.preventDefault();
                
                // Hide all panes
                document.querySelectorAll('[data-pane]').forEach(pane => {
                    pane.classList.add('hidden');
                    pane.style.animation = 'none';
                });

                // Remove active class from all tabs
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Show selected pane with animation
                const tabId = e.target.dataset.tab;
                const pane = document.querySelector(`[data-pane="${tabId}"]`);
                if (pane) {
                    pane.classList.remove('hidden');
                    pane.style.animation = 'fadeInUp 0.3s ease';
                }

                // Mark tab as active
                e.target.classList.add('active');
            }
        });
    }

    viewPackDetail(packId) {
        const pack = this.getPackById(packId);
        if (!pack) {
            uiManager.showNotification('Pack not found', 'error');
            return;
        }

        // Populate detail page
        document.getElementById('detailPackId').value = packId;
        document.getElementById('packName').textContent = pack.name;
        document.getElementById('packAuthor').textContent = `by ${pack.author}`;
        document.getElementById('packDescription').textContent = pack.description;
        document.getElementById('packVersion').textContent = pack.version;
        document.getElementById('packRating').textContent = pack.rating.toFixed(1);
        document.getElementById('packDownloads').textContent = uiManager.formatNumber(pack.downloads);
        document.getElementById('packLikes').textContent = uiManager.formatNumber(pack.likes);

        // Update cover
        const cover = document.getElementById('packCover');
        if (cover) {
            cover.style.backgroundImage = `url('${pack.cover}')`;
            cover.style.animation = 'fadeIn 0.5s ease';
        }

        // Update like button
        const likeBtn = document.getElementById('likePack');
        if (likeBtn) {
            const isLiked = authManager.isPackLiked(packId);
            likeBtn.classList.toggle('liked', isLiked);
            likeBtn.textContent = isLiked ? '❤️ Liked' : '🤍 Like';
        }

        // Render gallery
        this.renderGallery(pack);

        // Render versions
        this.renderVersions(pack);

        // Show upload version button only if user is the author
        const uploadBtn = document.getElementById('uploadVersionBtn');
        if (uploadBtn) {
            if (authManager.isLoggedIn() && authManager.getCurrentUser().username === pack.uploadedBy) {
                uploadBtn.style.display = 'inline-block';
            } else {
                uploadBtn.style.display = 'none';
            }
        }

        // Reset tabs to description
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('[data-pane]').forEach(pane => pane.classList.add('hidden'));
        const firstTab = document.querySelector('.tab-button');
        if (firstTab) {
            firstTab.classList.add('active');
            const paneId = firstTab.dataset.tab;
            const pane = document.querySelector(`[data-pane="${paneId}"]`);
            if (pane) pane.classList.remove('hidden');
        }

        // Navigate to detail page
        this.navigateTo('detail');
    }

    renderGallery(pack) {
        const gallery = document.getElementById('galleryGrid');
        if (!gallery) return;

        if (!pack.gallery || pack.gallery.length === 0) {
            gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No gallery images</p>';
            return;
        }

        gallery.innerHTML = pack.gallery.map((img, idx) => `
            <img src="${img}" alt="Pack screenshot ${idx + 1}" class="gallery-image" style="animation: fadeInUp 0.5s ease ${idx * 0.1}s both;">
        `).join('');

        // Lightbox
        gallery.querySelectorAll('.gallery-image').forEach((img, index) => {
            img.addEventListener('click', () => this.openLightbox(pack.gallery, index));
        });
    }

    renderVersions(pack) {
        const versions = document.getElementById('versionsList');
        if (!versions) return;

        if (!pack.versions || pack.versions.length === 0) {
            versions.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No versions available</p>';
            return;
        }

        versions.innerHTML = pack.versions.map((v, index) => `
            <div class="version-item" style="animation: fadeInUp 0.5s ease ${index * 0.1}s both;">
                <div class="version-header">
                    <span class="version-number">v${v.version}</span>
                    <span class="version-date">${v.date}</span>
                </div>
                <p class="version-changelog">${v.changelog}</p>
                <button class="btn btn-small btn-primary" onclick="app.downloadVersion('${pack.name}', '${v.version}')">
                    ⬇️ Download v${v.version}
                </button>
            </div>
        `).join('');
    }

    downloadVersion(packName, version) {
        uiManager.showNotification(`Downloading ${packName} v${version}...`, 'success');
    }

    openLightbox(images, startIndex) {
        let currentIndex = startIndex;
        const modal = document.createElement('div');
        modal.className = 'lightbox-modal';
        modal.style.animation = 'fadeIn 0.3s ease';
        modal.innerHTML = `
            <div class="lightbox-content" style="animation: slideInUp 0.3s ease;">
                <button class="lightbox-close">×</button>
                <button class="lightbox-prev">❮</button>
                <img src="${images[currentIndex]}" alt="Gallery image">
                <button class="lightbox-next">❯</button>
            </div>
        `;

        const updateImage = () => {
            modal.querySelector('img').src = images[currentIndex];
            modal.querySelector('img').style.animation = 'fadeIn 0.3s ease';
        };

        modal.querySelector('.lightbox-close').addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        });

        modal.querySelector('.lightbox-prev').addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateImage();
            }
        });

        modal.querySelector('.lightbox-next').addEventListener('click', () => {
            if (currentIndex < images.length - 1) {
                currentIndex++;
                updateImage();
            }
        });

        // Keyboard navigation
        const handleKeydown = (e) => {
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                currentIndex--;
                updateImage();
            } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
                currentIndex++;
                updateImage();
            } else if (e.key === 'Escape') {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => modal.remove(), 300);
                document.removeEventListener('keydown', handleKeydown);
            }
        };

        document.addEventListener('keydown', handleKeydown);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => modal.remove(), 300);
                document.removeEventListener('keydown', handleKeydown);
            }
        });

        document.body.appendChild(modal);
    }

    loadBrowsePage() {
        const searchInput = document.getElementById('searchInput');
        const headerSearchInput = document.getElementById('headerSearchInput');
        const sortFilter = document.getElementById('sortFilter');
        const browsePackGrid = document.getElementById('browsePackGrid');

        if (!browsePackGrid) return;

        // Show loading state
        browsePackGrid.style.opacity = '0.5';

        const loadPackData = async () => {
            if (SupabaseService?.isReady?.()) {
                try {
                    const remotePacks = await SupabaseService.fetchPacks();
                    if (Array.isArray(remotePacks)) {
                        this.packList = remotePacks;
                    }
                } catch (error) {
                    console.warn('Supabase pack fetch failed:', error);
                }
            }
        };

        const updateResults = () => {
            const searchTerm = (searchInput?.value || headerSearchInput?.value || '').toLowerCase();
            const sort = sortFilter?.value || 'downloads';

            let packs = [...this.packList];

            // Filter
            if (searchTerm) {
                packs = packs.filter(p =>
                    p.name.toLowerCase().includes(searchTerm) ||
                    p.author.toLowerCase().includes(searchTerm) ||
                    (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm)))
                );
            }

            // Sort
            packs.sort((a, b) => {
                switch (sort) {
                    case 'downloads': return b.downloads - a.downloads;
                    case 'likes': return b.likes - a.likes;
                    case 'rating': return b.rating - a.rating;
                    case 'recent': return new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0);
                    default: return 0;
                }
            });

            browsePackGrid.style.opacity = '1';
            uiManager.renderPackGrid(packs, 'browsePackGrid');

            if (packs.length === 0) {
                browsePackGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">No packs found. Try adjusting your filters.</p>';
            }
        };

        // Remove old listeners
        if (searchInput) {
            searchInput.onchange = null;
            searchInput.oninput = null;
            searchInput.addEventListener('input', () => {
                if (headerSearchInput) headerSearchInput.value = searchInput.value;
                updateResults();
            });
        }

        if (headerSearchInput) {
            headerSearchInput.oninput = null;
            headerSearchInput.addEventListener('input', () => {
                if (searchInput) searchInput.value = headerSearchInput.value;
                if (document.getElementById('browsePage')?.classList.contains('hidden')) {
                    this.navigateTo('browse');
                }
                updateResults();
            });
        }

        if (sortFilter) {
            sortFilter.onchange = null;
            sortFilter.addEventListener('change', updateResults);
        }

        // Initial load
        loadPackData().finally(updateResults);
    }

    markdownToHtml(markdown) {
        let html = markdown;
        html = html.replace(/# (.*?)\n/g, '<h2>$1</h2>');
        html = html.replace(/## (.*?)\n/g, '<h3>$1</h3>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n- (.*?)\n/g, '<li>$1</li>');
        html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    getPackById(packId) {
        return this.packList.find(pack => pack.id === packId);
    }

    updateUI() {
        uiManager.updateAccountButton();

        // Update account modal
        const logoutBtn = document.getElementById('logoutBtn');
        if (authManager.isLoggedIn()) {
            const user = authManager.getCurrentUser();
            document.getElementById('authForms').classList.add('hidden');
            document.getElementById('profileSection').classList.remove('hidden');

            // Populate profile form
            document.getElementById('profileDisplayName').value = user.displayName || user.username;
            document.getElementById('profileBio').value = user.bio || '';
            document.getElementById('profileAvatarUrl').value = user.avatarUrl || '';

            if (logoutBtn) logoutBtn.style.display = 'block';
        } else {
            document.getElementById('authForms').classList.remove('hidden');
            document.getElementById('profileSection').classList.add('hidden');
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    logout() {
        authManager.logout();
        uiManager.showNotification('Logged out successfully', 'success');
        this.updateUI();
        this.updateHomeStats();
        this.navigateTo('home');
    }
}

const LEGACY_STORAGE_KEYS = ['pepper_current_user', 'pepper_users', 'pepper_packs', 'pepper_user'];
const clearLegacyLocalStorage = () => {
    if (typeof localStorage === 'undefined') return;
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
};

// Initialize app when DOM is ready
let app;
const initializeApp = () => {
    clearLegacyLocalStorage();
    if (!app) {
        app = new PepperApp();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
