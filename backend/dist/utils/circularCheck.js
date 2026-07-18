"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCircularReporting = void 0;
const Employee_1 = __importDefault(require("../models/Employee"));
/**
 * Checks if assigning `newManagerId` as the manager of `employeeId` introduces a circular reporting relationship.
 * A circular relationship is created if `employeeId` is already an ancestor of `newManagerId`
 * (i.e. `newManagerId` or any of its managers up the chain reports to `employeeId`).
 *
 * @param employeeId The ID of the employee whose manager is being set/updated.
 * @param newManagerId The ID of the proposed new reporting manager.
 * @returns Promise<boolean> True if a circular relationship is detected, false otherwise.
 */
const isCircularReporting = async (employeeId, newManagerId) => {
    if (!newManagerId)
        return false;
    // An employee cannot report to themselves
    if (employeeId.toString() === newManagerId.toString()) {
        return true;
    }
    // Retrieve the proposed manager to inspect their reporting manager
    const manager = await Employee_1.default.findById(newManagerId);
    if (!manager) {
        return false; // Proposed manager doesn't exist
    }
    if (manager.reportingManager) {
        // If the proposed manager reports to the employee, it's circular
        if (manager.reportingManager.toString() === employeeId.toString()) {
            return true;
        }
        // Traverse recursively up the proposed manager's chain
        return (0, exports.isCircularReporting)(employeeId, manager.reportingManager.toString());
    }
    return false;
};
exports.isCircularReporting = isCircularReporting;
