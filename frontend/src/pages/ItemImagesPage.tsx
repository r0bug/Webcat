import React, { useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, ProgressBar, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUpload, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import type { Item, ItemImage } from '../types';

const ItemImagesPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', slug],
    queryFn: () => api.get<Item>(`/items/slug/${slug}`)
  });

  // Upload images mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setIsUploading(true);
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      
      return api.upload(`/items/${item?.itemId}/images`, formData, (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', slug] });
      setSelectedFiles([]);
      setUploadProgress(0);
      setSuccess('Images uploaded successfully!');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to upload images');
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => api.delete(`/items/${item?.itemId}/images/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', slug] });
      setSuccess('Image deleted successfully!');
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to delete image');
    }
  });


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImageCount = item?.images?.length || 0;
    const maxAllowed = 6 - currentImageCount;
    
    if (files.length > maxAllowed) {
      setError(`You can only upload ${maxAllowed} more image${maxAllowed === 1 ? '' : 's'}. Maximum 6 images per item.`);
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setError(`${file.name} is not a valid image type. Only JPEG, PNG, and WebP are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(validFiles);
    setError('');
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    uploadMutation.mutate(selectedFiles);
  };

  const handleDelete = (image: ItemImage) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      deleteMutation.mutate(image.imageId);
    }
  };


  if (isLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Item not found</Alert>
      </Container>
    );
  }

  const currentImageCount = item.images?.length || 0;
  const canUploadMore = currentImageCount < 6;

  return (
    <Container className="py-5">
      <Button
        variant="link"
        className="mb-3 p-0"
        onClick={() => navigate('/my-items')}
      >
        <FiArrowLeft className="me-2" />
        Back to My Items
      </Button>

      <h2 className="mb-4">Manage Images for "{item.title}"</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Upload Section */}
      {canUploadMore && (
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Upload Images</h5>
            <p className="text-muted mb-3">
              You can upload {6 - currentImageCount} more image{6 - currentImageCount === 1 ? '' : 's'}.
              Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP.
            </p>

            <Form>
              <Form.Group className="mb-3">
                <div className="d-flex gap-2 flex-wrap">
                  <Form.Label className="btn btn-primary mb-0">
                    <FiUpload className="me-2" />
                    Choose Files
                    <Form.Control
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </Form.Label>
                  <Form.Label className="btn btn-success mb-0">
                    <FiUpload className="me-2" />
                    Take Photo
                    <Form.Control
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </Form.Label>
                </div>
                <small className="text-muted d-block mt-2">
                  On mobile devices, "Take Photo" will open your camera
                </small>
              </Form.Group>
            </Form>

            {selectedFiles.length > 0 && (
              <div className="mb-3">
                <h6>Selected Files:</h6>
                <ul className="list-unstyled">
                  {selectedFiles.map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                  ))}
                </ul>
                
                <Button
                  variant="success"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Images'}
                </Button>
              </div>
            )}

            {isUploading && (
              <ProgressBar
                now={uploadProgress}
                label={`${uploadProgress}%`}
                animated
                striped
              />
            )}
          </Card.Body>
        </Card>
      )}

      {/* Current Images */}
      <Card>
        <Card.Body>
          <h5 className="mb-3">Current Images ({currentImageCount}/6)</h5>
          
          {currentImageCount === 0 ? (
            <Alert variant="info">
              No images uploaded yet. Add some images to showcase your item!
            </Alert>
          ) : (
            <Row className="g-3">
              {item.images?.map((image, index) => (
                <Col key={image.imageId} xs={6} md={4} lg={3}>
                  <Card className="h-100">
                    <div
                      style={{
                        height: '200px',
                        backgroundImage: `url(/webcat/api${image.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                    <Card.Body className="p-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                        </small>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(image)}
                        >
                          <FiTrash2 />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ItemImagesPage;