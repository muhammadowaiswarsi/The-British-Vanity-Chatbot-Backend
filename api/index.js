/**
 * Vercel serverless entry point.
 * Routes all traffic through the Express app (connectDB runs via ensureDb middleware).
 */
const app = require('../dist/app').default;

module.exports = app;
