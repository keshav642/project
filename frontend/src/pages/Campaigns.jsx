import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "../styles/campaigns.css";

export default function Campaigns() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
    }
  }, [isAuthenticated]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/campaigns");
      setCampaigns(res.data.data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete campaign "${name}"?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/campaigns/${id}`);
      alert("✅ Campaign deleted successfully!");
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert("❌ Error deleting campaign");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/campaigns/${id}/toggle`);
      alert(`✅ Campaign ${res.data.status}`);
      fetchCampaigns();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("❌ Error updating campaign status");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: "#6c757d", emoji: "📝" },
      active: { color: "#28a745", emoji: "🟢" },
      paused: { color: "#ffc107", emoji: "⏸️" },
      completed: { color: "#17a2b8", emoji: "✅" }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className="status-badge" style={{ background: badge.color }}>
        {badge.emoji} {status.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const types = {
      simple_email: { label: "Simple Email", emoji: "📧" },
      sequence_email: { label: "Sequence", emoji: "📨" },
      linkedin: { label: "LinkedIn", emoji: "💼" },
      cold_call: { label: "Cold Call", emoji: "📞" }
    };
    const typeInfo = types[type] || { label: type, emoji: "📋" };
    return `${typeInfo.emoji} ${typeInfo.label}`;
  };

  if (!isAuthenticated) {
    return <div className="campaigns-container">Please login to view campaigns</div>;
  }

  return (
    <div className="campaigns-container">
      <div className="header">
        <h2>🎯 Campaign Management</h2>
        <div className="header-actions">
          <button onClick={() => navigate('/add-campaign')} className="btn btn-primary">
            ➕ Create Campaign
          </button>
          <button onClick={() => navigate('/lead-browser')} className="btn btn-secondary">
            ← Back to Browser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No campaigns yet</h3>
          <p>Create your first campaign to start reaching out to leads!</p>
          <button onClick={() => navigate('/add-campaign')} className="btn btn-primary">
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3>{campaign.name}</h3>
                {getStatusBadge(campaign.status)}
              </div>

              <div className="campaign-type">
                {getTypeBadge(campaign.type)}
              </div>

              {campaign.description && (
                <p className="campaign-description">{campaign.description}</p>
              )}

              <div className="campaign-stats">
                <div className="stat-item">
                  <div className="stat-value">{campaign.total_leads || 0}</div>
                  <div className="stat-label">Total Leads</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{campaign.sent_count || 0}</div>
                  <div className="stat-label">Sent</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{campaign.opened_count || 0}</div>
                  <div className="stat-label">Opened</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{campaign.replied_count || 0}</div>
                  <div className="stat-label">Replied</div>
                </div>
              </div>

              <div className="campaign-meta">
                <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
              </div>

              <div className="campaign-actions">
                <button 
                  onClick={() => navigate(`/campaign/${campaign.id}`)}
                  className="btn-action btn-view"
                  title="View Details"
                >
                  👁️ View
                </button>
                
                {campaign.status === 'draft' && (
                  <button 
                    onClick={() => navigate(`/campaign/${campaign.id}/launch`)}
                    className="btn-action btn-launch"
                    title="Launch Campaign"
                  >
                    🚀 Launch
                  </button>
                )}

                {(campaign.status === 'active' || campaign.status === 'paused') && (
                  <button 
                    onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                    className="btn-action btn-toggle"
                    title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {campaign.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
                  </button>
                )}

                <button 
                  onClick={() => handleDelete(campaign.id, campaign.name)}
                  className="btn-action btn-delete"
                  title="Delete Campaign"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="campaigns-summary">
        <span>Total Campaigns: {campaigns.length}</span>
        <span>Active: {campaigns.filter(c => c.status === 'active').length}</span>
        <span>Draft: {campaigns.filter(c => c.status === 'draft').length}</span>
      </div>
    </div>
  );
}