const SupabaseService = {
    client: null,

    init() {
        if (typeof supabase === 'undefined') {
            console.warn('Supabase library is not loaded yet.');
            return;
        }

        const config = window.PEPPER_SUPABASE;
        const placeholderUrl = 'REPLACE_WITH_SUPABASE_URL';
        const placeholderKey = 'REPLACE_WITH_SUPABASE_ANON_KEY';

        if (!config?.url || !config?.anonKey || config.url === placeholderUrl || config.anonKey === placeholderKey) {
            console.warn('Supabase configuration is missing, incorrect, or still using placeholder values.');
            return;
        }

        this.client = supabase.createClient(config.url, config.anonKey);
    },

    isReady() {
        if (!this.client && typeof supabase !== 'undefined') {
            this.init();
        }
        return Boolean(this.client);
    },

    getBucketName() {
        return 'packs';
    },

    async uploadPackZip(file) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const filename = `${Date.now()}-${file.name.toLowerCase().replace(/\s+/g, '-')}`;
        const path = `uploads/${filename}`;

        const { data, error } = await this.client.storage.from(this.getBucketName()).upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/zip'
        });

        if (error) {
            throw error;
        }

        const { data: publicData, error: publicError } = await this.client.storage.from(this.getBucketName()).getPublicUrl(data.path);
        if (publicError) {
            throw publicError;
        }

        return {
            path: data.path,
            publicUrl: publicData?.publicUrl || ''
        };
    },

    async savePackMetadata(packData) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('packs').insert([packData]).select().single();
        if (error) {
            throw error;
        }

        return data;
    },

    async fetchPacks() {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('packs').select('*').order('uploadDate', { ascending: false }).limit(200);
        if (error) {
            throw error;
        }

        return data || [];
    },

    async fetchUserByEmail(email) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('users').select('*').eq('email', email).single();
        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data || null;
    },

    async createUser(userData) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('users').insert([userData]).select().single();
        if (error) {
            throw error;
        }

        return data;
    },

    async updateUserUploads(email, uploadedPacks) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('users').update({ uploaded_packs: uploadedPacks }).eq('email', email).select().single();
        if (error) {
            throw error;
        }

        return data;
    },

    async updateUserLikes(email, likedPacks) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('users').update({ liked_packs: likedPacks }).eq('email', email).select().single();
        if (error) {
            throw error;
        }

        return data;
    },

    async updateProfile(email, profileUpdates) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('users').update(profileUpdates).eq('email', email).select().single();
        if (error) {
            throw error;
        }

        return data;
    },

    async getUserCount() {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { count, error } = await this.client.from('users').select('*', { count: 'exact', head: true });
        if (error) {
            throw error;
        }

        return count || 0;
    },

    async getPackCount() {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { count, error } = await this.client.from('packs').select('*', { count: 'exact', head: true });
        if (error) {
            throw error;
        }

        return count || 0;
    },

    async getTotalLikes() {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('packs').select('likes');
        if (error) {
            throw error;
        }

        return data.reduce((sum, pack) => sum + (pack.likes || 0), 0);
    },

    async updatePackDownloads(packId, downloads) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('packs').update({ downloads }).eq('id', packId).select().single();
        if (error) {
            throw error;
        }

        return data;
    },

    async updatePackLikes(packId, likes) {
        if (!this.client) {
            throw new Error('Supabase client is not initialized');
        }

        const { data, error } = await this.client.from('packs').update({ likes }).eq('id', packId).select().single();
        if (error) {
            throw error;
        }

        return data;
    },
};
