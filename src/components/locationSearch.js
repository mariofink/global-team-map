/**
 * Location Search Alpine.js Component
 * Handles location autocomplete using Nominatim API
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
      const detail = {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        display_name: location.display_name,
      };

      // Dispatch event for parent component
      window.dispatchEvent(new CustomEvent("location-selected", { detail }));

      this.query = location.display_name;
      this.results = [];
    },
  };
}
