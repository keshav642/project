import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "./styles/App.css";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import EmailScheduler from "./pages/EmailScheduler.jsx";
import LeadBrowser from "./pages/LeadBrowser.jsx";
import UploadLead from "./pages/UploadLead.jsx";
import LeadSource from "./pages/LeadSource.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import AddCampaign from "./pages/AddCampaign.jsx";
import CampaignDetail from "./pages/CampaignDetail.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
  const { isLoading, isAuthenticated } = useAuth0();
  const location = useLocation();

  // Don't show navbar on home page (login page)
  const showNavbar = isAuthenticated && location.pathname !== "/";

  useEffect(() => {
    fetch("http://localhost:5000/api/test")
      .then((res) => res.json())
      .then((data) => console.log("Backend response:", data))
      .catch((err) => console.error("Error fetching API:", err));
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.5rem',
        color: 'var(--accent-primary)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Show Navbar only when user is logged in and not on home page */}
      {showNavbar && <Navbar />}
      
      {/* Main content wrapper with conditional sidebar spacing */}
      <div className={`app-content ${showNavbar ? 'with-sidebar' : ''}`}>
        <header className="app-header">
          <img className="sales-image" src="./vectoredge.png" alt="VectorEdge Logo" />
          <h1 className="app-title">Sales Lead Generator</h1>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />}/>
            <Route path="/leads" element={<Leads />} />
            <Route path="/email-scheduler" element={<EmailScheduler />} />
            <Route path="/lead-browser" element={<LeadBrowser />} />
            <Route path="/upload-lead" element={<UploadLead />} />
            <Route path="/lead-source" element={<LeadSource />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/add-campaign" element={<AddCampaign />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} VectorEdge – AI-powered Sales Lead Generator</p>
        </footer>
      </div>
    </div>
  );
}

export default App;