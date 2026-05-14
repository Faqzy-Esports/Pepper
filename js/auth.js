// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
    }

    loadCurrentUser() {
        const stored = localStorage.getItem('pepper_current_user');
        return stored ? JSON.parse(stored) : null;
    }

    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('pepper_current_user', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('pepper_current_user');
        }
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async login(email, password) {
        const passwordHash = await this.hashPassword(password);

        if (SupabaseService?.isReady?.()) {
            try {
                const user = await SupabaseService.fetchUserByEmail(email);
                if (user && user.password_hash === passwordHash) {
                    this.currentUser = {
                        email: user.email,
                        username: user.username,
                        likedPacks: user.liked_packs || [],
                        uploadedPacks: user.uploaded_packs || []
                    };
                    this.saveCurrentUser();
                    return true;
                }
            } catch (error) {
                console.error('Supabase login error:', error);
            }
        }

        const user = dataManager.loginUser(email, password);
        if (user) {
            this.currentUser = user;
            this.saveCurrentUser();
            return true;
        }
        return false;
    }

    async register(email, username, password) {
        const passwordHash = await this.hashPassword(password);

        if (SupabaseService?.isReady?.()) {
            try {
                const existing = await SupabaseService.fetchUserByEmail(email);
                if (existing) {
                    return false;
                }

                const user = await SupabaseService.createUser({
                    email,
                    username,
                    password_hash: passwordHash,
                    liked_packs: [],
                    uploaded_packs: []
                });

                if (user) {
                    this.currentUser = {
                        email: user.email,
                        username: user.username,
                        likedPacks: [],
                        uploadedPacks: []
                    };
                    this.saveCurrentUser();
                    return true;
                }
            } catch (error) {
                console.error('Supabase register error:', error);
                return false;
            }
        }

        const user = dataManager.registerUser(email, username, password);
        if (user) {
            this.currentUser = { email, username, likedPacks: [], uploadedPacks: [] };
            this.saveCurrentUser();
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        this.saveCurrentUser();
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async toggleLike(packId) {
        if (!this.currentUser) return false;
        const pack = dataManager.getPack(packId);
        if (!pack) return false;

        const index = this.currentUser.likedPacks.indexOf(packId);
        if (index > -1) {
            this.currentUser.likedPacks.splice(index, 1);
            pack.likes = Math.max(0, pack.likes - 1);
        } else {
            this.currentUser.likedPacks.push(packId);
            pack.likes++;
        }

        this.saveCurrentUser();
        dataManager.savePacks();

        if (SupabaseService?.isReady?.()) {
            try {
                await SupabaseService.updateUserLikes(this.currentUser.email, this.currentUser.likedPacks);
            } catch (error) {
                console.error('Failed to update Supabase liked packs:', error);
            }
        }

        return true;
    }

    isPackLiked(packId) {
        return this.currentUser?.likedPacks.includes(packId) || false;
    }

    async addUploadedPack(packId) {
        if (!this.currentUser) return;
        if (!this.currentUser.uploadedPacks.includes(packId)) {
            this.currentUser.uploadedPacks.push(packId);
            this.saveCurrentUser();
        }

        if (SupabaseService?.isReady?.()) {
            try {
                await SupabaseService.updateUserUploads(this.currentUser.email, this.currentUser.uploadedPacks);
            } catch (error) {
                console.error('Failed to update Supabase uploaded packs:', error);
            }
        }
    }
}

const authManager = new AuthManager();
