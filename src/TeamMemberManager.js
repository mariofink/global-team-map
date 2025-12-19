import { escapeHtml } from "./helpers.js";

/**
 * TeamMemberManager handles all team member related operations
 * including CRUD operations, storage, and rendering
 */
export class TeamMemberManager {
  constructor() {
    this.members = this.loadMembers();
    this.onMembersChange = null; // Callback for when members change
  }

  /**
   * Get all team members
   */
  getMembers() {
    return this.members;
  }

  /**
   * Add a new team member
   */
  addMember(memberData) {
    const member = {
      id: Date.now().toString(),
      name: memberData.name,
      role: memberData.role,
      location: memberData.location,
      latitude: memberData.latitude,
      longitude: memberData.longitude,
      timezone: "Loading...",
    };

    this.members.push(member);
    this.saveMembers();
    this.notifyChange();

    return member;
  }

  /**
   * Delete a team member by ID
   */
  deleteMember(id) {
    this.members = this.members.filter((m) => m.id !== id);
    this.saveMembers();
    this.notifyChange();
  }

  /**
   * Find a member by ID
   */
  findMember(id) {
    return this.members.find((m) => m.id === id);
  }

  /**
   * Update a member's timezone
   */
  updateTimezone(memberId, timezone) {
    const member = this.findMember(memberId);
    if (member) {
      member.timezone = timezone;
      this.saveMembers();
      this.notifyChange();
    }
  }

  /**
   * Save members to localStorage
   */
  saveMembers() {
    localStorage.setItem("globalTeamMembers", JSON.stringify(this.members));
  }

  /**
   * Load members from localStorage
   */
  loadMembers() {
    const stored = localStorage.getItem("globalTeamMembers");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Replace all members (used for import)
   */
  replaceMembers(newMembers) {
    this.members = newMembers;
    this.saveMembers();
    this.notifyChange();
  }

  /**
   * Render members list in the DOM
   */
  renderMembers() {
    const membersList = document.getElementById("membersList");
    const memberCount = document.getElementById("memberCount");

    memberCount.textContent = this.members.length;

    if (this.members.length === 0) {
      membersList.innerHTML =
        '<p style="color: #999; text-align: center; padding: 20px;">No team members yet. Add your first member!</p>';
      return;
    }

    membersList.innerHTML = this.members
      .map(
        (member) => `
            <div class="member-card" onclick="app.flyToMember('${member.id}')">
                <div class="member-card-header">
                    <div>
                        <div class="member-name">${escapeHtml(
                          member.name
                        )}</div>
                        ${
                          member.role
                            ? `<div class="member-role">${escapeHtml(
                                member.role
                              )}</div>`
                            : ""
                        }
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); app.deleteMember('${
                      member.id
                    }')">Remove</button>
                </div>
                <div class="member-location">${escapeHtml(
                  member.location
                )}</div>
            </div>
        `
      )
      .join("");
  }

  /**
   * Validate member data structure
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
   * Export members to JSON file
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
   */
  exportToJSON() {
    return JSON.stringify(this.members, null, 2);
  }

  /**
   * Import members from JSON
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
   */
  notifyChange() {
    if (this.onMembersChange) {
      this.onMembersChange(this.members);
    }
  }

  /**
   * Set callback for when members change
   */
  setOnMembersChange(callback) {
    this.onMembersChange = callback;
  }
}
