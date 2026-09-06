import axios from "axios";

const apiClient = axios.create({
  baseURL: "",

  withCredentials: true,

  timeout: 30000,
});

export default apiClient;