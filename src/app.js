import map from "./map.js";
import { TeamMemberManager } from "./TeamMemberManager.js";
import "./LocationSearch.js"; // Import to register the custom element
import "./TeamMemberList.js"; // Import to register the custom element

// Global Team Map Application
class GlobalTeamApp {
  constructor() {
    this.memberManager = new TeamMemberManager();
    this.selectedLocation = null;
    this.init();
  }

  init() {
    map.init();
    this.initEventListeners();

    // Set up callback for member changes
    this.memberManager.setOnMembersChange(() => {
      this.updateMemberList();
      this.updateMap();
    });

    this.updateMemberList();
    this.updateMap();
  }

  updateMemberList() {
    const memberList = document.getElementById("memberList");
    memberList.members = this.memberManager.getMembers();
  }

  updateMap() {
    map.updateMap(this.memberManager.getMembers());
  }

  initEventListeners() {
    const dialog = document.getElementById("memberFormDialog");
    const openFormBtn = document.getElementById("openFormBtn");
    const closeDialogBtn = document.getElementById("closeDialogBtn");
    const form = document.getElementById("memberForm");

    openFormBtn.addEventListener("click", () => dialog.showModal());
    closeDialogBtn.addEventListener("click", () => dialog.close());
    
    form.addEventListener("submit", (e) => this.handleAddMember(e));

    const exportBtn = document.getElementById("exportBtn");
    exportBtn.addEventListener("click", () => this.handleExport());

    const importBtn = document.getElementById("importBtn");
    const fileInput = document.getElementById("fileInput");
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => this.handleImport(e));

    const copyBtn = document.getElementById("copyBtn");
    copyBtn.addEventListener("click", () => this.handleCopy());

    // Listen for location selection from web component
    const locationSearch = document.getElementById("locationSearch");
    locationSearch.addEventListener("location-selected", (e) => {
      this.selectedLocation = e.detail;
      document.getElementById("latitude").value = e.detail.latitude.toFixed(6);
      document.getElementById("longitude").value =
        e.detail.longitude.toFixed(6);
    });

    // Listen for member list events
    const memberList = document.getElementById("memberList");
    memberList.addEventListener("member-click", (e) => {
      this.flyToMember(e.detail.memberId);
    });
    memberList.addEventListener("member-delete", (e) => {
      this.deleteMember(e.detail.memberId);
    });
  }

  handleAddMember(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const role = document.getElementById("role").value.trim();
    const locationSearch = document.getElementById("locationSearch");
    const location = locationSearch.getValue().trim();
    const latitude = parseFloat(document.getElementById("latitude").value);
    const longitude = parseFloat(document.getElementById("longitude").value);

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

    const member = this.memberManager.addMember({
      name,
      role,
      location,
      latitude,
      longitude,
    });

    // Reset form
    e.target.reset();
    locationSearch.clear();
    this.selectedLocation = null;

    // Close the dialog
    document.getElementById("memberFormDialog").close();

    // Fly to new member location
    map.flyTo([latitude, longitude]);

    // Fetch timezone asynchronously
    this.fetchTimezone(member.id, latitude, longitude);
  }

  deleteMember(id) {
    if (confirm("Are you sure you want to remove this team member?")) {
      this.memberManager.deleteMember(id);
    }
  }

  flyToMember(id) {
    const member = this.memberManager.findMember(id);
    if (member) {
      map.flyTo([member.latitude, member.longitude]);
      map.openPopup(id);
    }
  }

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
  }

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
            event.target.value = ""; // Reset file input
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
      event.target.value = ""; // Reset file input
    };

    reader.readAsText(file);
  }

  handleCopy() {
    try {
      const dataStr = this.memberManager.exportToJSON();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(dataStr)
          .then(() => {
            this.showNotification(
              "Team data copied to clipboard! Paste it to share.",
              "success"
            );
          })
          .catch(() => {
            this.fallbackCopyToClipboard(dataStr);
          });
      } else {
        this.fallbackCopyToClipboard(dataStr);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  fallbackCopyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      this.showNotification(
        "Team data copied to clipboard! Paste it to share.",
        "success"
      );
    } catch (err) {
      prompt("Copy this data to share:", text);
    }
    document.body.removeChild(textarea);
  }

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
  }

  async fetchTimezone(memberId, latitude, longitude) {
    try {
      // Use timeapi.io to get timezone information
      const response = await fetch(
        `https://timeapi.io/api/TimeZone/coordinate?latitude=${latitude}&longitude=${longitude}`
      );
      const data = await response.json();

      if (data.timeZone) {
        this.memberManager.updateTimezone(memberId, data.timeZone);
      }
    } catch (error) {
      console.error("Timezone fetch error:", error);
      this.memberManager.updateTimezone(memberId, "Unknown");
    }
  }

}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new GlobalTeamApp();
});
