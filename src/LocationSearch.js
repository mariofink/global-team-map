/**
 * LocationSearch Web Component
 * A custom element for geocoding search using OpenStreetMap's Nominatim API
 *
 * Usage:
 * <location-search></location-search>
 *
 * Events:
 * - location-selected: Fired when a location is selected
 *   detail: { name, latitude, longitude }
 *
 * Attributes:
 * - placeholder: Placeholder text for the input
 * - required: Whether the input is required
 */
export class LocationSearch extends HTMLElement {
  constructor() {
    super();
    this.searchTimeout = null;
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.initEventListeners();
  }

  disconnectedCallback() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  render() {
    const placeholder =
      this.getAttribute("placeholder") || "Search for a location...";
    const required = this.hasAttribute("required");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }

        * {
          box-sizing: border-box;
        }

        .search-input {
          width: 100%;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 1em;
          transition: border-color 0.3s;
          font-family: inherit;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #667eea;
          border-top: none;
          border-radius: 0 0 6px 6px;
          max-height: 250px;
          overflow-y: auto;
          z-index: 100;
          display: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .suggestions.show {
          display: block;
        }

        .suggestion-item {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: #f8f9fa;
        }

        .suggestion-item.no-results,
        .suggestion-item.error {
          cursor: default;
          color: #999;
          text-align: center;
        }

        .suggestion-loading {
          padding: 12px;
          text-align: center;
          color: #667eea;
          font-weight: 600;
        }

        .suggestion-name {
          font-size: 0.9em;
          color: #333;
        }
      </style>

      <input 
        type="text" 
        class="search-input" 
        placeholder="${placeholder}"
        ${required ? "required" : ""}
        autocomplete="off"
      />
      <div class="suggestions"></div>
    `;
  }

  initEventListeners() {
    const input = this.shadowRoot.querySelector(".search-input");
    const suggestions = this.shadowRoot.querySelector(".suggestions");

    input.addEventListener("input", (e) => this.handleInput(e));
    input.addEventListener("focus", () => {
      if (input.value.length > 2) {
        suggestions.classList.add("show");
      }
    });

    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.composedPath().includes(this)) {
        suggestions.classList.remove("show");
      }
    });
  }

  handleInput(event) {
    const query = event.target.value.trim();
    const suggestions = this.shadowRoot.querySelector(".suggestions");

    if (query.length < 3) {
      suggestions.classList.remove("show");
      return;
    }

    // Debounce the search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchLocation(query);
    }, 300);
  }

  async searchLocation(query) {
    const suggestions = this.shadowRoot.querySelector(".suggestions");
    suggestions.innerHTML =
      '<div class="suggestion-loading">Searching...</div>';
    suggestions.classList.add("show");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const results = await response.json();

      if (results.length === 0) {
        suggestions.innerHTML =
          '<div class="suggestion-item no-results">No locations found</div>';
        return;
      }

      this.renderSuggestions(results);
    } catch (error) {
      suggestions.innerHTML =
        '<div class="suggestion-item error">Error searching locations</div>';
      console.error("Location search error:", error);
    }
  }

  renderSuggestions(results) {
    const suggestions = this.shadowRoot.querySelector(".suggestions");

    suggestions.innerHTML = results
      .map(
        (result) => `
          <div class="suggestion-item" data-lat="${result.lat}" data-lon="${
          result.lon
        }" data-name="${this.escapeHtml(result.display_name)}">
            <div class="suggestion-name">${this.escapeHtml(
              result.display_name
            )}</div>
          </div>
        `
      )
      .join("");

    // Add click handlers to suggestions
    suggestions.querySelectorAll(".suggestion-item").forEach((item) => {
      item.addEventListener("click", () => {
        const lat = parseFloat(item.dataset.lat);
        const lon = parseFloat(item.dataset.lon);
        const name = item.dataset.name;

        if (lat && lon) {
          this.selectLocation(name, lat, lon);
          suggestions.classList.remove("show");
        }
      });
    });
  }

  selectLocation(name, latitude, longitude) {
    const input = this.shadowRoot.querySelector(".search-input");
    input.value = name;

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent("location-selected", {
        detail: { name, latitude, longitude },
        bubbles: true,
        composed: true,
      })
    );
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  getValue() {
    return this.shadowRoot.querySelector(".search-input").value;
  }

  setValue(value) {
    this.shadowRoot.querySelector(".search-input").value = value;
  }

  clear() {
    const input = this.shadowRoot.querySelector(".search-input");
    const suggestions = this.shadowRoot.querySelector(".suggestions");
    input.value = "";
    suggestions.classList.remove("show");
  }
}

// Register the custom element
customElements.define("location-search", LocationSearch);
