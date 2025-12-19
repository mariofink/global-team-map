/**
 * TeamMemberList Web Component
 * Displays a list of team members with interactive cards
 *
 * Usage:
 * <team-member-list></team-member-list>
 *
 * Properties:
 * - members: Array of team member objects
 *
 * Events:
 * - member-click: Fired when a member card is clicked
 *   detail: { memberId }
 * - member-delete: Fired when delete button is clicked
 *   detail: { memberId }
 */
export class TeamMemberList extends HTMLElement {
  constructor() {
    super();
    this._members = [];
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  set members(value) {
    this._members = value || [];
    this.render();
  }

  get members() {
    return this._members;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        * {
          box-sizing: border-box;
        }

        .header {
          margin-bottom: 15px;
        }

        .header h2 {
          font-size: 1.3em;
          margin: 0;
          color: #333;
          font-family: inherit;
        }

        .member-count {
          font-weight: normal;
        }

        .member-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-message {
          color: #999;
          text-align: center;
          padding: 20px;
          font-family: inherit;
        }

        .member-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .member-card:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .member-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .member-info {
          flex: 1;
        }

        .member-name {
          font-weight: 700;
          color: #333;
          font-size: 1.1em;
          font-family: inherit;
        }

        .member-role {
          color: #667eea;
          font-size: 0.85em;
          font-weight: 600;
          margin-top: 2px;
        }

        .member-location {
          color: #666;
          font-size: 0.9em;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .member-location::before {
          content: "📍";
        }

        .delete-btn {
          background: #ff4757;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85em;
          transition: background 0.2s;
          font-family: inherit;
        }

        .delete-btn:hover {
          background: #ff3838;
        }
      </style>

      <div class="header">
        <h2>Team Members (<span class="member-count">${
          this._members.length
        }</span>)</h2>
      </div>

      <div class="member-list">
        ${
          this._members.length === 0
            ? '<p class="empty-message">No team members yet. Add your first member!</p>'
            : this._members
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((member) => this.renderMemberCard(member))
                .join("")
        }
      </div>
    `;

    this.attachEventListeners();
  }

  renderMemberCard(member) {
    return `
      <div class="member-card" data-member-id="${member.id}">
        <div class="member-card-header">
          <div class="member-info">
            <div class="member-name">${this.escapeHtml(member.name)}</div>
            ${
              member.role
                ? `<div class="member-role">${this.escapeHtml(
                    member.role
                  )}</div>`
                : ""
            }
          </div>
          <button class="delete-btn" data-member-id="${
            member.id
          }">Remove</button>
        </div>
        <div class="member-location">${this.escapeHtml(member.location)}</div>
      </div>
    `;
  }

  attachEventListeners() {
    const cards = this.shadowRoot.querySelectorAll(".member-card");
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't trigger if delete button was clicked
        if (e.target.classList.contains("delete-btn")) {
          return;
        }
        const memberId = card.dataset.memberId;
        this.dispatchEvent(
          new CustomEvent("member-click", {
            detail: { memberId },
            bubbles: true,
            composed: true,
          })
        );
      });
    });

    const deleteButtons = this.shadowRoot.querySelectorAll(".delete-btn");
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const memberId = btn.dataset.memberId;
        this.dispatchEvent(
          new CustomEvent("member-delete", {
            detail: { memberId },
            bubbles: true,
            composed: true,
          })
        );
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Register the custom element
customElements.define("team-member-list", TeamMemberList);
