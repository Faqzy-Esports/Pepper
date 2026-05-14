// Data Management Module
class DataManager {
    constructor() {
        this.packs = this.loadPacks();
        this.users = this.loadUsers();
    }

    // ===== Pack Management =====
    loadPacks() {
        const stored = localStorage.getItem('pepper_packs');
        return stored ? JSON.parse(stored) : this.getDefaultPacks();
    }

    savePacks() {
        localStorage.setItem('pepper_packs', JSON.stringify(this.packs));
    }

    setPacks(packs) {
        if (Array.isArray(packs)) {
            this.packs = packs;
            this.savePacks();
        }
    }

    getDefaultPacks() {
        return [];
    }

    addPack(packData) {
        const nextId = this.packs.length ? Math.max(...this.packs.map(p => p.id)) + 1 : 1;
        const newPack = {
            id: nextId,
            ...packData,
            downloads: 0,
            likes: 0,
            featured: false,
            uploadDate: new Date().toISOString().split('T')[0],
            versions: [{ version: packData.version || "1.0.0", date: new Date().toISOString().split('T')[0], changelog: "Initial release", downloads: 0 }],
            tags: packData.tags || [],
            compatibility: packData.compatibility || ["1.20"],
            rating: 5,
            downloads_all_time: 0
        };
        this.packs.push(newPack);
        this.savePacks();
        return newPack;
    }

    updatePackVersion(packId, versionData) {
        const pack = this.packs.find(p => p.id === packId);
        if (pack) {
            pack.versions.unshift(versionData);
            pack.version = versionData.version;
            this.savePacks();
        }
        return pack;
    }

    getPack(id) {
        return this.packs.find(p => p.id === id);
    }

    searchPacks(query) {
        const q = query.toLowerCase();
        return this.packs.filter(p => 
            p.name.toLowerCase().includes(q) ||
            p.author.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    // ===== User Management =====
    loadUsers() {
        const stored = localStorage.getItem('pepper_users');
        return stored ? JSON.parse(stored) : {};
    }

    saveUsers() {
        localStorage.setItem('pepper_users', JSON.stringify(this.users));
    }

    registerUser(email, username, password) {
        if (this.users[email]) return null;
        this.users[email] = {
            email,
            username,
            password,
            likedPacks: [],
            uploadedPacks: [],
            createdAt: new Date().toISOString()
        };
        this.saveUsers();
        return this.users[email];
    }

    loginUser(email, password) {
        const user = this.users[email];
        if (user && user.password === password) {
            return { email, username: user.username, likedPacks: user.likedPacks, uploadedPacks: user.uploadedPacks };
        }
        return null;
    }

    updateUser(email, updates) {
        if (this.users[email]) {
            this.users[email] = { ...this.users[email], ...updates };
            this.saveUsers();
        }
    }

    getUser(email) {
        return this.users[email];
    }
}

// Export
const dataManager = new DataManager();
