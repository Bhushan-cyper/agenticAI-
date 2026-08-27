import { create } from 'zustand';
import api from '../services/api';
import { joinUserRoom, joinAdminRoom } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  theme: 'dark', // Default to sleek dark mode

  initAuth: async () => {
    if (typeof window === 'undefined') return;

    // Load theme
    const savedTheme = localStorage.getItem('campusmind_theme') || 'dark';
    set({ theme: savedTheme });
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const token = localStorage.getItem('campusmind_token');
    const savedUser = localStorage.getItem('campusmind_user');

    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        set({ user: parsed, token, isAuthenticated: true });
        joinUserRoom(parsed.id || parsed._id);
        if (parsed.role === 'admin') joinAdminRoom();
      }

      // Validate session with /auth/me
      const res = await api.get('/auth/me');
      if (res.data.success) {
        const user = res.data.user;
        localStorage.setItem('campusmind_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isLoading: false });
        joinUserRoom(user.id || user._id);
        if (user.role === 'admin') joinAdminRoom();
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      localStorage.removeItem('campusmind_token');
      localStorage.removeItem('campusmind_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data;

      localStorage.setItem('campusmind_token', token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      joinUserRoom(user.id || user._id);
      if (user.role === 'admin') joinAdminRoom();

      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.message
        || (!err.response
          ? 'Unable to connect to the backend server. If using Render free-tier, the server may take ~30-45s to wake up on first load. Please check your backend URL and try again.'
          : 'Login failed. Please check your credentials.');
      return { success: false, message };
    }
  },

  register: async ({ name, email, password, role = 'student' }) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { user, token } = res.data;

      localStorage.setItem('campusmind_token', token);
      localStorage.setItem('campusmind_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      joinUserRoom(user.id || user._id);
      if (user.role === 'admin') joinAdminRoom();

      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      const validationErrors = err.response?.data?.errors
        ?.map((validationError) => validationError.message)
        .filter(Boolean)
        .join(', ');
      const message = validationErrors
        || err.response?.data?.message
        || (!err.response
          ? 'Unable to connect to the backend server. If using Render free-tier, the server may take ~30-45s to wake up on first load. Please verify your Render URL and try again.'
          : 'Registration failed. Please try again.');
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('campusmind_token');
    localStorage.removeItem('campusmind_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    localStorage.setItem('campusmind_theme', next);

    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
