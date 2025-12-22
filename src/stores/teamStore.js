import { TeamMemberManager } from "../TeamMemberManager.js";
import map from "../map.js";
import { fetchTimezone } from "../helpers.js";

/**
 * Team Store - Manages team member state
 * Accessible globally via Alpine.store('team')
 */
export function createTeamStore() {
  return {
    memberManager: new TeamMemberManager(),
    members: [],

    init() {
      // Load members from storage
      this.members = this.memberManager.getMembers();
      console.log("Team store initialized with members:", this.members);

      // Set up callback for member changes
      this.memberManager.setOnMembersChange(() => {
        this.members = this.memberManager.getMembers();
        this.updateMap();
      });

      // Initial map update
      this.updateMap();
    },

    updateMap() {
      map.updateMap(this.members);
    },

    async addMember(memberData) {
      try {
        const timezone = await fetchTimezone(
          memberData.latitude,
          memberData.longitude
        );

        if (timezone) {
          const member = this.memberManager.addMember({
            ...memberData,
            timezone,
          });

          // Fly to new member
          map.flyTo([memberData.latitude, memberData.longitude]);

          return member;
        }
        return null;
      } catch (error) {
        console.error("Failed to add member:", error);
        throw error;
      }
    },

    deleteMember(id) {
      this.memberManager.deleteMember(id);
    },

    findMember(id) {
      return this.memberManager.findMember(id);
    },

    flyToMember(id) {
      const member = this.findMember(id);
      if (member) {
        map.flyTo([member.latitude, member.longitude]);
        map.openPopup(id);
      }
    },

    exportToFile() {
      return this.memberManager.exportToFile();
    },

    importFromJSON(jsonString) {
      return this.memberManager.importFromJSON(jsonString);
    },

    replaceMembers(members) {
      this.memberManager.replaceMembers(members);
    },

    exportToJSON() {
      return this.memberManager.exportToJSON();
    },
  };
}
