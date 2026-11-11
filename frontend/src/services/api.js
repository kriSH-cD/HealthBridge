import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sehatsetu_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on unauthorized
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('sehatsetu_token');
        localStorage.removeItem('sehatsetu_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    return res.data;
  },
  register: async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateLanguage: async (preferred_language) => {
    const res = await api.put('/auth/language', { preferred_language });
    return res.data;
  },
};

export const directoryApi = {
  getDoctors: async (params) => {
    const res = await api.get('/users/doctors', { params });
    return res.data;
  },
  getPharmacies: async (params) => {
    const res = await api.get('/users/pharmacies', { params });
    return res.data;
  },
  getPatients: async () => {
    const res = await api.get('/users/patients');
    return res.data;
  },
};

export const appointmentsApi = {
  list: async () => {
    const res = await api.get('/appointments');
    return res.data;
  },
  book: async (payload) => {
    const res = await api.post('/appointments', payload);
    return res.data;
  },
  setStatus: async (id, status) => {
    const res = await api.patch(`/appointments/${id}/status`, { status });
    return res.data;
  },
};

export const medicinesApi = {
  catalog: async (q) => {
    const res = await api.get('/medicines/catalog', { params: { q } });
    return res.data;
  },
  availability: async (q) => {
    const res = await api.get('/medicines/availability', { params: { q } });
    return res.data;
  },
  inventory: async () => {
    const res = await api.get('/medicines/inventory');
    return res.data;
  },
  setStock: async (id, stock_quantity) => {
    const res = await api.patch(`/medicines/inventory/${id}`, { stock_quantity });
    return res.data;
  },
};

export const prescriptionsApi = {
  list: async (params) => {
    const res = await api.get('/prescriptions', { params });
    return res.data;
  },
  get: async (idOrNumber) => {
    const res = await api.get(`/prescriptions/${idOrNumber}`);
    return res.data;
  },
  create: async (payload) => {
    const res = await api.post('/prescriptions', payload);
    return res.data;
  },
  dispense: async (id) => {
    const res = await api.post(`/prescriptions/${id}/dispense`);
    return res.data;
  },
};

export const systemApi = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
  getDirectApiHealth: async () => {
    // Tests exact GET /api/health specification
    const res = await axios.get('/api/health');
    return res.data;
  },
  seedDemoData: async () => {
    const res = await api.post('/seed/seed-demo-data');
    return res.data;
  },
};

export default api;

