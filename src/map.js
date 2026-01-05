/**
 * @typedef { import("./TeamMemberManager.js").TeamMember } TeamMember
 */

/** @type {typeof import('leaflet')} */
const L = globalThis.L;

import { escapeHtml } from "./helpers.js";

let map;
let markers = {};

const getLocalTime = (timezone) => {
  try {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    return "Invalid timezone";
  }
};

const init = () => {
  // Initialize Leaflet map
  map = L.map("map").setView([20, 0], 2);
  // Add OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);
};

/**
 * @param {TeamMember[]} members
 */
const updateMap = (members) => {
  if (!map) return;
  // Clear existing markers
  Object.values(markers).forEach((marker) => marker.remove());
  markers = {};

  // Add markers for all members
  members.forEach((member) => {
    const marker = L.marker([member.latitude, member.longitude]).addTo(map)
      .bindPopup(`
                    <div class="map-popup-content">
                        <h3>${escapeHtml(member.name)}</h3>
                        ${
                          member.role
                            ? `<p><strong>Role:</strong> ${escapeHtml(
                                member.role
                              )}</p>`
                            : ""
                        }
                        <p><strong>📍 </strong> ${escapeHtml(
                          member.location
                        )}</p>
                        ${
                          member.timezone
                            ? `<p><strong>🕐 </strong> 
                                ${getLocalTime(member.timezone)} 
                                (${member.timezone || "Unknown"})
                              </p>`
                            : ""
                        }
                    </div>
                `);

    markers[member.id] = marker;
  });

  // Fit map to show all markers
  if (members.length > 0) {
    const bounds = L.latLngBounds(
      members.map((m) => [m.latitude, m.longitude])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }
};

const flyTo = (latlon) => {
  map.flyTo(latlon, 6, {
    duration: 1.5,
  });
};

const openPopup = (id) => {
  markers[id] && markers[id].openPopup();
};

export default { init, updateMap, flyTo, openPopup };
