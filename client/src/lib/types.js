/**
 * @typedef {Object} Employee
 * @property {string} id
 * @property {string} name
 * @property {string|null} managerId
 * @property {string} title
 * @property {string} department
 */

/**
 * @typedef {Employee & {
 *   children: OrgNode[],
 *   depth: number,
 *   directReportCount: number,
 *   spanCount: number,
 * }} OrgNode
 */

/**
 * @typedef {Object} ReorgChange
 * @property {string} employeeId
 * @property {string} employeeName
 * @property {string|null} fromManagerId
 * @property {string|null} toManagerId
 * @property {string|null} fromManagerName
 * @property {string|null} toManagerName
 */

export {};
