import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "../styles/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth0();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/lead-browser", icon: "🔍", label: "Lead Browser" },
    { path: "/leads", icon: "👥", label: "Lead Management" },
    { path: "/campaigns", icon: "🎯", label: "Campaigns" },
    { path: "/email-scheduler", icon: "📧", label: "Email Scheduler" },
    { path: "/lead-source", icon: "📊", label: "Lead Sources" },
    { path: "/upload-lead", icon: "📤", label: "Upload Leads" },
  ];

  const handleLogout = () => {
    logout({ 
      logoutParams: { returnTo: window.location.origin } 
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="logo-section">
            <img src="/vectoredge.png" alt="VectorEdge" className="logo-img" />
            {sidebarOpen && <span className="logo-text">VectorEdge</span>}
          </div>
        </div>

        {/* User Section */}
        {sidebarOpen && (
          <div className="user-section">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="toggle-btn"
            title={sidebarOpen ? "Collapse" : "Expand"}
          >
            <span className="nav-icon">{sidebarOpen ? "⬅️" : "➡️"}</span>
            {sidebarOpen && <span className="nav-label">Collapse</span>}
          </button>
          
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}