import axiosClient from './axiosClient';

export const employeeApi = {
  getEmployees: async (params = {}) => {
    const response = await axiosClient.get('/employees', { params });
    return response.data;
  },
  getAllEmployeesList: async () => {
    const response = await axiosClient.get('/employees/all/list');
    return response.data;
  },
  getEmployeeById: async (id) => {
    const response = await axiosClient.get(`/employees/${id}`);
    return response.data;
  },
  createEmployee: async (data) => {
    const response = await axiosClient.post('/employees', data);
    return response.data;
  },
  updateEmployee: async (id, data) => {
    const response = await axiosClient.put(`/employees/${id}`, data);
    return response.data;
  },
  deleteEmployee: async (id) => {
    const response = await axiosClient.delete(`/employees/${id}`);
    return response.data;
  },
};
