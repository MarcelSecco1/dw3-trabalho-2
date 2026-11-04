const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  const response = await fetch(API_URL + path, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new Error(payload?.message || 'Não foi possível concluir a operação.');
  }
  return payload;
}

export const login = (username, password) => request('/auth/login', {
  method: 'POST', body: JSON.stringify({ username, password }),
});

const resource = (path) => ({
  getAll: (token) => request(path, { token }),
  getById: (id, token) => request(path + '/' + id, { token }),
  insert: (data, token) => request(path, { method: 'POST', body: JSON.stringify(data), token }),
  update: (id, data, token) => request(path + '/' + id, { method: 'PUT', body: JSON.stringify(data), token }),
  remove: (id, token) => request(path + '/' + id, { method: 'DELETE', token }),
});

export const pacientesApi = resource('/pacientes');
export const consultasApi = resource('/consultas');
