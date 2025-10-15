import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "../styles/leadsource.css";

export default function LeadSource() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", description: "" });

  useEffect(() => {
    if (isAuthenticated) {
      fetchSources();
    }
  }, [isAuthenticated]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/sources");
      setSources(res.data.data || []);
    } catch (error) {
      console.error("Error fetching sources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.name.trim()) {
      alert("⚠️ Source name is required");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/sources", newSource);
      alert("✅ Source added successfully!");
      setNewSource({ name: "", description: "" });
      setShowAddForm(false);
      fetchSources();
    } catch (error) {
      console.error("Error adding source:", error);
      alert("❌ Error adding source");
    }
  };

  const handleDeleteSource = async (id, name) => {
    if (!window.confirm(`Delete source "${name}"?\n\nNote: This will not delete leads, only the source reference.`)) {
      return;
    }

    try {
      const res = await axios.delete(`http://localhost:5000/api/sources/${id}`);
      alert("✅ Source deleted successfully!");
      fetchSources();
    } catch (error) {
      console.error("Error deleting source:", error);
      const errorMsg = error.response?.data?.error || "Error deleting source";
      alert(`❌ ${errorMsg}`);
    }
  };

  if (!isAuthenticated) {
    return <div className="lead-source-container">Please login to manage sources</div>;
  }

  return (
    <div className="lead-source-container">
      <div className="header">
        <h2>📊 Lead Sources</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn btn-primary"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Source'}
          </button>
          <button onClick={() => navigate('/lead-browser')} className="btn btn-secondary">
            ← Back to Browser
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-source-form">
          <h3>Add New Source</h3>
          <input
            type="text"
            placeholder="Source Name (e.g., LinkedIn, Cold Email)"
            value={newSource.name}
            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            className="form-input"
          />
          <textarea
            placeholder="Description (optional)"
            value={newSource.description}
            onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
            className="form-textarea"
            rows="3"
          />
          <button onClick={handleAddSource} className="btn btn-success">
            ✅ Add Source
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading sources...</div>
      ) : (
        <div className="sources-grid">
          {sources.map((source) => (
            <div key={source.id} className="source-card">
              <div className="source-icon">📌</div>
              <h3>{source.name}</h3>
              <p>{source.description || 'No description'}</p>
              <div className="source-meta">
                <span>ID: {source.id}</span>
              </div>
              
              {/* Delete Button */}
              <button 
                onClick={() => handleDeleteSource(source.id, source.name)}
                className="btn-delete-source"
                title="Delete Source"
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && sources.length === 0 && (
        <div className="empty-state">
          <p>No sources found. Add your first source!</p>
        </div>
      )}
    </div>
  );
}