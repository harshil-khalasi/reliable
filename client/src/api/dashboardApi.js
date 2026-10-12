import axiosClient from './axiosClient';

export const dashboardApi = {
  getStats: async () => {
    const response = await axiosClient.get('/dashboard/stats');
    return response.data;
  },
};
