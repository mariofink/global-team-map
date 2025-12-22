import map from "./map.js";
import locationSearch from "./components/locationSearch.js";
import { createTeamStore } from "./stores/teamStore.js";
import { memberListHelpers } from "./concerns/memberListHelpers.js";
import { formHandlers } from "./concerns/formHandlers.js";
import { dataOperations } from "./concerns/dataOperations.js";

// Wait for Alpine.js to be available
document.addEventListener("alpine:init", () => {
  // Initialize map first (must be done before store tries to update it)
  map.init();

  // Register Alpine.js components
  window.locationSearch = locationSearch;

  // Register Alpine store
  Alpine.store("team", createTeamStore());
  Alpine.store("team").init();
});

// Main Alpine.js app component
window.app = {
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
      this.form.location = e.detail.display_name;
      this.form.latitude = e.detail.latitude.toFixed(6);
      this.form.longitude = e.detail.longitude.toFixed(6);
    });
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
