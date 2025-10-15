import { useState } from "react";
import axios from "axios";
import "../styles/launchmodal.css";

export default function LaunchCampaignModal({ campaign, onClose, onSuccess }) {
  const [scheduledTime, setScheduledTime] = useState("");
  const [launching, setLaunching] = useState(false);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const handleLaunch = async () => {
    if (!scheduledTime) {
      alert("⚠️ Please select a schedule time");
      return;
    }

    const selectedTime = new Date(scheduledTime);
    const now = new Date();

    if (selectedTime <= now) {
      alert("⚠️ Scheduled time must be in the future");
      return;
    }

    if (!window.confirm(`Launch campaign "${campaign.name}"?\n\nEmails will be scheduled for: ${new Date(scheduledTime).toLocaleString()}`)) {
      return;
    }

    try {
      setLaunching(true);
      const res = await axios.post(
        `http://localhost:5000/api/campaigns/${campaign.id}/launch`,
        { scheduled_time: scheduledTime }
      );

      alert(`✅ Campaign Launched!\n\n${res.data.message}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error launching campaign:", error);
      alert(`❌ Error launching campaign\n\n${error.response?.data?.error || error.message}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚀 Launch Campaign</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="campaign-summary">
            <h3>{campaign.name}</h3>
            <div className="summary-row">
              <span className="label">Type:</span>
              <span className="value">{campaign.type.replace('_', ' ')}</span>
            </div>
            <div className="summary-row">
              <span className="label">Template:</span>
              <span className="value">{campaign.template_key || 'Default'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Total Leads:</span>
              <span className="value highlight">{campaign.total_leads || 0}</span>
            </div>
          </div>

          <div className="schedule-section">
            <label className="schedule-label">
              📅 Schedule Send Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={getMinDateTime()}
              className="schedule-input"
            />
            {scheduledTime && (
              <div className="schedule-preview">
                Emails will be sent at: <strong>{new Date(scheduledTime).toLocaleString()}</strong>
              </div>
            )}
          </div>

          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Important:</strong> Once launched, emails will be automatically sent to all leads at the scheduled time via n8n automation.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={launching}>
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            className="btn btn-launch"
            disabled={launching || !scheduledTime}
          >
            {launching ? '⏳ Launching...' : '🚀 Launch Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}