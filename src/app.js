import map from "./map.js";
import { TeamMemberManager } from "./TeamMemberManager.js";
import { fetchTimezone } from "./helpers.js";

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

    fetchTimezone(latitude, longitude)
      .then((timezone) => {
        if (timezone) {
          this.memberManager.updateTimezone(member, timezone);
          // Reset form
          e.target.reset();
          locationSearch.clear();
          this.selectedLocation = null;

          document.getElementById("memberFormDialog").close();
          map.flyTo([latitude, longitude]);
        }
      })
      .catch(() => {
        alert("Failed to fetch timezone for new member");
      });
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
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new GlobalTeamApp();
});
