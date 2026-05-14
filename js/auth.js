// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    loadCurrentUser() {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        const raw = localStorage.getItem('pepper_current_user');
        if (!raw) {
            return null;
        }

        try {
            const user = JSON.parse(raw);
            if (user && user.email) {
                this.currentUser = user;
                if (user.avatarUrl && !user.avatarUrl.startsWith('http') && SupabaseService?.isReady?.()) {
                    this.resolveAvatarUrl(user.avatarUrl);
                }
                return this.currentUser;
            }
        } catch (error) {
            console.warn('Failed to parse persisted user data:', error);
        }

        return null;
    }

    async resolveAvatarUrl(avatarUrl) {
        try {
            const publicUrl = await SupabaseService.getPublicUrl(avatarUrl);
            if (publicUrl && this.currentUser) {
                this.currentUser.avatarUrl = publicUrl;
                this.saveCurrentUser();
                if (typeof app !== 'undefined' && app && typeof app.updateUI === 'function') {
                    app.updateUI();
                }
            }
        } catch (error) {
            console.warn('Unable to resolve stored avatar URL:', error);
        }
    }

    saveCurrentUser() {
        if (typeof localStorage === 'undefined') {
            return;
        }

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

    async normalizeUserRecord(user) {
        let avatarUrl = user.avatar_url || '';
        if (avatarUrl && !avatarUrl.startsWith('http') && SupabaseService?.isReady?.()) {
            try {
                avatarUrl = await SupabaseService.getPublicUrl(avatarUrl);
            } catch (error) {
                console.warn('Could not resolve stored avatar URL:', error);
            }
        }

        return {
            email: user.email,
            username: user.username,
            likedPacks: user.liked_packs || [],
            uploadedPacks: user.uploaded_packs || [],
            displayName: user.display_name || user.username,
            bio: user.bio || '',
            avatarUrl
        };
    }

    async login(email, password) {
        if (!SupabaseService?.isReady?.()) {
            console.warn('Supabase is not configured or unavailable.');
            return false;
        }

        try {
            const { data: loginData, error: loginError } = await SupabaseService.client.auth.signInWithPassword({
                email,
                password
            });

            if (loginError || !loginData?.session) {
                console.error('Supabase auth login error:', loginError);
                return false;
            }

            const user = await SupabaseService.fetchUserByEmail(email);
            if (user) {
                this.currentUser = await this.normalizeUserRecord(user);
                this.saveCurrentUser();
                return true;
            }
        } catch (error) {
            console.error('Supabase login error:', error);
        }

        return false;
    }

    async register(email, username, password) {
        if (!SupabaseService?.isReady?.()) {
            console.warn('Supabase is not configured or unavailable.');
            return false;
        }

        try {
            const existing = await SupabaseService.fetchUserByEmail(email);
            if (existing) {
                return false;
            }

            const { data: signUpData, error: signUpError } = await SupabaseService.client.auth.signUp({
                email,
                password
            });

            if (signUpError || !signUpData?.user) {
                console.error('Supabase auth register error:', signUpError);
                return false;
            }

            const user = await SupabaseService.createUser({
                email,
                username,
                password_hash: await this.hashPassword(password),
                liked_packs: [],
                uploaded_packs: [],
                display_name: username,
                bio: '',
                avatar_url: ''
            });

            if (user) {
                this.currentUser = await this.normalizeUserRecord(user);
                this.saveCurrentUser();
                return true;
            }
        } catch (error) {
            console.error('Supabase register error:', error);
            return false;
        }

        return false;
    }

    async logout() {
        if (SupabaseService?.isReady?.() && SupabaseService.client) {
            try {
                await SupabaseService.client.auth.signOut();
            } catch (error) {
                console.warn('Supabase auth sign out failed:', error);
            }
        }

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
            if (error?.message) {
                console.error('Profile update error message:', error.message);
            }
            return false;
        }
    }
}

const authManager = new AuthManager();
