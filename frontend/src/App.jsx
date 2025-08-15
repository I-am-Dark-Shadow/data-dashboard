import React, { useState, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import DatasetList from './components/DatasetList';
import { BarChart3, Upload, Database, LogIn, LogOut, User } from 'lucide-react';
import LoginModal from './components/LoginModal'; // We will create this component

// 1. Create Authentication Context
// This will be used to share login state across all components
const AuthContext = createContext(null);

// Custom hook to easily access the auth context
export const useAuth = () => useContext(AuthContext);

// 2. AuthProvider Component
// This component will wrap your entire application and manage the login state.
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // Function to update state upon successful login
  const login = (userData) => {
    setUser(userData);
    setLoginModalOpen(false); // Close the modal on success
  };

  // Function to clear user state on logout
  const logout = () => {
    setUser(null);
  };

  // Function to open the login modal from anywhere in the app
  const openLoginModal = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  // The value provided to all children components
  const value = { user, isAuthenticated: !!user, login, logout, openLoginModal };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </AuthContext.Provider>
  );
};

// 3. Protected Route Component
// This component checks if a user is logged in before rendering a page.
// If not, it redirects them and triggers the login modal.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      openLoginModal();
    }
  }, [isAuthenticated, openLoginModal]);

  if (!isAuthenticated) {
    // Redirect to home page while the modal is open
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// 4. Navigation Component
// The top navigation bar, which now shows login/logout status.
function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, logout, openLoginModal } = useAuth();
  
  const linkStyles = (path) => `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    location.pathname === path 
      ? 'bg-primary-100 text-primary-700' 
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Data Dashboard
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/" className={linkStyles('/')}>
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Link>
            
            <Link to="/datasets" className={linkStyles('/datasets')}>
              <Database className="h-4 w-4" />
              <span>Datasets</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4 text-primary-600" />
                  <span>{user.name}</span>
                </span>
                <button onClick={logout} className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button onClick={openLoginModal} className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// 5. Main App Component
// This brings everything together.
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<FileUpload />} />
              <Route 
                path="/datasets" 
                element={
                  <ProtectedRoute>
                    <DatasetList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/:datasetId" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500 text-sm">
                © 2024 Data Dashboard. Built with React & Vite.
              </p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;