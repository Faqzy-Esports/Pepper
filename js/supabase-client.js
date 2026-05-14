const SupabaseService = {
    client: null,

    init() {
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
    }
};

SupabaseService.init();
