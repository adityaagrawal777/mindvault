import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 3001;

// Proxy API requests to FastAPI backend
// This forwards any request to /api/* to http://localhost:8000/*
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // remove base path
    },
    // Ensure file uploads work correctly
    onProxyReq: (proxyReq, req, res) => {
        // No specific changes needed for streaming uploads usually
    }
}));

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
