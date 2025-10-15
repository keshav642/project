import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import BasicTable from "../components/basic-table";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const { user, isAuthenticated, logout, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else {
      fetchUsers();
      checkGoogleConnection();
    }
    
    if (searchParams.get('google_connected') === 'true') {
      alert("Google Docs connected successfully!");
      setGoogleConnected(true);
      setSearchParams({});
    }
    if (searchParams.get('error') === 'google_auth_failed') {
      alert("Google authentication failed. Please try again.");
      setSearchParams({});
    }
  }, [isAuthenticated, searchParams]);

  const fetchUsers = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const userId = user?.sub || 'default_user';
      const res = await axios.get(`http://localhost:5000/google/token/${userId}`);
      if (res.data) {
        setGoogleConnected(true);
      }
    } catch (err) {
      setGoogleConnected(false);
    }
  };

  const handleLogout = () => {
    logout({ 
      logoutParams: { returnTo: window.location.origin } 
    });
  };

  const handleGoogleConnect = () => {
    const userId = user?.sub || 'default_user';
    window.location.href = `http://localhost:5000/auth/google?userId=${userId}`;
  };

  const handleGoogleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Docs?")) {
      return;
    }
    
    try {
      const userId = user?.sub || 'default_user';
      await axios.delete(`http://localhost:5000/google/disconnect/${userId}`);
      setGoogleConnected(false);
      alert("Google Docs disconnected successfully!");
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect Google Docs");
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Welcome, {user?.name}</h2>

      <div className="dashboard-buttons">
        <button 
          onClick={() => navigate('/leads')} 
          className="btn btn-primary"
        >
          Lead Management
        </button>
        <button 
          onClick={googleConnected ? handleGoogleDisconnect : handleGoogleConnect} 
          className={googleConnected ? "btn btn-danger" : "btn btn-primary"}
        >
          {googleConnected ? "Disconnect Google Docs" : "Connect Google Docs"}
        </button>
        <button onClick={handleLogout} className="btn btn-danger logout-btn">
          Logout
        </button>
      </div>

      <h3 className="dashboard-subtitle">Employee List</h3>
      <div className="dashboard-table">
        <BasicTable users={users} />
      </div>
    </div>
  );
}