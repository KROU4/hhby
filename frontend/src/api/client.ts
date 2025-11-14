import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and rate limits
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    } else if (error.response?.status === 429) {
      // Handle rate limit / subscription limit
      // Import dynamically to avoid circular dependencies
      import('../store/upgradeModalStore').then(({ useUpgradeModalStore }) => {
        const { openModal } = useUpgradeModalStore.getState();
        openModal('limit_reached');
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
