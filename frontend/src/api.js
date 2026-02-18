import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Vite proxies this to http://localhost:3001/api -> http://localhost:8000/
});

export const checkHealth = () => api.get('/health');

export const uploadPDF = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const askQuestion = (sessionId, question) => api.post('/ask', { session_id: sessionId, question });


export const getSummary = (sessionId) => api.get(`/summary/${sessionId}`);

export const getSessions = () => api.get('/sessions');

export const deleteSession = (sessionId) => api.delete(`/session/${sessionId}`);

export default api;
