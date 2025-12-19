import map from "./map.js";
import { escapeHtml } from "./helpers.js";

// Global Team Map Application
class GlobalTeamApp {
  constructor() {
    this.members = this.loadMembers();
    this.searchTimeout = null;
    this.timeUpdateInterval = null;
    this.init();
  }

  init() {
    map.init();
    this.initEventListeners();
    this.renderMembers();
    this.updateMap();
    this.startTimeUpdates();
  }

  updateMap() {
    map.updateMap(this.members);
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

    // Location search
    const locationInput = document.getElementById("location");
    locationInput.addEventListener("input", (e) =>
      this.handleLocationSearch(e)
    );
    locationInput.addEventListener("focus", () => {
      if (locationInput.value.length > 2) {
        document.getElementById("locationSuggestions").style.display = "block";
      }
    });

    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".location-search-wrapper")) {
        document.getElementById("locationSuggestions").style.display = "none";
      }
    });
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

    const member = {
      id: Date.now().toString(),
      name,
      role,
      location,
      latitude,
      longitude,
      timezone: "Loading...",
    };

    this.members.push(member);
    this.saveMembers();
    this.renderMembers();
    this.updateMap();

    // Reset form
    e.target.reset();

    // Fly to new member location
    map.flyTo([latitude, longitude]);

    // Fetch timezone asynchronously
    this.fetchTimezone(member.id, latitude, longitude);
  }

  deleteMember(id) {
    if (confirm("Are you sure you want to remove this team member?")) {
      this.members = this.members.filter((m) => m.id !== id);
      this.saveMembers();
      this.renderMembers();
      this.updateMap();
    }
  }

  renderMembers() {
    const membersList = document.getElementById("membersList");
    const memberCount = document.getElementById("memberCount");

    memberCount.textContent = this.members.length;

    if (this.members.length === 0) {
      membersList.innerHTML =
        '<p style="color: #999; text-align: center; padding: 20px;">No team members yet. Add your first member!</p>';
      return;
    }

    membersList.innerHTML = this.members
      .map(
        (member) => `
            <div class="member-card" onclick="app.flyToMember('${member.id}')">
                <div class="member-card-header">
                    <div>
                        <div class="member-name">${escapeHtml(
                          member.name
                        )}</div>
                        ${
                          member.role
                            ? `<div class="member-role">${escapeHtml(
                                member.role
                              )}</div>`
                            : ""
                        }
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); app.deleteMember('${
                      member.id
                    }')">Remove</button>
                </div>
                <div class="member-location">${escapeHtml(
                  member.location
                )}</div>
            </div>
        `
      )
      .join("");
  }

  flyToMember(id) {
    const member = this.members.find((m) => m.id === id);
    if (member) {
      map.flyTo([member.latitude, member.longitude]);
      map.openPopup(id);
    }
  }

  saveMembers() {
    localStorage.setItem("globalTeamMembers", JSON.stringify(this.members));
  }

  loadMembers() {
    const stored = localStorage.getItem("globalTeamMembers");
    return stored ? JSON.parse(stored) : [];
  }

  handleExport() {
    if (this.members.length === 0) {
      alert("No team members to export!");
      return;
    }

    const dataStr = JSON.stringify(this.members, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `global-team-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showNotification(
      "Team data exported! Share the file with others.",
      "success"
    );
  }

  handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);

        if (!Array.isArray(imported)) {
          throw new Error("Invalid file format");
        }

        // Validate structure
        const isValid = imported.every(
          (m) =>
            m.name &&
            m.location &&
            typeof m.latitude === "number" &&
            typeof m.longitude === "number"
        );

        if (!isValid) {
          throw new Error("Invalid team data structure");
        }

        // Ask for confirmation if there's existing data
        if (this.members.length > 0) {
          const replace = confirm(
            `You have ${this.members.length} existing team member(s). Replace with ${imported.length} imported member(s)?`
          );
          if (!replace) {
            event.target.value = ""; // Reset file input
            return;
          }
        }

        this.members = imported;
        this.saveMembers();
        this.renderMembers();
        this.updateMap();

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
    if (this.members.length === 0) {
      alert("No team members to copy!");
      return;
    }

    const dataStr = JSON.stringify(this.members, null, 2);

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

  handleLocationSearch(event) {
    const query = event.target.value.trim();
    const suggestionsDiv = document.getElementById("locationSuggestions");

    if (query.length < 3) {
      suggestionsDiv.style.display = "none";
      return;
    }

    // Debounce the search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchLocation(query);
    }, 300);
  }

  async searchLocation(query) {
    const suggestionsDiv = document.getElementById("locationSuggestions");
    suggestionsDiv.innerHTML =
      '<div class="suggestion-loading">Searching...</div>';
    suggestionsDiv.style.display = "block";

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const results = await response.json();

      if (results.length === 0) {
        suggestionsDiv.innerHTML =
          '<div class="suggestion-item no-results">No locations found</div>';
        return;
      }

      suggestionsDiv.innerHTML = results
        .map(
          (result) => `
          <div class="suggestion-item" data-lat="${result.lat}" data-lon="${
            result.lon
          }" data-name="${escapeHtml(result.display_name)}">
            <div class="suggestion-name">${escapeHtml(
              result.display_name
            )}</div>
          </div>
        `
        )
        .join("");

      // Add click handlers to suggestions
      suggestionsDiv.querySelectorAll(".suggestion-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const lat = item.dataset.lat;
          const lon = item.dataset.lon;
          const name = item.dataset.name;

          if (lat && lon) {
            document.getElementById("location").value = name;
            document.getElementById("latitude").value =
              parseFloat(lat).toFixed(6);
            document.getElementById("longitude").value =
              parseFloat(lon).toFixed(6);
            suggestionsDiv.style.display = "none";
          }
        });
      });
    } catch (error) {
      suggestionsDiv.innerHTML =
        '<div class="suggestion-item error">Error searching locations</div>';
      console.error("Location search error:", error);
    }
  }

  async fetchTimezone(memberId, latitude, longitude) {
    try {
      const response = await fetch(
        `https://api.wheretheiss.at/v1/coordinates/${latitude},${longitude}`
      );
      const data = await response.json();

      if (data.timezone_id) {
        const member = this.members.find((m) => m.id === memberId);
        if (member) {
          member.timezone = data.timezone_id;
          this.saveMembers();
          this.updateMap();
          this.startTimeUpdates();
        }
      }
    } catch (error) {
      console.error("Timezone fetch error:", error);
      const member = this.members.find((m) => m.id === memberId);
      if (member) {
        member.timezone = "Unknown";
        this.saveMembers();
        this.updateMap();
      }
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
