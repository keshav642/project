import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "../styles/emailscheduler.css";

export default function EmailScheduler() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  
  // Leads data
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  // Filters
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection
  const [selectedLeads, setSelectedLeads] = useState([]);
  
  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  
  // Scheduling
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  
  // Stats
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    fetchLeads();
    fetchDesignations();
    fetchTemplates();
    fetchStats();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Apply filters
    let filtered = [...leads];
    
    // Designation filter
    if (selectedDesignation) {
      filtered = filtered.filter(lead => 
        lead.designation?.toLowerCase().includes(selectedDesignation.toLowerCase())
      );
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(lead => 
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredLeads(filtered);
  }, [leads, selectedDesignation, searchQuery]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/leads");
      setLeads(res.data.data || []);
      setFilteredLeads(res.data.data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
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

  const fetchTemplates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/automation/templates");
      setTemplates(res.data.data || []);
      
      // Auto-select first template
      if (res.data.data && res.data.data.length > 0) {
        setSelectedTemplate(res.data.data[0].key);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/automation/stats");
      setStats(res.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

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

  const clearFilters = () => {
    setSelectedDesignation("");
    setSearchQuery("");
  };

  const handleSchedule = async () => {
    if (selectedLeads.length === 0) {
      alert("⚠️ Please select at least one lead");
      return;
    }
    
    if (!selectedTemplate) {
      alert("⚠️ Please select an email template");
      return;
    }
    
    if (!scheduledTime) {
      alert("⚠️ Please select a scheduled time");
      return;
    }

    const selectedTime = new Date(scheduledTime);
    const now = new Date();
    
    if (selectedTime <= now) {
      alert("⚠️ Scheduled time must be in the future");
      return;
    }

    if (!window.confirm(`Schedule ${selectedLeads.length} emails for ${new Date(scheduledTime).toLocaleString()}?`)) {
      return;
    }

    try {
      setScheduling(true);
      const employeesToSchedule = filteredLeads.filter(l => selectedLeads.includes(l.email));
      
      const res = await axios.post("http://localhost:5000/api/automation/schedule-emails", {
        employees: employeesToSchedule,
        template_key: selectedTemplate,
        scheduled_time: scheduledTime
      });

      alert(`✅ Success!\n\n${res.data.scheduled} emails scheduled for ${new Date(scheduledTime).toLocaleString()}\n\nn8n will automatically send them at the scheduled time.`);
      
      setSelectedLeads([]);
      setScheduledTime("");
      fetchStats();
      
    } catch (error) {
      console.error("Error scheduling:", error);
      alert("❌ Error scheduling emails. Please check console.");
    } finally {
      setScheduling(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  if (!isAuthenticated) {
    return <div className="email-scheduler-container">Please login to access scheduler</div>;
  }

  return (
    <div className="email-scheduler-container">
      <div className="scheduler-header">
        <h2 className="scheduler-title">📧 Email Scheduler</h2>
        <button onClick={() => navigate('/leads')} className="btn-back-header">
          ← Back to Leads
        </button>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card pending">
            <div className="stat-number">{stats.pending || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card sent">
            <div className="stat-number">{stats.sent || 0}</div>
            <div className="stat-label">Sent</div>
          </div>
          <div className="stat-card opened">
            <div className="stat-number">{stats.opened || 0}</div>
            <div className="stat-label">Opened</div>
          </div>
          <div className="stat-card failed">
            <div className="stat-number">{stats.failed || 0}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
      )}

      <div className="scheduler-content">
        {/* Left Column - Template & Time Selection */}
        <div className="scheduler-left">
          {/* Template Selection */}
          <div className="scheduler-section">
            <h3 className="section-title">1️⃣ Select Email Template</h3>
            <div className="templates-grid">
              {templates.map(template => (
                <div
                  key={template.key}
                  className={`template-card ${selectedTemplate === template.key ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template.key)}
                >
                  <div className="template-name">{template.name}</div>
                  <div className="template-subject">{template.subject}</div>
                  {template.designation && (
                    <span className="template-badge">{template.designation}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="scheduler-section">
            <h3 className="section-title">2️⃣ Select Schedule Time</h3>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={getMinDateTime()}
              className="datetime-input"
            />
            {scheduledTime && (
              <div className="time-preview">
                📅 Will send at: <strong>{new Date(scheduledTime).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {/* Schedule Action */}
          <div className="scheduler-section">
            <button
              onClick={handleSchedule}
              disabled={scheduling || selectedLeads.length === 0 || !selectedTemplate || !scheduledTime}
              className="btn-schedule"
            >
              {scheduling ? '⏳ Scheduling...' : `🚀 Schedule ${selectedLeads.length} Email${selectedLeads.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {/* Right Column - Lead Selection with Filters */}
        <div className="scheduler-right">
          <div className="scheduler-section">
            <h3 className="section-title">3️⃣ Select Leads ({selectedLeads.length} selected)</h3>
            
            {/* Filters */}
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

              {(selectedDesignation || searchQuery) && (
                <button onClick={clearFilters} className="btn-clear">
                  Clear Filters
                </button>
              )}
            </div>

            {/* Lead Selection Info */}
            <div className="selection-info">
              <span>Showing {filteredLeads.length} of {leads.length} leads</span>
              {selectedLeads.length > 0 && (
                <button 
                  onClick={() => setSelectedLeads([])} 
                  className="btn-clear-selection"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Leads Table */}
            {loading ? (
              <div className="loading-state">Loading leads...</div>
            ) : (
              <div className="leads-table-wrapper">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
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
                        <td colSpan="4" className="no-data">
                          No leads found. Try adjusting your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr 
                          key={lead.email}
                          className={selectedLeads.includes(lead.email) ? 'selected-row' : ''}
                        >
                          <td className="checkbox-col">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}