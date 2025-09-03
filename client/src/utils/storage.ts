// Local storage helper functions

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  FACILITY: 'current_facility'
};

export const storage = {
  // Token management
  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  // User data management
  setUser: (user: any): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): any => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Facility management
  setFacility: (facility: any): void => {
    localStorage.setItem(STORAGE_KEYS.FACILITY, JSON.stringify(facility));
  },

  getFacility: (): any => {
    const facility = localStorage.getItem(STORAGE_KEYS.FACILITY);
    return facility ? JSON.parse(facility) : null;
  },

  removeFacility: (): void => {
    localStorage.removeItem(STORAGE_KEYS.FACILITY);
  },

  // Clear all auth-related data
  clearAuthData: (): void => {
    storage.removeToken();
    storage.removeUser();
    storage.removeFacility();
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!storage.getToken();
  }
};

export default storage;