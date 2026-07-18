"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const organizationController_1 = require("../controllers/organizationController");
const router = (0, express_1.Router)();
// Secure all organization routes
router.use(authMiddleware_1.authenticateJWT);
router.get('/tree', organizationController_1.getOrganizationTree);
exports.default = router;
