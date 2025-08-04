import React, { useState } from 'react';
import { Container, Row, Col, Nav, Tab, Card } from 'react-bootstrap';
import { FiBook, FiUsers, FiPackage, FiSettings, FiCode, FiKey } from 'react-icons/fi';

const Documentation: React.FC = () => {
  const [activeKey, setActiveKey] = useState('overview');

  const sections = [
    { key: 'overview', title: 'Overview', icon: <FiBook /> },
    { key: 'user-guide', title: 'User Guide', icon: <FiUsers /> },
    { key: 'admin-guide', title: 'Admin Guide', icon: <FiSettings /> },
    { key: 'features', title: 'Features', icon: <FiPackage /> },
    { key: 'api', title: 'API Reference', icon: <FiCode /> },
    { key: 'auth', title: 'Authentication', icon: <FiKey /> }
  ];

  return (
    <Container className="py-4">
      <h1 className="mb-4">WebCat Documentation</h1>
      
      <Tab.Container activeKey={activeKey} onSelect={(k) => setActiveKey(k || 'overview')}>
        <Row>
          <Col sm={3}>
            <Card className="mb-4">
              <Card.Body>
                <Nav variant="pills" className="flex-column">
                  {sections.map(section => (
                    <Nav.Item key={section.key}>
                      <Nav.Link eventKey={section.key} className="d-flex align-items-center">
                        <span className="me-2">{section.icon}</span>
                        {section.title}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </Card.Body>
            </Card>
          </Col>
          
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="overview">
                <Card>
                  <Card.Body>
                    <h2>Overview</h2>
                    <p className="lead">Welcome to WebCat - Your Consignment Mall Catalog System</p>
                    
                    <h3>What is WebCat?</h3>
                    <p>
                      WebCat is a web-based catalog system designed for consignment mall members to share and manage 
                      larger items stored in a back room. The system provides authentication, messaging, calendar 
                      functionality, and a mobile-responsive design.
                    </p>
                    
                    <h3>Key Features</h3>
                    <ul>
                      <li>User authentication with role-based access (Admin, Staff, Vendor)</li>
                      <li>Item catalog with images, tags, and search functionality</li>
                      <li>Messaging system between users</li>
                      <li>Forum/discussion board</li>
                      <li>Calendar for events</li>
                      <li>Theme customization (Admin only)</li>
                      <li>Mobile-responsive design</li>
                    </ul>
                    
                    <h3>Getting Started</h3>
                    <p>
                      To get started, login with your credentials. New vendors can register for an account, 
                      which will need to be approved by an administrator.
                    </p>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              <Tab.Pane eventKey="user-guide">
                <Card>
                  <Card.Body>
                    <h2>User Guide</h2>
                    
                    <h3>Registration & Login</h3>
                    <p>
                      New users can register by clicking the "Register" button on the login page. 
                      You'll need to provide:
                    </p>
                    <ul>
                      <li>Full name</li>
                      <li>Email address</li>
                      <li>Password (minimum 6 characters)</li>
                      <li>Phone number (optional)</li>
                      <li>Contact information (optional)</li>
                    </ul>
                    
                    <h3>Managing Items</h3>
                    <p>As a vendor, you can:</p>
                    <ul>
                      <li>Add new items with up to 6 images</li>
                      <li>Edit your own items</li>
                      <li>Mark items as Available, Pending, Sold, or Removed</li>
                      <li>Add tags for better categorization</li>
                      <li>View item statistics and messages</li>
                    </ul>
                    
                    <h3>Messaging</h3>
                    <p>
                      You can send and receive messages with other users. Messages can be related to specific 
                      items or general inquiries. Click on "Messages" in the navigation to view your inbox.
                    </p>
                    
                    <h3>Forum</h3>
                    <p>
                      The forum allows all users to participate in discussions. You can create new posts, 
                      reply to existing posts, and engage with the community.
                    </p>
                    
                    <h3>Calendar</h3>
                    <p>
                      View upcoming events and important dates. Events are created by staff and administrators 
                      to keep everyone informed about mall activities.
                    </p>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              <Tab.Pane eventKey="admin-guide">
                <Card>
                  <Card.Body>
                    <h2>Administrator Guide</h2>
                    
                    <h3>Admin Dashboard</h3>
                    <p>
                      As an administrator, you have access to the Admin Dashboard from your user menu. 
                      This provides quick access to all administrative functions.
                    </p>
                    
                    <h3>User Management</h3>
                    <p>Administrators can:</p>
                    <ul>
                      <li>View all registered users</li>
                      <li>Create new user accounts</li>
                      <li>Edit user information and roles</li>
                      <li>Activate or deactivate user accounts</li>
                      <li>Delete users (soft delete)</li>
                    </ul>
                    
                    <h3>Theme Editor</h3>
                    <p>
                      The Theme Editor allows you to customize the appearance of WebCat:
                    </p>
                    <ul>
                      <li><strong>Brand Settings:</strong> Site title, tagline, welcome message</li>
                      <li><strong>Colors:</strong> Primary, secondary, accent, background, text colors</li>
                      <li><strong>Typography:</strong> Font families and sizes</li>
                      <li><strong>Layout:</strong> Border radius, container width</li>
                      <li><strong>Features:</strong> Enable/disable dark mode, vendor logos</li>
                    </ul>
                    <p>Changes are applied in real-time and can be saved permanently.</p>
                    
                    <h3>Content Moderation</h3>
                    <p>
                      Administrators and staff can moderate forum posts, manage items from all vendors, 
                      and oversee the messaging system to ensure appropriate use.
                    </p>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              <Tab.Pane eventKey="features">
                <Card>
                  <Card.Body>
                    <h2>Feature Details</h2>
                    
                    <h3>Item Catalog</h3>
                    <ul>
                      <li>Grid and list view options</li>
                      <li>Advanced search with filters (status, price range, tags)</li>
                      <li>Image gallery with zoom functionality</li>
                      <li>Social sharing capabilities</li>
                      <li>View count tracking</li>
                    </ul>
                    
                    <h3>Image Management</h3>
                    <ul>
                      <li>Support for JPEG, PNG, and WebP formats</li>
                      <li>Maximum 6 images per item</li>
                      <li>Automatic image optimization</li>
                      <li>Drag-and-drop upload interface</li>
                      <li>Image reordering capability</li>
                    </ul>
                    
                    <h3>Search & Filtering</h3>
                    <ul>
                      <li>Full-text search across titles and descriptions</li>
                      <li>Filter by status, price range, vendor</li>
                      <li>Tag-based filtering</li>
                      <li>Sort by date, price, or popularity</li>
                    </ul>
                    
                    <h3>Security Features</h3>
                    <ul>
                      <li>JWT-based authentication</li>
                      <li>Role-based access control (RBAC)</li>
                      <li>Secure password hashing</li>
                      <li>Rate limiting on API endpoints</li>
                      <li>Input validation and sanitization</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              <Tab.Pane eventKey="api">
                <Card>
                  <Card.Body>
                    <h2>API Reference</h2>
                    
                    <h3>Base URL</h3>
                    <code>http://localhost:3001/api</code>
                    
                    <h3>Authentication</h3>
                    <p>
                      Most endpoints require authentication. Include the JWT token in the Authorization header:
                    </p>
                    <pre className="bg-light p-3">
                      Authorization: Bearer YOUR_JWT_TOKEN
                    </pre>
                    
                    <h3>Main Endpoints</h3>
                    
                    <h4>Authentication</h4>
                    <ul>
                      <li><code>POST /auth/login</code> - User login</li>
                      <li><code>POST /auth/register</code> - User registration</li>
                      <li><code>POST /auth/refresh</code> - Refresh access token</li>
                      <li><code>POST /auth/logout</code> - Logout user</li>
                    </ul>
                    
                    <h4>Items</h4>
                    <ul>
                      <li><code>GET /items</code> - List items (with pagination)</li>
                      <li><code>GET /items/:id</code> - Get single item</li>
                      <li><code>POST /items</code> - Create new item</li>
                      <li><code>PUT /items/:id</code> - Update item</li>
                      <li><code>DELETE /items/:id</code> - Delete item</li>
                    </ul>
                    
                    <h4>Users (Admin only)</h4>
                    <ul>
                      <li><code>GET /users</code> - List all users</li>
                      <li><code>GET /users/:id</code> - Get user details</li>
                      <li><code>POST /users</code> - Create new user</li>
                      <li><code>PUT /users/:id</code> - Update user</li>
                      <li><code>PUT /users/:id/status</code> - Toggle user status</li>
                      <li><code>DELETE /users/:id</code> - Delete user</li>
                    </ul>
                    
                    <h4>Theme (Admin only)</h4>
                    <ul>
                      <li><code>GET /theme/public</code> - Get public theme settings</li>
                      <li><code>GET /theme</code> - Get all theme settings (admin)</li>
                      <li><code>PUT /theme</code> - Update theme settings</li>
                      <li><code>POST /theme/reset</code> - Reset to defaults</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              
              <Tab.Pane eventKey="auth">
                <Card>
                  <Card.Body>
                    <h2>Authentication & Security</h2>
                    
                    <h3>User Roles</h3>
                    <ul>
                      <li><strong>Admin:</strong> Full system access, user management, theme customization</li>
                      <li><strong>Staff:</strong> Manage all items and events, moderate forum</li>
                      <li><strong>Vendor:</strong> Manage own items, participate in forum/messaging</li>
                    </ul>
                    
                    <h3>Test Credentials</h3>
                    <p>For development/testing:</p>
                    <ul>
                      <li><strong>Admin:</strong> admin@webcat.com / password123</li>
                      <li><strong>Staff:</strong> staff@webcat.com / password123</li>
                      <li><strong>Vendor:</strong> john@vendor.com / password123</li>
                    </ul>
                    
                    <h3>Security Best Practices</h3>
                    <ul>
                      <li>Use strong, unique passwords</li>
                      <li>Don't share your login credentials</li>
                      <li>Log out when finished, especially on shared computers</li>
                      <li>Report any suspicious activity to administrators</li>
                    </ul>
                    
                    <h3>Password Requirements</h3>
                    <ul>
                      <li>Minimum 6 characters</li>
                      <li>Recommended: Mix of letters, numbers, and symbols</li>
                      <li>Passwords are securely hashed using bcrypt</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default Documentation;