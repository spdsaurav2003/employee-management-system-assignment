import Employee from '../models/Employee';

/**
 * Checks if assigning `newManagerId` as the manager of `employeeId` introduces a circular reporting relationship.
 * A circular relationship is created if `employeeId` is already an ancestor of `newManagerId`
 * (i.e. `newManagerId` or any of its managers up the chain reports to `employeeId`).
 * 
 * @param employeeId The ID of the employee whose manager is being set/updated.
 * @param newManagerId The ID of the proposed new reporting manager.
 * @returns Promise<boolean> True if a circular relationship is detected, false otherwise.
 */
export const isCircularReporting = async (
  employeeId: string,
  newManagerId: string | null
): Promise<boolean> => {
  if (!newManagerId) return false;

  // An employee cannot report to themselves
  if (employeeId.toString() === newManagerId.toString()) {
    return true;
  }

  // Retrieve the proposed manager to inspect their reporting manager
  const manager = await Employee.findById(newManagerId);
  if (!manager) {
    return false; // Proposed manager doesn't exist
  }

  if (manager.reportingManager) {
    // If the proposed manager reports to the employee, it's circular
    if (manager.reportingManager.toString() === employeeId.toString()) {
      return true;
    }
    // Traverse recursively up the proposed manager's chain
    return isCircularReporting(employeeId, manager.reportingManager.toString());
  }

  return false;
};
