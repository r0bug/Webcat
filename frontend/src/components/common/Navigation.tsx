import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiMessageSquare, FiPackage, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          {theme.site_title || 'WebCat'}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/items">
              Browse Items
            </Nav.Link>
            <Nav.Link as={Link} to="/calendar">
              Events
            </Nav.Link>
            <Nav.Link as={Link} to="/forum">
              Forum
            </Nav.Link>
          </Nav>
          
          <Nav>
            {theme.enable_dark_mode && (
              <Nav.Link onClick={toggleDarkMode} className="me-3">
                {isDarkMode ? <FiSun /> : <FiMoon />}
              </Nav.Link>
            )}
            {user ? (
              <>
                <Nav.Link as={Link} to="/messages" className="position-relative">
                  <FiMessageSquare className="me-1" />
                  Messages
                  <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.7rem' }}>
                    {/* TODO: Add unread count */}
                  </Badge>
                </Nav.Link>
                
                <NavDropdown title={
                  <>
                    <FiUser className="me-1" />
                    {user.name}
                  </>
                } id="user-dropdown" align="end">
                  <NavDropdown.Item as={Link} to="/profile">
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/items/my-items">
                    <FiPackage className="me-1" />
                    My Items
                  </NavDropdown.Item>
                  {(user.userType === 'Admin' || user.userType === 'Staff') && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/admin">
                        Admin Panel
                      </NavDropdown.Item>
                      {user.userType === 'Admin' && (
                        <NavDropdown.Item as={Link} to="/admin/theme">
                          Theme Editor
                        </NavDropdown.Item>
                      )}
                    </>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <FiLogOut className="me-1" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="btn btn-primary btn-sm text-white ms-2">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;