// Storage utility with fallback for mobile browsers that block localStorage

class StorageService {
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private isSessionStorageAvailable(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private memoryStorage: Map<string, string> = new Map();

  setItem(key: string, value: string): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(key, value);
      } else if (this.isSessionStorageAvailable()) {
        sessionStorage.setItem(key, value);
      } else {
        // Fallback to memory storage for very restrictive browsers
        this.memoryStorage.set(key, value);
      }
    } catch (error) {
      console.warn('Storage setItem failed:', error);
      this.memoryStorage.set(key, value);
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.isLocalStorageAvailable()) {
        return localStorage.getItem(key);
      } else if (this.isSessionStorageAvailable()) {
        return sessionStorage.getItem(key);
      } else {
        return this.memoryStorage.get(key) || null;
      }
    } catch (error) {
      console.warn('Storage getItem failed:', error);
      return this.memoryStorage.get(key) || null;
    }
  }

  removeItem(key: string): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      } else if (this.isSessionStorageAvailable()) {
        sessionStorage.removeItem(key);
      } else {
        this.memoryStorage.delete(key);
      }
    } catch (error) {
      console.warn('Storage removeItem failed:', error);
      this.memoryStorage.delete(key);
    }
  }

  clear(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.clear();
      } else if (this.isSessionStorageAvailable()) {
        sessionStorage.clear();
      }
      this.memoryStorage.clear();
    } catch (error) {
      console.warn('Storage clear failed:', error);
      this.memoryStorage.clear();
    }
  }
}

export default new StorageService();