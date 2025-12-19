import map from "./map.js";
import { escapeHtml } from "./helpers.js";
import { TeamMemberManager } from "./TeamMemberManager.js";
import { LocationSearch } from "./LocationSearch.js";

// Global Team Map Application
class GlobalTeamApp {
  constructor() {
    this.memberManager = new TeamMemberManager();
    this.locationSearch = new LocationSearch();
    this.timeUpdateInterval = null;
    this.init();
  }

  init() {
    map.init();
    this.locationSearch.init();
    this.initEventListeners();
    
    // Set up callback for member changes
    this.memberManager.setOnMembersChange(() => {
      this.memberManager.renderMembers();
      this.updateMap();
    });
    
    this.memberManager.renderMembers();
    this.updateMap();
    this.startTimeUpdates();
  }

  updateMap() {
    map.updateMap(this.memberManager.getMembers());
  }

  initEventListeners() {
    const form = document.getElementById("memberForm");
    form.addEventListener("submit", (e) => this.handleAddMember(e));

    const exportBtn = document.getElementById("exportBtn");
    exportBtn.addEventListener("click", () => this.handleExport());

    const importBtn = document.getElementById("importBtn");
    const fileInput = document.getElementById("fileInput");
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => this.handleImport(e));

    const copyBtn = document.getElementById("copyBtn");
    copyBtn.addEventListener("click", () => this.handleCopy());
  }

  handleAddMember(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const role = document.getElementById("role").value.trim();
    const location = document.getElementById("location").value.trim();
    const latitude = parseFloat(document.getElementById("latitude").value);
    const longitude = parseFloat(document.getElementById("longitude").value);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      alert("Please enter valid latitude and longitude values");
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
      const response = await fetch(
        `https://api.wheretheiss.at/v1/coordinates/${latitude},${longitude}`
      );
      const data = await response.json();

      if (data.timezone_id) {
        this.memberManager.updateTimezone(memberId, data.timezone_id);
        this.startTimeUpdates();
      }
    } catch (error) {
      console.error("Timezone fetch error:", error);
      this.memberManager.updateTimezone(memberId, "Unknown");
    }
  }

  startTimeUpdates() {
    // Update local times every second
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }

    this.updateLocalTimes();
    this.timeUpdateInterval = setInterval(() => {
      this.updateLocalTimes();
    }, 1000);
  }

  updateLocalTimes() {
    const timeElements = document.querySelectorAll(".local-time");
    timeElements.forEach((el) => {
      const timezone = el.dataset.timezone;
      if (timezone) {
        try {
          const now = new Date();
          const timeStr = now.toLocaleTimeString("en-US", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
          el.textContent = timeStr;
        } catch (error) {
          el.textContent = "Invalid timezone";
        }
      }
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new GlobalTeamApp();
});
