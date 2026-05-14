// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
    }

    loadCurrentUser() {
        return null;
    }

    saveCurrentUser() {
        return;
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

        if (!SupabaseService?.isReady?.()) {
            console.warn('Supabase is not configured or unavailable.');
            return false;
        }

        try {
            const user = await SupabaseService.fetchUserByEmail(email);
            if (user && user.password_hash === passwordHash) {
                this.currentUser = {
                    email: user.email,
                    username: user.username,
                    likedPacks: user.liked_packs || [],
                    uploadedPacks: user.uploaded_packs || [],
                    displayName: user.display_name || user.username,
                    bio: user.bio || '',
                    avatarUrl: user.avatar_url || ''
                };
                this.saveCurrentUser();
                return true;
            }
        } catch (error) {
            console.error('Supabase login error:', error);
        }

        return false;
    }

    async register(email, username, password) {
        const passwordHash = await this.hashPassword(password);

        if (!SupabaseService?.isReady?.()) {
            console.warn('Supabase is not configured or unavailable.');
            return false;
        }

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
                uploaded_packs: [],
                display_name: username,
                bio: '',
                avatar_url: ''
            });

            if (user) {
                this.currentUser = {
                    email: user.email,
                    username: user.username,
                    likedPacks: [],
                    uploadedPacks: [],
                    displayName: user.display_name || user.username,
                    bio: user.bio || '',
                    avatarUrl: user.avatar_url || ''
                };
                this.saveCurrentUser();
                return true;
            }
        } catch (error) {
            console.error('Supabase register error:', error);
            return false;
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

        const index = this.currentUser.likedPacks.indexOf(packId);
        if (index > -1) {
            this.currentUser.likedPacks.splice(index, 1);
        } else {
            this.currentUser.likedPacks.push(packId);
        }

        if (SupabaseService?.isReady?.()) {
            try {
                await SupabaseService.updateUserLikes(this.currentUser.email, this.currentUser.likedPacks);
            } catch (error) {
                console.error('Failed to update Supabase liked packs:', error);
                return false;
            }
        }

        return true;
    }

    async addUploadedPack(packId) {
        if (!this.currentUser) return false;

        const uploadedPacks = [...(this.currentUser.uploadedPacks || []), packId];
        if (SupabaseService?.isReady?.()) {
            try {
                await SupabaseService.updateUserUploads(this.currentUser.email, uploadedPacks);
                this.currentUser.uploadedPacks = uploadedPacks;
                return true;
            } catch (error) {
                console.error('Failed to update uploaded packs in Supabase:', error);
                return false;
            }
        }

        return false;
    }

    isPackLiked(packId) {
        return this.currentUser?.likedPacks.includes(packId) || false;
    }

    async updateProfile(profileData) {
        if (!this.currentUser) return false;

        if (!SupabaseService?.isReady?.()) {
            console.warn('Supabase is not configured or unavailable.');
            return false;
        }

        const updates = {
            displayName: profileData.displayName || this.currentUser.displayName,
            bio: profileData.bio || this.currentUser.bio
        };
        if (profileData.avatarUrl) {
            updates.avatarUrl = profileData.avatarUrl;
        }

        try {
            await SupabaseService.updateProfile(this.currentUser.email, {
                display_name: updates.displayName,
                bio: updates.bio,
                ...(updates.avatarUrl ? { avatar_url: updates.avatarUrl } : {})
            });

            this.currentUser = { ...this.currentUser, ...updates };
            this.saveCurrentUser();
            return true;
        } catch (error) {
            console.error('Failed to update Supabase profile:', error);
            return false;
        }
    }
}

const authManager = new AuthManager();
