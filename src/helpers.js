/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} HTML-safe string
 */
const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Fetch timezone information for given coordinates
 * @param {number} latitude - Geographic latitude
 * @param {number} longitude - Geographic longitude
 * @returns {Promise<string>} IANA timezone identifier
 */
const fetchTimezone = async (latitude, longitude) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Use WhereTheISS API to get timezone information
      const response = await fetch(
        `https://api.wheretheiss.at/v1/coordinates/${latitude},${longitude}`
      );
      const data = await response.json();

      console.log("Timezone data:", data);
      if (data.timezone_id) {
        resolve(data.timezone_id);
      }
    } catch (error) {
      console.error("Timezone fetch error:", error);
      reject();
    }
  });
};

/**
 * Get CORS proxy URL for external URLs
 * Checks if URL is same-origin, if not, uses CORS proxy
 * @param {string} url - The URL to fetch from
 * @returns {string} The URL to use (with proxy if needed)
 */
const getCorsProxyUrl = (url) => {
  try {
    const targetUrl = new URL(url);
    const currentOrigin = window.location.origin;

    // If same origin, no proxy needed
    if (targetUrl.origin === currentOrigin) {
      return url;
    }

    // Use CORS proxy for external URLs
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  } catch (error) {
    // If URL parsing fails, return as-is
    return url;
  }
};

export { escapeHtml, fetchTimezone, getCorsProxyUrl };
