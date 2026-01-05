/**
 * @typedef {ReturnType<typeof import('../stores/teamStore.js').createTeamStore>} TeamStore
 */

export const memberListHelpers = {
  /**
   * Get initials from a name (first 2 letters)
   * @param {string} name - Full name to extract initials from
   * @returns {string} Uppercase initials (max 2 characters)
   */
  getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Handle click on a member card to select and focus on map
   * @param {string} memberId - ID of the member to select
   * @returns {void}
   */
  handleMemberClick(memberId) {
    const teamStore = /** @type {TeamStore} */ (
      globalThis.Alpine.store("team")
    );
    teamStore.selectMember(memberId);
  },

  /**
   * Handle delete button click with confirmation
   * @param {string} memberId - ID of the member to delete
   * @returns {void}
   */
  handleDeleteClick(memberId) {
    const teamStore = /** @type {TeamStore} */ (
      globalThis.Alpine.store("team")
    );
    if (confirm("Are you sure you want to remove this team member?")) {
      teamStore.deleteMember(memberId);
    }
  },
};
