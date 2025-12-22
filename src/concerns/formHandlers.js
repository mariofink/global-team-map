/**
 * Form Handling Logic
 */
export const formHandlers = {
  async handleAddMember(event) {
    const latitude = parseFloat(this.form.latitude);
    const longitude = parseFloat(this.form.longitude);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      alert("Please select a location from the search results");
      return;
    }

    if (latitude < -90 || latitude > 90) {
      alert("Latitude must be between -90 and 90");
      return;
    }

    if (longitude < -180 || longitude > 180) {
      alert("Longitude must be between -180 and 180");
      return;
    }

    this.isSubmitting = true;

    try {
      const member = await Alpine.store("team").addMember({
        name: this.form.name,
        role: this.form.role,
        location: this.form.location,
        latitude,
        longitude,
      });

      if (member) {
        // Close dialog
        this.$refs.dialog.close();

        // Show notification
        this.showNotification("Team member added successfully!", "success");
      }
    } catch (error) {
      alert("Failed to add team member");
    } finally {
      this.isSubmitting = false;
    }
  },

  resetForm() {
    this.form = {
      name: "",
      role: "",
      location: "",
      latitude: "",
      longitude: "",
    };
    // Trigger location search reset
    window.dispatchEvent(new CustomEvent("reset-location-search"));
  },
};
