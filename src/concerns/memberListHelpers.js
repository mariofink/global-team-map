/**
 * @typedef {ReturnType<typeof import('../stores/teamStore.js').createTeamStore>} TeamStore
 */

export const memberListHelpers = {
  getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },

  handleMemberClick(memberId) {
    const teamStore = /** @type {TeamStore} */ (
      globalThis.Alpine.store("team")
    );
    teamStore.selectMember(memberId);
  },

  handleDeleteClick(memberId) {
    const teamStore = /** @type {TeamStore} */ (
      globalThis.Alpine.store("team")
    );
    if (confirm("Are you sure you want to remove this team member?")) {
      teamStore.deleteMember(memberId);
    }
  },
};
