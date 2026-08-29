import api from './api.js';

export const leadService = {
  async getLeads(params = {}) {
    const res = await api.get('/leads', { params });
    return {
      leads: res.data || [],
      pagination: res.meta || { page: 1, limit: 15, total: 0, totalPages: 1 }
    };
  },

  async getLeadById(id) {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },

  async createLead(data) {
    const res = await api.post('/leads', data);
    return res.data;
  },

  async updateLead(id, data) {
    const res = await api.put(`/leads/${id}`, data);
    return res.data;
  },

  async deleteLead(id) {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },

  async getScoreExplanation(id) {
    const res = await api.get(`/leads/${id}/priority`);
    return res.data;
  },

  async verifyLeadEmail(id) {
    const res = await api.post(`/leads/${id}/verify`);
    return res.data;
  },

  async getLeadActivities(id) {
    const res = await api.get(`/leads/${id}/activities`);
    return res.data || [];
  },

  async logActivity(id, activityData) {
    const res = await api.post(`/leads/${id}/activities`, activityData);
    return res.data;
  },

  async sendCadenceEmail(id, campaignId) {
    const res = await api.post(`/leads/${id}/send-email`, { campaignId });
    return res.data;
  }
};
