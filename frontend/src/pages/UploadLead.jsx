import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "../styles/uploadlead.css";

export default function UploadLead() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  const [file, setFile] = useState(null);
  const [sourceId, setSourceId] = useState("");
  const [sources, setSources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSources();
    }
  }, [isAuthenticated]);

  const fetchSources = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sources");
      setSources(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSourceId(res.data.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching sources:", error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("⚠️ Please select a CSV file");
      return;
    }

    if (!sourceId) {
      alert("⚠️ Please select a source");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source_id", sourceId);

      const res = await axios.post(
        "http://localhost:5000/api/upload/csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(`✅ Success!\n\n${res.data.imported} leads imported successfully!`);
      setFile(null);
      navigate("/lead-browser");
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Error uploading file. Please check console.");
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="upload-lead-container">Please login to upload leads</div>;
  }

  return (
    <div className="upload-lead-container">
      <div className="header">
        <h2>📤 Upload Leads</h2>
        <button onClick={() => navigate('/lead-browser')} className="btn btn-secondary">
          ← Back to Browser
        </button>
      </div>

      <div className="upload-card">
        <div className="source-selection">
          <label>Select Lead Source:</label>
          <select 
            value={sourceId} 
            onChange={(e) => setSourceId(e.target.value)}
            className="source-select"
          >
            {sources.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div 
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="file-input"
            style={{ display: 'none' }}
          />
          
          {file ? (
            <div className="file-selected">
              <div className="file-icon">📄</div>
              <div className="file-name">{file.name}</div>
              <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
              <button 
                onClick={() => setFile(null)} 
                className="btn-remove"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon">☁️</div>
              <h3>Drag & Drop CSV File</h3>
              <p>or</p>
              <label htmlFor="file-input" className="btn btn-primary">
                Browse Files
              </label>
              <p className="hint">CSV format: name, email, designation</p>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn btn-success btn-upload"
        >
          {uploading ? '⏳ Uploading...' : '🚀 Upload & Import Leads'}
        </button>
      </div>

      <div className="instructions">
        <h3>📋 CSV Format Instructions</h3>
        <p>Your CSV file should have these columns:</p>
        <ul>
          <li><strong>name</strong> - Lead's full name</li>
          <li><strong>email</strong> - Lead's email address (required)</li>
          <li><strong>designation</strong> - Job title/position</li>
        </ul>
        <p className="example">Example: <code>John Doe,john@example.com,CTO</code></p>
      </div>
    </div>
  );
}
