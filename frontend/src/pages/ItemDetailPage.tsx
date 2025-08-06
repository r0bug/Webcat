import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Carousel, Spinner } from 'react-bootstrap';
import { FiArrowLeft, FiEdit, FiMapPin, FiPhone, FiDollarSign, FiTag, FiFacebook, FiTwitter, FiMail, FiShare2 } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { Item } from '../types';

const ItemDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['item', slug],
    queryFn: () => api.get<{ item: Item }>(`/items/slug/${slug}`)
  });

  const item = response?.item;

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading item details...</p>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container className="py-5">
        <Card>
          <Card.Body className="text-center">
            <h3>Item not found</h3>
            <p>The item you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/items')}>Browse Items</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Pending': return 'warning';
      case 'Sold': return 'info';
      case 'Removed': return 'secondary';
      default: return 'primary';
    }
  };

  const isOwner = user && user.userId === item.vendorId;

  return (
    <Container className="py-4">
      <Button variant="link" onClick={() => navigate(-1)} className="mb-3 p-0">
        <FiArrowLeft className="me-2" />
        Back
      </Button>

      <Row>
        <Col lg={6}>
          {item.images && item.images.length > 0 ? (
            <Carousel className="mb-4">
              {item.images.map((image, index) => (
                <Carousel.Item key={image.imageId}>
                  <img
                    className="d-block w-100"
                    src={image.imageUrl}
                    alt={image.altText || `${item.title} - Image ${index + 1}`}
                    style={{ maxHeight: '500px', objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <Card className="mb-4">
              <Card.Body className="text-center py-5">
                <p className="text-muted">No images available</p>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={6}>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h1 className="h2">{item.title}</h1>
              <Badge bg={getStatusColor(item.status)} className="mt-2">
                {item.status}
              </Badge>
            </div>
            {isOwner && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => navigate(`/items/${slug}/images`)}
              >
                <FiEdit className="me-2" />
                Manage Images
              </Button>
            )}
          </div>

          {item.price && (
            <h3 className="text-primary mb-3">
              <FiDollarSign className="me-1" />
              ${parseFloat(item.price).toFixed(2)}
            </h3>
          )}

          {item.description && (
            <Card className="mb-3">
              <Card.Body>
                <h5>Description</h5>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </p>
              </Card.Body>
            </Card>
          )}

          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-3">Details</h5>
              
              {item.location && (
                <div className="mb-2">
                  <FiMapPin className="me-2 text-muted" />
                  <strong>Location:</strong> {item.location}
                </div>
              )}

              {item.contactInfo && (
                <div className="mb-2">
                  <FiPhone className="me-2 text-muted" />
                  <strong>Contact:</strong> {item.contactInfo}
                </div>
              )}

              <div className="mb-2">
                <strong>Vendor:</strong> {item.vendor?.name || 'Unknown'}
              </div>

              <div className="mb-2">
                <strong>Listed:</strong> {item.date_added ? new Date(item.date_added).toLocaleDateString() : 'Unknown'}
              </div>

              {item.viewCount > 0 && (
                <div className="mb-2">
                  <strong>Views:</strong> {item.viewCount}
                </div>
              )}
            </Card.Body>
          </Card>

          {item.tags && item.tags.length > 0 && (
            <Card className="mb-3">
              <Card.Body>
                <h5 className="mb-3">Tags</h5>
                <div className="d-flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <Badge key={tag.tagId} bg="secondary" className="py-2 px-3">
                      <FiTag className="me-1" />
                      {tag.tagName}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Social Media Share Buttons */}
          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-3">
                <FiShare2 className="me-2" />
                Share this item
              </h5>
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const url = window.location.href;
                    const text = `Check out ${item.title} on WebCat!`;
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                  }}
                >
                  <FiFacebook className="me-1" />
                  Facebook
                </Button>
                
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => {
                    const url = window.location.href;
                    const text = `Check out ${item.title} on WebCat!`;
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <FiTwitter className="me-1" />
                  Twitter
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const url = window.location.href;
                    const subject = `Check out: ${item.title}`;
                    const body = `I found this item on WebCat and thought you might be interested:\n\n${item.title}\n${item.description || ''}\n\nView it here: ${url}`;
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }}
                >
                  <FiMail className="me-1" />
                  Email
                </Button>
                
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </Card.Body>
          </Card>

          {item.status === 'Available' && !isOwner && (
            <Card>
              <Card.Body>
                <h5 className="mb-3">Interested?</h5>
                <p>Contact the vendor for more information about this item.</p>
                {item.contactInfo && (
                  <Button variant="primary">
                    <FiPhone className="me-2" />
                    Contact Vendor
                  </Button>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ItemDetailPage;