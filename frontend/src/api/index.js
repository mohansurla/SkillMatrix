import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  getMentors: () => api.get('/users/mentors'),
  getMentorStudents: (params) => api.get('/users/mentor-students', { params }),
  assignMentor: (data) => api.post('/users/mentor-students', data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const skillsAPI = {
  getAll: (params) => api.get('/skills', { params }),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
};

export const modulesAPI = {
  getAll: (params) => api.get('/modules', { params }),
  getById: (id) => api.get(`/modules/${id}`),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
};

export const assignmentsAPI = {
  getAll: (params) => api.get('/assignments', { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
};

export const evaluationsAPI = {
  getAll: (params) => api.get('/evaluations', { params }),
  create: (data) => api.post('/evaluations', data),
};

export const progressAPI = {
  getProgress: (params) => api.get('/progress', { params }),
  getOverview: () => api.get('/progress/overview'),
  getRankings: (params) => api.get('/progress/rankings', { params }),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
