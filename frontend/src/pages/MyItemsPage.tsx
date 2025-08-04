import React, { useState } from 'react';
import { Container, Row, Col, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash, FiImage } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Item, ItemStatus, Tag } from '../types';

interface ItemFormData {
  title: string;
  description: string;
  price: string;
  location: string;
  contactInfo: string;
  status: ItemStatus;
  tags: number[];
}

const MyItemsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    title: '',
    description: '',
    price: '',
    location: '',
    contactInfo: '',
    status: 'Available',
    tags: []
  });
  const [error, setError] = useState('');

  // Fetch user's items
  const { data: items, isLoading } = useQuery({
    queryKey: ['myItems'],
    queryFn: () => api.get<Item[]>('/items/my-items')
  });

  // Fetch available tags
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<Tag[]>('/tags')
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: (data: ItemFormData) => api.post('/items', {
      ...data,
      price: data.price ? parseFloat(data.price) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create item');
    }
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ItemFormData }) => 
      api.put(`/items/${id}`, {
        ...data,
        price: data.price ? parseFloat(data.price) : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update item');
    }
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
    }
  });

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        price: item.price?.toString() || '',
        location: item.location || '',
        contactInfo: item.contactInfo || '',
        status: item.status,
        tags: item.tags?.map(t => t.tagId) || []
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        price: '',
        location: '',
        contactInfo: user?.contactInfo || '',
        status: 'Available',
        tags: []
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.itemId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (item: Item) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      deleteMutation.mutate(item.itemId);
    }
  };

  const handleManageImages = (item: Item) => {
    navigate(`/items/${item.urlSlug}/images`);
  };

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Pending': return 'warning';
      case 'Sold': return 'info';
      case 'Removed': return 'secondary';
      default: return 'primary';
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Items</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <FiPlus className="me-2" />
          Add New Item
        </Button>
      </div>

      {items && items.length > 0 ? (
        <Table responsive striped hover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Price</th>
              <th>Status</th>
              <th>Views</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.itemId}>
                <td>{item.title}</td>
                <td>{item.price ? `$${item.price.toFixed(2)}` : 'N/A'}</td>
                <td>
                  <Badge bg={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </td>
                <td>{item.viewCount}</td>
                <td>{new Date(item.dateAdded).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleOpenModal(item)}
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleManageImages(item)}
                  >
                    <FiImage />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(item)}
                  >
                    <FiTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="info">
          You haven't added any items yet. Click "Add New Item" to get started!
        </Alert>
      )}

      {/* Add/Edit Item Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Edit Item' : 'Add New Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="Enter item title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your item..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as ItemStatus})}
                  >
                    <option value="Available">Available</option>
                    <option value="Pending">Pending</option>
                    <option value="Sold">Sold</option>
                    <option value="Removed">Removed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Back room, Shelf A3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact Info</Form.Label>
              <Form.Control
                type="text"
                value={formData.contactInfo}
                onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                placeholder="Phone number or email"
              />
            </Form.Group>

            {tags && tags.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>Tags</Form.Label>
                <div>
                  {tags.map(tag => (
                    <Form.Check
                      key={tag.tagId}
                      inline
                      type="checkbox"
                      id={`tag-${tag.tagId}`}
                      label={tag.tagName}
                      checked={formData.tags.includes(tag.tagId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, tags: [...formData.tags, tag.tagId]});
                        } else {
                          setFormData({...formData, tags: formData.tags.filter(id => id !== tag.tagId)});
                        }
                      }}
                    />
                  ))}
                </div>
              </Form.Group>
            )}

            {editingItem && (
              <Alert variant="info">
                After saving, you can manage images by clicking the image button in the actions column.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MyItemsPage;