// Global Team Map Application
class GlobalTeamApp {
  constructor() {
    this.members = this.loadMembers();
    this.map = null;
    this.markers = {};
    this.init();
  }

  init() {
    this.initMap();
    this.initEventListeners();
    this.renderMembers();
    this.updateMap();
  }

  initMap() {
    // Initialize Leaflet map
    this.map = L.map("map").setView([20, 0], 2);

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(this.map);
  }

  initEventListeners() {
    const form = document.getElementById("memberForm");
    form.addEventListener("submit", (e) => this.handleAddMember(e));
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
    };

    this.members.push(member);
    this.saveMembers();
    this.renderMembers();
    this.updateMap();

    // Reset form
    e.target.reset();

    // Fly to new member location
    this.map.flyTo([latitude, longitude], 6, {
      duration: 1.5,
    });
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
                        <div class="member-name">${this.escapeHtml(
                          member.name
                        )}</div>
                        ${
                          member.role
                            ? `<div class="member-role">${this.escapeHtml(
                                member.role
                              )}</div>`
                            : ""
                        }
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); app.deleteMember('${
                      member.id
                    }')">Remove</button>
                </div>
                <div class="member-location">${this.escapeHtml(
                  member.location
                )}</div>
            </div>
        `
      )
      .join("");
  }

  updateMap() {
    // Clear existing markers
    Object.values(this.markers).forEach((marker) => marker.remove());
    this.markers = {};

    // Add markers for all members
    this.members.forEach((member) => {
      const marker = L.marker([member.latitude, member.longitude]).addTo(
        this.map
      ).bindPopup(`
                    <div class="popup-content">
                        <h3>${this.escapeHtml(member.name)}</h3>
                        ${
                          member.role
                            ? `<p><strong>Role:</strong> ${this.escapeHtml(
                                member.role
                              )}</p>`
                            : ""
                        }
                        <p><strong>Location:</strong> ${this.escapeHtml(
                          member.location
                        )}</p>
                        <p><strong>Coordinates:</strong> ${member.latitude.toFixed(
                          4
                        )}, ${member.longitude.toFixed(4)}</p>
                    </div>
                `);

      this.markers[member.id] = marker;
    });

    // Fit map to show all markers
    if (this.members.length > 0) {
      const bounds = L.latLngBounds(
        this.members.map((m) => [m.latitude, m.longitude])
      );
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }

  flyToMember(id) {
    const member = this.members.find((m) => m.id === id);
    if (member) {
      this.map.flyTo([member.latitude, member.longitude], 8, {
        duration: 1.5,
      });
      this.markers[id].openPopup();
    }
  }

  saveMembers() {
    localStorage.setItem("globalTeamMembers", JSON.stringify(this.members));
  }

  loadMembers() {
    const stored = localStorage.getItem("globalTeamMembers");
    return stored ? JSON.parse(stored) : [];
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new GlobalTeamApp();
});
