import api from './api.js';

export const campaignService = {
  async getCampaigns() {
    const res = await api.get('/campaigns');
    return res.data || [];
  },

  async getCampaignById(id) {
    const res = await api.get(`/campaigns/${id}`);
    return res.data;
  },

  async createCampaign(data) {
    const res = await api.post('/campaigns', data);
    return res.data;
  },

  async updateCampaign(id, data) {
    const res = await api.put(`/campaigns/${id}`, data);
    return res.data;
  },

  async deleteCampaign(id) {
    const res = await api.delete(`/campaigns/${id}`);
    return res.data;
  },

  async getCampaignLeads(campaignId) {
    const res = await api.get(`/campaigns/${campaignId}/leads`);
    return res.data || [];
  },

  async previewGuard(campaignId, leadIds) {
    const res = await api.post(`/campaigns/${campaignId}/leads/preview-guard`, { leadIds });
    return res.data;
  },

  async enrollLeads(campaignId, leadIds) {
    const res = await api.post(`/campaigns/${campaignId}/leads`, { leadIds });
    return res.data;
  },

  async removeLead(campaignId, leadId) {
    const res = await api.delete(`/campaigns/${campaignId}/leads/${leadId}`);
    return res.data;
  },

  async getCampaignAnalytics(campaignId) {
    const res = await api.get(`/campaigns/${campaignId}/analytics`);
    return res.data;
  },

  // Sequences
  async getSequence(campaignId) {
    const res = await api.get(`/campaigns/${campaignId}/sequences`);
    return res.data;
  },

  async addSequenceStep(campaignId, stepData) {
    const res = await api.post(`/campaigns/${campaignId}/sequences/steps`, stepData);
    return res.data;
  },

  async updateSequenceStep(campaignId, stepId, stepData) {
    const res = await api.put(`/campaigns/${campaignId}/sequences/steps/${stepId}`, stepData);
    return res.data;
  },

  async deleteSequenceStep(campaignId, stepId) {
    const res = await api.delete(`/campaigns/${campaignId}/sequences/steps/${stepId}`);
    return res.data;
  }
};
