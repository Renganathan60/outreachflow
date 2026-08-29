import api from './api.js';

export const analyticsService = {
  async getDashboardOverview() {
    const res = await api.get('/analytics/overview');
    return res.data;
  },

  async getPipelineAnalytics() {
    const res = await api.get('/analytics/pipeline');
    return res.data;
  }
};
