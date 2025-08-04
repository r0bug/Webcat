import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { FiEdit, FiTrash2, FiUserPlus, FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  userId: number;
  name: string;
  email: string;
  userType: 'Admin' | 'Staff' | 'Vendor';
  isActive: boolean;
  createdAt: string;
  phoneNumber?: string;
  contactInfo?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'Vendor' as 'Admin' | 'Staff' | 'Vendor',
    phoneNumber: '',
    contactInfo: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const users = await api.get('/users');
      setUsers(users);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      userType: user.userType,
      phoneNumber: user.phoneNumber || '',
      contactInfo: user.contactInfo || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      userType: 'Vendor',
      phoneNumber: '',
      contactInfo: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.userId}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save user');
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !isActive });
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  if (loading) return <Container className="py-4">Loading...</Container>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          <FiUserPlus className="me-2" />
          Add User
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Table responsive striped hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users && users.map(user => (
            <tr key={user.userId}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <Badge bg={
                  user.userType === 'Admin' ? 'danger' :
                  user.userType === 'Staff' ? 'warning' : 'info'
                }>
                  {user.userType}
                </Badge>
              </td>
              <td>
                <Button
                  size="sm"
                  variant={user.isActive ? 'success' : 'secondary'}
                  onClick={() => handleToggleActive(user.userId, user.isActive)}
                  disabled={user.userId === currentUser?.userId}
                >
                  {user.isActive ? <FiCheck /> : <FiX />}
                  {user.isActive ? ' Active' : ' Inactive'}
                </Button>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => handleEdit(user)}
                >
                  <FiEdit />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDelete(user.userId)}
                  disabled={user.userId === currentUser?.userId}
                >
                  <FiTrash2 />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit User' : 'Add User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </Form.Group>

            {!editingUser && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>User Type</Form.Label>
              <Form.Select
                value={formData.userType}
                onChange={(e) => setFormData({...formData, userType: e.target.value as any})}
              >
                <option value="Vendor">Vendor</option>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact Info</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.contactInfo}
                onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Update' : 'Create'} User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;