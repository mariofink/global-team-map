/**
 * @typedef {Object} TeamMember
 * @property {string} id - Unique identifier
 * @property {string} name - Member's full name
 * @property {string} role - Job role/title
 * @property {string} location - Full location string
 * @property {number} latitude - Geographic latitude
 * @property {number} longitude - Geographic longitude
 * @property {string} timezone - IANA timezone identifier
 */

/**
 * @typedef {Object} MemberData
 * @property {string} name
 * @property {string} role
 * @property {string} location
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} timezone
 */

/**
 * TeamMemberManager handles all team member related operations
 * including CRUD operations and storage (no rendering)
 */
export class TeamMemberManager {
  constructor() {
    /** @type {TeamMember[]} */
    this.members = this.loadMembers();
    /** @type {(() => void) | null} Callback for when members change */
    this.onMembersChange = null;
  }

  /**
   * Get all team members
   * @returns {TeamMember[]}
   */
  getMembers() {
    return this.members;
  }

  /**
   * Add a new team member
   * @param {MemberData} memberData - Data for the new member
   * @returns {TeamMember} The created member
   */
  addMember(memberData) {
    const member = {
      id: Date.now().toString(),
      name: memberData.name,
      role: memberData.role,
      location: memberData.location,
      latitude: memberData.latitude,
      longitude: memberData.longitude,
      timezone: memberData.timezone,
    };

    this.members.push(member);
    this.saveMembers();
    this.notifyChange();

    return member;
  }

  /**
   * Delete a team member by ID
   * @param {string} id - Member ID to delete
   * @returns {void}
   */
  deleteMember(id) {
    this.members = this.members.filter((m) => m.id !== id);
    this.saveMembers();
    this.notifyChange();
  }

  /**
   * Find a member by ID
   * @param {string} id - Member ID to find
   * @returns {TeamMember | undefined} The member or undefined if not found
   */
  findMember(id) {
    return this.members.find((m) => m.id === id);
  }

  /**
   * Save members to localStorage
   * @returns {void}
   */
  saveMembers() {
    localStorage.setItem("globalTeamMembers", JSON.stringify(this.members));
  }

  /**
   * Load members from localStorage
   * @returns {TeamMember[]} Array of team members
   */
  loadMembers() {
    const stored = localStorage.getItem("globalTeamMembers");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Replace all members (used for import)
   * @param {TeamMember[]} newMembers - Array of new members to replace with
   * @returns {void}
   */
  replaceMembers(newMembers) {
    this.members = newMembers;
    this.saveMembers();
    this.notifyChange();
  }

  /**
   * Validate member data structure
   * @param {any} members - Data to validate
   * @returns {boolean} True if valid member array
   */
  validateMembers(members) {
    if (!Array.isArray(members)) {
      return false;
    }

    return members.every(
      (m) =>
        m.name &&
        m.location &&
        typeof m.latitude === "number" &&
        typeof m.longitude === "number"
    );
  }

  /**
   * Exports all team members to a JSON file and triggers a download in the browser.
   * Creates a blob from the members array, generates a downloadable link with a timestamped filename,
   * and automatically triggers the download before cleaning up resources.
   *
   * @throws {Error} Throws an error if there are no team members to export
   * @returns {void}
   */
  exportToFile() {
    if (this.members.length === 0) {
      throw new Error("No team members to export!");
    }

    const dataStr = JSON.stringify(this.members, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `global-team-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export members as JSON string
   * @returns {string} JSON string of all members
   */
  exportToJSON() {
    return JSON.stringify(this.members, null, 2);
  }

  /**
   * Import members from JSON
   * @param {string} jsonString - JSON string containing member data
   * @returns {TeamMember[]} Array of imported members
   */
  importFromJSON(jsonString) {
    const imported = JSON.parse(jsonString);

    if (!this.validateMembers(imported)) {
      throw new Error("Invalid team data structure");
    }

    return imported;
  }

  /**
   * Notify listeners that members have changed
   * @returns {void}
   */
  notifyChange() {
    this.onMembersChange && this.onMembersChange();
  }

  /**
   * Set callback for when members change
   * @param {() => void} callback - Callback function to execute when members change
   * @returns {void}
   */
  setOnMembersChange(callback) {
    this.onMembersChange = callback;
  }
}
