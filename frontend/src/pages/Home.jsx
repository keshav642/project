import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout({ 
      logoutParams: { returnTo: window.location.origin } 
    });
  };

  return (
    <div className="home-container">
      <h1 className="home-title">VectorEdge: Turning Leads into Opportunities</h1>
      
      {isAuthenticated && (
        <p style={{ 
          marginBottom: '1.5rem', 
          color: 'var(--text-primary)', 
          fontSize: '1.1rem' 
        }}>
          Welcome back, <strong style={{ color: 'var(--accent-primary)' }}>{user?.name}</strong>
        </p>
      )}
      
      <div className="home-links">
        {isAuthenticated ? (
          <>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </>
        ) : (
          <button 
            onClick={() => loginWithRedirect()}
            className="btn btn-primary"
          >
            Login / Signup
          </button>
        )}
      </div>
    </div>
  );
}