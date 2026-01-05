import { getCorsProxyUrl } from "../helpers.js";

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

  /**
   * Load team data from URL parameter if present
   * Checks for ?data=<url> parameter and fetches team data from that URL
   * @returns {Promise<void>}
   */
  async loadFromUrlParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const dataUrl = urlParams.get("data");

    if (!dataUrl) {
      return;
    }

    try {
      // Use CORS proxy for external URLs to avoid CORS restrictions
      const fetchUrl = getCorsProxyUrl(dataUrl);

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.text();
      const teamStore = /** @type {TeamStore} */ (
        globalThis.Alpine.store("team")
      );

      const imported = teamStore.importFromJSON(jsonData);
      teamStore.replaceMembers(imported);
    } catch (error) {
      console.error("Error loading data from URL:", error);
      this.showNotification(
        `Failed to load data from URL: ${error.message}`,
        "error"
      );
    }
  },
};
