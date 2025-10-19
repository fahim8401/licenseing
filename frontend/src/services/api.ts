import axios from 'axios';
import type { License, AllowedIP, LogsResponse, LogStats } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/v1';

// Get API key from session storage
const getApiKey = () => sessionStorage.getItem('apiKey') || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key to requests
api.interceptors.request.use((config) => {
  const apiKey = getApiKey();
  if (apiKey) {
    config.headers['X-API-KEY'] = apiKey;
  }
  return config;
});

// Auth
export const checkAuth = (apiKey: string) => {
  return api.get('/licenses', {
    headers: { 'X-API-KEY': apiKey },
  });
};

// Licenses
export const getLicenses = () => api.get<License[]>('/licenses');

export const getLicense = (id: number) => 
  api.get<License>(`/licenses/${id}`);

export const createLicense = (data: {
  name?: string;
  license_key?: string;
  expires_at?: string;
}) => api.post<License>('/licenses', data);

export const updateLicense = (id: number, data: {
  name?: string;
  active?: boolean;
  expires_at?: string;
}) => api.patch<License>(`/licenses/${id}`, data);

export const deleteLicense = (id: number) => 
  api.delete(`/licenses/${id}`);

// IPs
export const addIP = (licenseId: number, data: {
  ip_cidr: string;
  note?: string;
}) => api.post<AllowedIP>(`/licenses/${licenseId}/ips`, data);

export const removeIP = (licenseId: number, ipId: number) => 
  api.delete(`/licenses/${licenseId}/ips/${ipId}`);

export const getIPs = (licenseId: number) => 
  api.get<AllowedIP[]>(`/licenses/${licenseId}/ips`);

// Logs
export const getLogs = (params?: {
  page?: number;
  perPage?: number;
  result?: string;
  license_key?: string;
  start_date?: string;
  end_date?: string;
}) => api.get<LogsResponse>('/logs', { params });

export const getLogStats = () => 
  api.get<LogStats>('/logs/stats');

export default api;
