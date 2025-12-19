const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const fetchTimezone = async (latitude, longitude) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Use timeapi.io to get timezone information
      const response = await fetch(
        `https://timeapi.io/api/TimeZone/coordinate?latitude=${latitude}&longitude=${longitude}`
      );
      const data = await response.json();

      console.log("Timezone data:", data);
      if (data.timeZone) {
        resolve(data.timeZone);
      }
    } catch (error) {
      console.error("Timezone fetch error:", error);
      reject();
    }
  });
};

export { escapeHtml, fetchTimezone };
