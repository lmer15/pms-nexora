// JWT utility functions for client-side token handling

export const jwtUtils = {
  // Decode JWT token without verification (client-side only)
  decodeToken: (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  },

  // Get user ID from JWT token
  getUserIdFromToken: (token: string): string | null => {
    const decoded = jwtUtils.decodeToken(token);
    return decoded?.userId || null;
  },

  // Get current user ID from stored token
  getCurrentUserId: (): string | null => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    return jwtUtils.getUserIdFromToken(token);
  }
};

export default jwtUtils;
