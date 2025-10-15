import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/leadbrowser.css";

export default function LeadBrowser() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchSources();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/leads");
      setLeads(res.data.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sources");
      setSources(res.data.data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredLeads = selectedSource
    ? leads.filter(l => l.source_id === parseInt(selectedSource))
    : leads;

  return (
    <div className="lead-browser-container">
      <div className="header">
        <h2>🔍 Lead Browser</h2>
        <div className="header-actions">
          <button onClick={() => navigate('/lead-source')} className="btn btn-secondary">
            Manage Sources
          </button>
          <button onClick={() => navigate('/upload-lead')} className="btn btn-primary">
            Upload Leads
          </button>
        </div>
      </div>

      <div className="filters">
        <select 
          value={selectedSource} 
          onChange={(e) => setSelectedSource(e.target.value)}
          className="filter-select"
        >
          <option value="">All Sources</option>
          {sources.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Designation</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead, idx) => (
              <tr key={idx}>
                <td>{lead.name}</td>
                <td>{lead.email}</td>
                <td>{lead.designation}</td>
                <td>{sources.find(s => s.id === lead.source_id)?.name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="stats">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>
    </div>
  );
}