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

    login(email, password) {
        const user = dataManager.loginUser(email, password);
        if (user) {
            this.currentUser = user;
            this.saveCurrentUser();
            return true;
        }
        return false;
    }

    register(email, username, password) {
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

    toggleLike(packId) {
        if (!this.currentUser) return false;
        const pack = dataManager.getPack(packId);
        if (!pack) return false;

        const index = this.currentUser.likedPacks.indexOf(packId);
        if (index > -1) {
            this.currentUser.likedPacks.splice(index, 1);
            pack.likes--;
        } else {
            this.currentUser.likedPacks.push(packId);
            pack.likes++;
        }

        this.saveCurrentUser();
        dataManager.savePacks();
        return true;
    }

    isPackLiked(packId) {
        return this.currentUser?.likedPacks.includes(packId) || false;
    }

    addUploadedPack(packId) {
        if (this.currentUser) {
            this.currentUser.uploadedPacks.push(packId);
            this.saveCurrentUser();
        }
    }
}

const authManager = new AuthManager();
