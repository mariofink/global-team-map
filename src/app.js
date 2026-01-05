import map from "./map.js";
import locationSearch from "./components/locationSearch.js";
import { createTeamStore } from "./stores/teamStore.js";
import { memberListHelpers } from "./concerns/memberListHelpers.js";
import { formHandlers } from "./concerns/formHandlers.js";
import { dataOperations } from "./concerns/dataOperations.js";

/**
 * @typedef {ReturnType<typeof import('./stores/teamStore.js').createTeamStore>} TeamStore
 * @typedef {import('./components/locationSearch.js').LocationDetail} LocationDetail
 */
/**
 * @typedef {Object} MemberFormData
 * @property {string} name
 * @property {string} role
 * @property {string} location
 * @property {string} latitude
 * @property {string} longitude
 */

// Wait for Alpine.js to be available
document.addEventListener("alpine:init", () => {
  // Initialize map first (must be done before store tries to update it)
  map.init();

  // Register Alpine.js components
  // @ts-ignore
  window.locationSearch = locationSearch;

  // @ts-ignore
  Alpine.store("team", createTeamStore());
});

// Main Alpine.js app component
// @ts-ignore
window.app = {
  /** @type {MemberFormData} */
  form: {
    name: "",
    role: "",
    location: "",
    latitude: "",
    longitude: "",
  },
  isSubmitting: false,

  // Compose concerns
  ...memberListHelpers,
  ...formHandlers,
  ...dataOperations,

  init() {
    console.log("Alpine app initialized");

    // Listen for location-selected events from location search
    window.addEventListener("location-selected", (e) => {
      const event = /** @type {CustomEvent<LocationDetail>} */ (e);
      this.form.location = event.detail.display_name;
      this.form.latitude = event.detail.latitude.toFixed(6);
      this.form.longitude = event.detail.longitude.toFixed(6);
    });
  },

  /**
   * Display a temporary notification message
   * @param {string} message - Message to display
   * @param {"success" | "error" | "info"} [type="success"] - Notification type
   * @returns {void}
   */
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
