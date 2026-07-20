import axios from 'axios';

const baseURL = (
  process.env.MAIN_BACKEND_URL ||
  process.env.ECOMMERCE_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5000'
).replace(/\/$/, '');

export const mainBackendApi = axios.create({
  baseURL: `${baseURL}/api/chatbot`,
  timeout: 15000,
});

export const getMainBackendBaseUrl = (): string => baseURL;
