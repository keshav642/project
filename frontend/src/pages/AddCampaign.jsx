import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "../styles/addcampaign.css";

export default function AddCampaign() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  
  const [formData, setFormData] = useState({
    name: "",
    type: "simple_email",
    template_key: "",
    description: ""
  });

  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
      fetchLeads();
      fetchDesignations();
    }
  }, [isAuthenticated]);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/automation/templates");
      setTemplates(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setFormData(prev => ({ ...prev, template_key: res.data.data[0].key }));
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leads");
      setLeads(res.data.data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leads/designations");
      setDesignations(res.data.data || []);
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesDesignation = !selectedDesignation || 
      lead.designation?.toLowerCase().includes(selectedDesignation.toLowerCase());
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDesignation && matchesSearch;
  });

  const handleSelectLead = (email) => {
    if (selectedLeads.includes(email)) {
      setSelectedLeads(selectedLeads.filter(e => e !== email));
    } else {
      setSelectedLeads([...selectedLeads, email]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredLeads.map(l => l.email));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("⚠️ Please enter campaign name");
      return;
    }

    if (selectedLeads.length === 0) {
      alert("⚠️ Please select at least one lead");
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post("http://localhost:5000/api/campaigns", {
        ...formData,
        lead_emails: selectedLeads
      });

      alert(`✅ Campaign created successfully!\n\n${selectedLeads.length} leads added to campaign.`);
      navigate('/campaigns');
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("❌ Error creating campaign");
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="add-campaign-container">Please login to create campaigns</div>;
  }

  return (
    <div className="add-campaign-container">
      <div className="header">
        <h2>➕ Create New Campaign</h2>
        <button onClick={() => navigate('/campaigns')} className="btn btn-secondary">
          ← Back to Campaigns
        </button>
      </div>

      <div className="campaign-form">
        <div className="form-section">
          <h3>📋 Campaign Details</h3>
          
          <div className="form-group">
            <label>Campaign Name *</label>
            <input
              type="text"
              placeholder="e.g., Q1 2025 Tech Leaders Outreach"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Campaign Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="form-select"
            >
              <option value="simple_email">📧 Simple Email</option>
              <option value="sequence_email">📨 Sequence Email (Coming Soon)</option>
              <option value="linkedin">💼 LinkedIn (Coming Soon)</option>
              <option value="cold_call">📞 Cold Call (Coming Soon)</option>
            </select>
          </div>

          {formData.type === 'simple_email' && (
            <div className="form-group">
              <label>Email Template *</label>
              <select
                value={formData.template_key}
                onChange={(e) => setFormData({ ...formData, template_key: e.target.value })}
                className="form-select"
              >
                {templates.map(t => (
                  <option key={t.key} value={t.key}>
                    {t.name} {t.designation ? `(${t.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              placeholder="Brief description of this campaign..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>👥 Select Leads ({selectedLeads.length} selected)</h3>

          <div className="leads-filters">
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Designations</option>
              {designations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />

            {selectedLeads.length > 0 && (
              <button 
                onClick={() => setSelectedLeads([])} 
                className="btn-clear"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No leads found</td>
                  </tr>
                ) : (
                  filteredLeads.slice(0, 100).map((lead) => (
                    <tr 
                      key={lead.email}
                      className={selectedLeads.includes(lead.email) ? 'selected-row' : ''}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.email)}
                          onChange={() => handleSelectLead(lead.email)}
                        />
                      </td>
                      <td>{lead.name}</td>
                      <td>{lead.email}</td>
                      <td>{lead.designation}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="leads-info">
            Showing {Math.min(filteredLeads.length, 100)} of {filteredLeads.length} leads
          </div>
        </div>

        <div className="form-actions">
          <button
            onClick={handleCreate}
            disabled={creating || !formData.name || selectedLeads.length === 0}
            className="btn btn-success btn-create"
          >
            {creating ? '⏳ Creating...' : `✅ Create Campaign with ${selectedLeads.length} Leads`}
          </button>
        </div>
      </div>
    </div>
  );
}