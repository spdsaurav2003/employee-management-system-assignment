"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const organizationRoutes_1 = __importDefault(require("./routes/organizationRoutes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
(0, db_1.connectDB)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for local testing, can lock down in production
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/employees', employeeRoutes_1.default);
app.use('/api/organization', organizationRoutes_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
