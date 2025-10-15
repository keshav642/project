import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "../styles/leads.css";

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDesignations();
      fetchLeads();
    }
  }, [isAuthenticated]);

  const fetchDesignations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leads/designations");
      setDesignations(res.data.data);
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDesignation) params.designation = selectedDesignation;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get("http://localhost:5000/api/leads", { params });
      setLeads(res.data.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchLeads();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(leads.map(l => l.email));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (email) => {
    if (selectedLeads.includes(email)) {
      setSelectedLeads(selectedLeads.filter(e => e !== email));
    } else {
      setSelectedLeads([...selectedLeads, email]);
    }
  };

  // 🔥 UPDATED: Now uses n8n instead of MailerSend
  const handleSendEmails = async () => {
    if (selectedLeads.length === 0) {
      alert("⚠️ Please select at least one lead");
      return;
    }

    if (!window.confirm(`Send emails to ${selectedLeads.length} leads?\n\n✅ Emails will be sent via Gmail (works with anyone!)\n⏱️ n8n will send within the next 1 minutes.`)) {
      return;
    }

    try {
      setSending(true);
      const employeesToSend = leads.filter(l => selectedLeads.includes(l.email));

      // 🔥 NEW: Use n8n automation endpoint
      const res = await axios.post("http://localhost:5000/api/automation/send-now", {
        employees: employeesToSend,
        template_id: null // Will use default template
      });

      alert(`✅ Success!\n\n${res.data.scheduled} emails scheduled for immediate delivery.\n\nn8n will send them via Gmail within 1 minutes.`);
      setSelectedLeads([]);
    } catch (error) {
      console.error("Error scheduling emails:", error);
      
      let errorMsg = "❌ Error scheduling emails.\n\n";
      
      if (error.response?.data?.error) {
        errorMsg += `Error: ${error.response.data.error}\n\n`;
      }
      
      errorMsg += "Please check:\n";
      errorMsg += "✓ Backend is running\n";
      errorMsg += "✓ Database has email templates\n";
      errorMsg += "✓ n8n workflow is active";
      
      alert(errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="leads-container">Please login to access leads</div>;
  }

  return (
    <div className="leads-container">
      <h2 className="leads-title">Lead Management</h2>

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

        <button onClick={handleFilter} className="btn btn-primary">
          Filter
        </button>

        <button
          onClick={() => navigate('/email-scheduler')}
          className="btn btn-primary"
        >
          📅 Schedule Emails
        </button>

        <button
          onClick={handleSendEmails}
          disabled={sending || selectedLeads.length === 0}
          className="btn btn-success"
          title="Send emails immediately via n8n Gmail (works with anyone!)"
        >
          {sending ? '⏳ Scheduling...' : `Send Emails (${selectedLeads.length})`}
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : (
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.email}>
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
              ))}
            </tbody>
          </table>

          <div className="leads-count">
            Showing {leads.length} leads | Selected: {selectedLeads.length}
          </div>
        </div>
      )}
    </div>
  );
}