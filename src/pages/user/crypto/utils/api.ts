export const API = import.meta.env.VITE_API_URL;

import axios from 'axios';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length) return String(message[0]);
  }
  return fallback;
}

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}
