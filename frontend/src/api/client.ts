import axios from 'axios';

// Create a configured axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8002',
  headers: {
    'Content-Type': 'application/json',
  },
});
