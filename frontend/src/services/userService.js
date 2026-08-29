import api from './api.js';

export const userService = {
  async getAllUsers() {
    const res = await api.get('/users');
    return res.data || [];
  },

  async updateUserRole(id, role) {
    const res = await api.put(`/users/${id}/role`, { role });
    return res.data;
  },

  async deleteUser(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};
