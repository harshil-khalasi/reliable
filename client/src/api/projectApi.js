import axiosClient from './axiosClient';

export const projectApi = {
  getProjects: async (params = {}) => {
    const response = await axiosClient.get('/projects', { params });
    return response.data;
  },
  getProjectById: async (id) => {
    const response = await axiosClient.get(`/projects/${id}`);
    return response.data;
  },
  createProject: async (data) => {
    const response = await axiosClient.post('/projects', data);
    return response.data;
  },
  updateProject: async (id, data) => {
    const response = await axiosClient.put(`/projects/${id}`, data);
    return response.data;
  },
  deleteProject: async (id) => {
    const response = await axiosClient.delete(`/projects/${id}`);
    return response.data;
  },
};
