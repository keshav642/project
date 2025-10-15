import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import LaunchCampaignModal from "../components/LaunchCampaignModal.jsx";
import "../styles/campaigndetail.css";

export default function CampaignDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth0();
  
  const [campaign, setCampaign] = useState(null);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaignDetails();
    }
  }, [isAuthenticated, id]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/campaigns/${id}`);
      setCampaign(res.data.campaign);
      setLeads(res.data.leads);
      setStats(res.data.stats);
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      alert("❌ Error loading campaign details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (email) => {
    if (!window.confirm(`Remove ${email} from this campaign?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/campaigns/${id}/leads/${email}`);
      alert("✅ Lead removed from campaign");
      fetchCampaignDetails();
    } catch (error) {
      console.error("Error removing lead:", error);
      alert("❌ Error removing lead");
    }
  };

  const handleToggleStatus = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/api/campaigns/${id}/toggle`);
      alert(`✅ Campaign ${res.data.status}`);
      fetchCampaignDetails();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("❌ Error updating campaign status");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: "#6c757d", emoji: "📝", text: "DRAFT" },
      active: { color: "#28a745", emoji: "🟢", text: "ACTIVE" },
      paused: { color: "#ffc107", emoji: "⏸️", text: "PAUSED" },
      completed: { color: "#17a2b8", emoji: "✅", text: "COMPLETED" }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className="status-badge" style={{ background: badge.color }}>
        {badge.emoji} {badge.text}
      </span>
    );
  };

  const getLeadStatusBadge = (status) => {
    const colors = {
      pending: "#6c757d",
      scheduled: "#17a2b8",
      sent: "#28a745",
      opened: "#007bff",
      clicked: "#ffc107",
      replied: "#28a745"
    };
    return (
      <span className="lead-status-badge" style={{ background: colors[status] || "#6c757d" }}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (!isAuthenticated) {
    return <div className="campaign-detail-container">Please login to view campaign details</div>;
  }

  if (loading) {
    return <div className="campaign-detail-container"><div className="loading">Loading...</div></div>;
  }

  if (!campaign) {
    return <div className="campaign-detail-container"><div className="loading">Campaign not found</div></div>;
  }

  return (
    <div className="campaign-detail-container">
      <div className="header">
        <div className="header-left">
          <h2>{campaign.name}</h2>
          {getStatusBadge(campaign.status)}
        </div>
        <div className="header-actions">
          {/* Launch Button - Only show for draft campaigns */}
          {campaign.status === 'draft' && (
            <button 
              onClick={() => setShowLaunchModal(true)} 
              className="btn btn-launch"
              title="Launch Campaign"
            >
              🚀 Launch Campaign
            </button>
          )}

          {/* Pause/Resume Button - Only show for active/paused campaigns */}
          {(campaign.status === 'active' || campaign.status === 'paused') && (
            <button 
              onClick={handleToggleStatus}
              className={`btn ${campaign.status === 'active' ? 'btn-warning' : 'btn-success'}`}
              title={campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
            >
              {campaign.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
            </button>
          )}

          <button onClick={() => navigate('/campaigns')} className="btn btn-secondary">
            ← Back to Campaigns
          </button>
        </div>
      </div>

      <div className="campaign-info-card">
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Type</div>
            <div className="info-value">{campaign.type.replace('_', ' ')}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Template</div>
            <div className="info-value">{campaign.template_key || 'N/A'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Created</div>
            <div className="info-value">{new Date(campaign.created_at).toLocaleDateString()}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Last Updated</div>
            <div className="info-value">{new Date(campaign.updated_at).toLocaleDateString()}</div>
          </div>
        </div>

        {campaign.description && (
          <div className="description-section">
            <div className="info-label">Description</div>
            <p>{campaign.description}</p>
          </div>
        )}
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{stats.total_leads || 0}</div>
            <div className="stat-label">Total Leads</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-number">{stats.sent || 0}</div>
            <div className="stat-label">Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-number">{stats.pending || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-number">{stats.opened || 0}</div>
            <div className="stat-label">Opened</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🖱️</div>
            <div className="stat-number">{stats.clicked || 0}</div>
            <div className="stat-label">Clicked</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-number">{stats.replied || 0}</div>
            <div className="stat-label">Replied</div>
          </div>
        </div>
      )}

      <div className="leads-section">
        <h3>Campaign Leads ({leads.length})</h3>
        
        {leads.length === 0 ? (
          <div className="empty-state">No leads in this campaign</div>
        ) : (
          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.lead_email}>
                    <td>{lead.name}</td>
                    <td>{lead.lead_email}</td>
                    <td>{lead.designation}</td>
                    <td>{getLeadStatusBadge(lead.status)}</td>
                    <td>{lead.sent_at ? new Date(lead.sent_at).toLocaleString() : '-'}</td>
                    <td>
                      {campaign.status === 'draft' && (
                        <button 
                          onClick={() => handleDeleteLead(lead.lead_email)}
                          className="btn-delete-small"
                          title="Remove from campaign"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Launch Modal */}
      {showLaunchModal && (
        <LaunchCampaignModal
          campaign={campaign}
          onClose={() => setShowLaunchModal(false)}
          onSuccess={fetchCampaignDetails}
        />
      )}
    </div>
  );
}