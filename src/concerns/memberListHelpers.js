/**
 * Member List Display Helpers
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
    Alpine.store("team").selectMember(memberId);
  },

  handleDeleteClick(memberId) {
    if (confirm("Are you sure you want to remove this team member?")) {
      Alpine.store("team").deleteMember(memberId);
    }
  },
};
