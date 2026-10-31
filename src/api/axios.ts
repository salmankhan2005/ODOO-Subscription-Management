// Centralized API client interface
// Conforms to VITE_API_BASE_URL (http://localhost:5000/api/v1) specification
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Simulates network delay for realism while remaining blazing fast (<100ms)
export const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
