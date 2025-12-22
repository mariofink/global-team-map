import map from "./map.js";
import { TeamMemberManager } from "./TeamMemberManager.js";
import { fetchTimezone } from "./helpers.js";
import locationSearch from "./components/locationSearch.js";

// Wait for Alpine.js to be available
document.addEventListener("alpine:init", () => {
  // Register Alpine.js components globally
  window.locationSearch = locationSearch;
});

// Main Alpine.js app data
window.app = {
  memberManager: new TeamMemberManager(),
  members: [],
  form: {
    name: "",
    role: "",
    location: "",
    latitude: "",
    longitude: "",
  },
  isSubmitting: false,

  // Helper methods for member list display
  getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },

  handleMemberClick(memberId) {
    this.flyToMember(memberId);
  },

  handleDeleteClick(memberId) {
    this.deleteMember(memberId);
  },

  init() {
    console.log("Alpine app initialized");

    // Initialize map
    map.init();

    // Load members from storage
    this.members = this.memberManager.getMembers();
    console.log("Loaded members from storage:", this.members);

    // Set up callback for member changes
    this.memberManager.setOnMembersChange(() => {
      this.members = this.memberManager.getMembers();
      this.updateMap();
    });

    // Initial map update
    this.updateMap();

    // Listen for location-selected events from location search
    window.addEventListener("location-selected", (e) => {
      this.form.location = e.detail.display_name;
      this.form.latitude = e.detail.latitude.toFixed(6);
      this.form.longitude = e.detail.longitude.toFixed(6);
    });

    // Listen for member-click events from member list
    window.addEventListener("member-click", (e) => {
      this.flyToMember(e.detail.memberId);
    });

    // Listen for member-delete events from member list
    window.addEventListener("member-delete", (e) => {
      this.deleteMember(e.detail.memberId);
    });
  },

  updateMap() {
    map.updateMap(this.members);
  },

  async handleAddMember(event) {
    const latitude = parseFloat(this.form.latitude);
    const longitude = parseFloat(this.form.longitude);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      alert("Please select a location from the search results");
      return;
    }

    if (latitude < -90 || latitude > 90) {
      alert("Latitude must be between -90 and 90");
      return;
    }

    if (longitude < -180 || longitude > 180) {
      alert("Longitude must be between -180 and 180");
      return;
    }

    this.isSubmitting = true;

    try {
      const timezone = await fetchTimezone(latitude, longitude);

      if (timezone) {
        this.memberManager.addMember({
          name: this.form.name,
          role: this.form.role,
          location: this.form.location,
          latitude,
          longitude,
          timezone,
        });

        // Close dialog
        this.$refs.dialog.close();

        // Fly to new member
        map.flyTo([latitude, longitude]);

        // Show notification
        this.showNotification("Team member added successfully!", "success");
      }
    } catch (error) {
      alert("Failed to fetch timezone for new member");
    } finally {
      this.isSubmitting = false;
    }
  },

  resetForm() {
    this.form = {
      name: "",
      role: "",
      location: "",
      latitude: "",
      longitude: "",
    };
    // Trigger location search reset
    window.dispatchEvent(new CustomEvent("reset-location-search"));
  },

  deleteMember(id) {
    if (confirm("Are you sure you want to remove this team member?")) {
      this.memberManager.deleteMember(id);
    }
  },

  flyToMember(id) {
    const member = this.memberManager.findMember(id);
    if (member) {
      map.flyTo([member.latitude, member.longitude]);
      map.openPopup(id);
    }
  },

  handleExport() {
    try {
      this.memberManager.exportToFile();
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
        const imported = this.memberManager.importFromJSON(e.target.result);

        // Ask for confirmation if there's existing data
        const currentMembers = this.memberManager.getMembers();
        if (currentMembers.length > 0) {
          const replace = confirm(
            `You have ${currentMembers.length} existing team member(s). Replace with ${imported.length} imported member(s)?`
          );
          if (!replace) {
            event.target.value = "";
            return;
          }
        }

        this.memberManager.replaceMembers(imported);
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
      const dataStr = this.memberManager.exportToJSON();
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

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add("show"), 10);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  },
};
