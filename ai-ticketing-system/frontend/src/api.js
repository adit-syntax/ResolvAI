/**
 * API Service — Centralized HTTP client for all backend calls.
 *
 * In production (Render), VITE_API_URL is set to the backend service URL.
 * In local development, requests go through the Vite dev proxy to localhost:8000.
 *
 * Authentication: All requests include the JWT Bearer token from localStorage.
 * On 401 response the token is cleared and the page reloads to trigger re-login.
 */

let BASE_URL = '/api';
if (import.meta.env.VITE_API_URL) {
  const apiUrl = import.meta.env.VITE_API_URL;
  BASE_URL = apiUrl.startsWith('http') ? `${apiUrl}/api` : `https://${apiUrl}/api`;
}

// ─── Auth Token Management ────────────────────────────────────────────────────

const TOKEN_KEY = 'resolv_jwt';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  // Also clear old sessionStorage keys if present (migration)
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('email');
}

/**
 * Decode a JWT payload without verification.
 * Used only to read non-sensitive claims (role, email) from a trusted server-signed token.
 */
export function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch {
    return null;
  }
}

// ─── Core Request ─────────────────────────────────────────────────────────────

async function request(url, options = {}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });

  // Token expired or invalid — log out and reload
  if (response.status === 401) {
    clearAuthToken();
    window.location.reload();
    return;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // 204 No Content
  if (response.status === 204) return null;

  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  /** Authenticate with email + password. Returns { access_token, role, email, name }. */
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  /** Self-registration for end users only. Returns { access_token, role, email, name }. */
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  /** Authenticate / Register with Google OAuth credentials. Returns { access_token, role, email, name }. */
  googleAuth: (payload) =>
    request('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),

  /** Get current user profile. */
  me: () => request('/auth/me'),

  /** Change current user's password. */
  changePassword: (current_password, new_password) =>
    request('/auth/me/password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) }),
};

// ─── Tickets ─────────────────────────────────────────────────────────────────

export const ticketApi = {
  create: (data) => request('/tickets/', { method: 'POST', body: JSON.stringify(data) }),
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([_, v]) => v))
    ).toString();
    return request(`/tickets/?${query}`);
  },
  listByEmail: (email) => request(`/tickets/?user_email=${encodeURIComponent(email)}`),
  get: (id) => request(`/tickets/${id}`),
  updateStatus: (id, data) => request(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  addNote: (id, data) => request(`/tickets/${id}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  getNotes: (id) => request(`/tickets/${id}/notes`),
  getTimeline: (id) => request(`/tickets/${id}/timeline`),
  submitFeedback: (id, data) => request(`/tickets/${id}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  escalate: (id) => request(`/tickets/${id}/escalate`, { method: 'POST' }),
  addReply: (id, data) => request(`/tickets/${id}/replies`, { method: 'POST', body: JSON.stringify(data) }),
  getReplies: (id) => request(`/tickets/${id}/replies`),
  giveReplyFeedback: (id, replyId, data) => request(`/tickets/${id}/replies/${replyId}/feedback`, { method: 'PATCH', body: JSON.stringify(data) }),
  getNotifications: (id) => request(`/tickets/${id}/notifications`),
  checkEscalations: () => request('/tickets/check-escalations', { method: 'POST' }),
  generateAIReply: (id) => request(`/tickets/${id}/generate-reply`, { method: 'POST' }),
  resetSeedData: () => request('/tickets/reset-seed', { method: 'POST' }),
  // Suggestions: internal comments from fellow (non-assigned) employees
  addSuggestion: (id, data) => request(`/tickets/${id}/suggestions`, { method: 'POST', body: JSON.stringify(data) }),
  getSuggestions: (id) => request(`/tickets/${id}/suggestions`),
};

// ─── Employees ───────────────────────────────────────────────────────────────

export const employeeApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== ''))
    ).toString();
    return request(`/employees/?${query}`);
  },
  get: (id) => request(`/employees/${id}`),
  create: (data) => request('/employees/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  departments: () => request('/employees/departments/list'),
  activeTickets: () => request('/employees/active-tickets'),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: () => request('/analytics/overview'),
  departmentLoad: () => request('/analytics/department-load'),
  topCategories: () => request('/analytics/top-categories'),
  severityDistribution: () => request('/analytics/severity-distribution'),
  resolutionTrend: () => request('/analytics/resolution-trend'),
  employeePerformance: () => request('/analytics/employee-performance'),
};

// ─── Settings & Integrations ─────────────────────────────────────────────────

export const settingsApi = {
  get: () => request('/settings/'),
  update: (data) => request('/settings/', { method: 'POST', body: JSON.stringify(data) }),
  testSlack: (webhook_url) => request('/settings/test-slack', { method: 'POST', body: JSON.stringify({ webhook_url }) }),
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => request('/health'),
};
