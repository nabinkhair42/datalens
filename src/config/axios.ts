import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens or custom headers here
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<{ error?: string }>) => {
    // Don't hard-redirect on 401 — let AuthProvider handle it.
    // A full window.location.href reload destroys all client state (React Query cache,
    // form state, editor content). Instead, just reject so React Query's retry/error
    // handling and the auth provider's session check coordinate the redirect.

    // Extract the actual error message from the API response body
    // so callers get meaningful messages instead of "Request failed with status code XXX"
    const serverMessage = error.response?.data?.error;
    if (serverMessage) {
      error.message = serverMessage;
    }

    return Promise.reject(error);
  },
);

// Typed request helpers
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}

export default apiClient;
