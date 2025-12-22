/**
 * Data Import/Export Operations
 */
export const dataOperations = {
  handleExport() {
    try {
      Alpine.store("team").exportToFile();
      this.showNotification(
        "Team data exported! Share the file with others.",
        "success"
      );
    } catch (error) {
      alert(error.message);
    }
  },

  handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const teamStore = Alpine.store("team");
        const imported = teamStore.importFromJSON(e.target.result);

        // Ask for confirmation if there's existing data
        const currentMembers = teamStore.members;
        if (currentMembers.length > 0) {
          const replace = confirm(
            `You have ${currentMembers.length} existing team member(s). Replace with ${imported.length} imported member(s)?`
          );
          if (!replace) {
            event.target.value = "";
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
      event.target.value = "";
    };

    reader.readAsText(file);
  },

  handleCopy() {
    try {
      const dataStr = Alpine.store("team").exportToJSON();
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
