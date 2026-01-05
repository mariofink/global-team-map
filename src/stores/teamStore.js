/**
 * @typedef {import("../TeamMemberManager.js").MemberData} MemberData
 * @typedef {import("../TeamMemberManager.js").TeamMember} TeamMember
 */

import { TeamMemberManager } from "../TeamMemberManager.js";
import map from "../map.js";
import { fetchTimezone } from "../helpers.js";

/**
 * Team Store - Manages team member state
 * Accessible globally via Alpine.store('team')
 * @returns {{
 *   memberManager: TeamMemberManager,
 *   members: TeamMember[],
 *   selectedMemberId: string | null,
 *   init(): void,
 *   updateMap(): void,
 *   addMember(memberData: Omit<MemberData, 'timezone'>): Promise<MemberData | null>,
 *   deleteMember(id: string): void,
 *   findMember(id: string): MemberData | undefined,
 *   selectMember(id: string): void,
 *   exportToFile(): void,
 *   importFromJSON(jsonString: string): MemberData[],
 *   replaceMembers(members: MemberData[]): void,
 *   exportToJSON(): string
 * }}
 */
export function createTeamStore() {
  return {
    memberManager: new TeamMemberManager(),
    members: [],
    selectedMemberId: null,

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

    /**
     * Add a new team member
     * @param {Omit<MemberData, 'timezone'>} memberData - Member data without timezone (will be fetched)
     * @returns {Promise<MemberData | null>} The added member or null if failed
     */
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

    /**
     * Delete a team member by ID
     * @param {string} id - Member ID to delete
     */
    deleteMember(id) {
      this.memberManager.deleteMember(id);
    },

    /**
     * Find a team member by ID
     * @param {string} id - Member ID to find
     * @returns {MemberData | undefined} The member or undefined if not found
     */
    findMember(id) {
      return this.memberManager.findMember(id);
    },

    /**
     * Select a member and fly to their location on the map
     * @param {string} id - Member ID to select
     */
    selectMember(id) {
      const member = this.findMember(id);
      if (member) {
        this.selectedMemberId = id;
        map.flyTo([member.latitude, member.longitude]);
        map.openPopup(id);
      }
    },

    /**
     * Exports team data to a file, triggering a download in the browser.
     */
    exportToFile() {
      this.memberManager.exportToFile();
    },

    /**
     * Import members from JSON string
     * @param {string} jsonString - JSON string containing member data
     * @returns {MemberData[]} Array of imported members
     */
    importFromJSON(jsonString) {
      return this.memberManager.importFromJSON(jsonString);
    },

    /**
     * Replace all members with new data
     * @param {TeamMember[]} members - Array of member data to replace with
     */
    replaceMembers(members) {
      this.memberManager.replaceMembers(members);
    },

    /**
     * Export members to JSON string
     * @returns {string} JSON string of all members
     */
    exportToJSON() {
      return this.memberManager.exportToJSON();
    },
  };
}
