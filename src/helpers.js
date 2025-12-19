const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

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

export { escapeHtml, fetchTimezone };
