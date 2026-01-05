/**
 * @typedef {ReturnType<typeof import('../stores/teamStore.js').createTeamStore>} TeamStore
 */

export const dataOperations = {
  /**
   * Export team data to a downloadable JSON file
   * @returns {void}
   */
  handleExport() {
    try {
      const teamStore = /** @type {TeamStore} */ (
        globalThis.Alpine.store("team")
      );
      teamStore.exportToFile();
      this.showNotification(
        "Team data exported! Share the file with others.",
        "success"
      );
    } catch (error) {
      alert(error.message);
    }
  },

  /**
   * Handle file import from user's file system
   * Validates and optionally replaces existing team data
   * @param {Event} event - File input change event
   * @returns {void}
   */
  handleImport(event) {
    const input = /** @type {HTMLInputElement} */ (event.target);
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const teamStore = /** @type {TeamStore} */ (
          globalThis.Alpine.store("team")
        );
        const imported = teamStore.importFromJSON(
          /** @type {string} */ (e.target.result)
        );

        // Ask for confirmation if there's existing data
        const currentMembers = teamStore.members;
        if (currentMembers.length > 0) {
          const replace = confirm(
            `You have ${currentMembers.length} existing team member(s). Replace with ${imported.length} imported member(s)?`
          );
          if (!replace) {
            input.value = "";
            return;
          }
        }

        teamStore.replaceMembers(imported);
        this.showNotification(
          `Successfully imported ${imported.length} team member(s)!`,
          "success"
        );
      } catch (error) {
        alert("Error importing file: " + error.message);
      }
      input.value = "";
    };

    reader.readAsText(file);
  },

  /**
   * Copy team data to clipboard as JSON
   * @returns {void}
   */
  handleCopy() {
    try {
      const teamStore = /** @type {TeamStore} */ (
        globalThis.Alpine.store("team")
      );
      const dataStr = teamStore.exportToJSON();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(dataStr).then(() => {
          this.showNotification(
            "Team data copied to clipboard! Paste it to share.",
            "success"
          );
        });
      }
    } catch (error) {
      alert(error.message);
    }
  },
};
