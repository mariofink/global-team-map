/**
 * Location Search Alpine.js Component
 * Handles location autocomplete using Nominatim API
 */

/**
 * @typedef {Object} LocationDetail
 * @property {number} latitude - The latitude coordinate of the location
 * @property {number} longitude - The longitude coordinate of the location
 * @property {string} display_name - The human-readable name/address of the location
 */

export default function locationSearch() {
  return {
    query: "",
    results: [],

    init() {
      // Listen for reset events from parent
      window.addEventListener("reset-location-search", () => {
        this.query = "";
        this.results = [];
      });
    },

    async search() {
      if (this.query.length < 3) {
        this.results = [];
        return;
      }

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          this.query
        )}`;
        const response = await fetch(url);
        this.results = await response.json();
      } catch (error) {
        console.error("Location search failed:", error);
        this.results = [];
      }
    },

    selectLocation(location) {
      /** @type {LocationDetail} */
      const detail = {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        display_name: this.formatLocation(location.display_name),
      };

      // Dispatch event for parent component
      window.dispatchEvent(new CustomEvent("location-selected", { detail }));

      this.query = location.display_name;
      this.results = [];
    },

    /**
     * Format location string to show only city and country
     * Takes a full location string and extracts city and country
     * @param {string} fullLocation - Full location string from Nominatim (e.g., "Fulda, Landkreis Fulda, Hessen, Deutschland")
     * @returns {string} Formatted location as "City, Country"
     */
    formatLocation: (fullLocation) => {
      if (!fullLocation) return "";

      const parts = fullLocation.split(",").map((part) => part.trim());

      if (parts.length === 0) return fullLocation;
      if (parts.length === 1) return parts[0];

      // First part is usually the city/town, last part is usually the country
      const city = parts[0];
      const country = parts[parts.length - 1];

      return `${city}, ${country}`;
    },
  };
}
