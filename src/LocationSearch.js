import { escapeHtml } from "./helpers.js";

/**
 * LocationSearch handles geocoding search functionality
 * using OpenStreetMap's Nominatim API
 */
export class LocationSearch {
  constructor() {
    this.searchTimeout = null;
    this.onLocationSelected = null; // Callback when a location is selected
  }

  /**
   * Initialize event listeners for location search
   */
  init() {
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

  /**
   * Handle location search input with debouncing
   */
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

  /**
   * Search for locations using Nominatim API
   */
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

      this.renderSuggestions(results, suggestionsDiv);
    } catch (error) {
      suggestionsDiv.innerHTML =
        '<div class="suggestion-item error">Error searching locations</div>';
      console.error("Location search error:", error);
    }
  }

  /**
   * Render location suggestions in the dropdown
   */
  renderSuggestions(results, suggestionsDiv) {
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
      item.addEventListener("click", () => {
        const lat = parseFloat(item.dataset.lat);
        const lon = parseFloat(item.dataset.lon);
        const name = item.dataset.name;

        if (lat && lon) {
          this.selectLocation(name, lat, lon);
          suggestionsDiv.style.display = "none";
        }
      });
    });
  }

  /**
   * Handle location selection
   */
  selectLocation(name, latitude, longitude) {
    document.getElementById("location").value = name;
    document.getElementById("latitude").value = latitude.toFixed(6);
    document.getElementById("longitude").value = longitude.toFixed(6);

    // Notify callback if set
    if (this.onLocationSelected) {
      this.onLocationSelected({ name, latitude, longitude });
    }
  }

  /**
   * Set callback for when a location is selected
   */
  setOnLocationSelected(callback) {
    this.onLocationSelected = callback;
  }

  /**
   * Clear the search input and results
   */
  clear() {
    document.getElementById("location").value = "";
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
    document.getElementById("locationSuggestions").style.display = "none";
  }
}
