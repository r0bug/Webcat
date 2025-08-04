import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import ForumPostCard from '../components/forum/ForumPostCard';
import CreatePostForm from '../components/forum/CreatePostForm';
import api from '../services/api';
import type { PaginatedResponse, ForumPost } from '../types';

const ForumPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['forum', page, search],
    queryFn: () => api.get<PaginatedResponse<ForumPost & { replyCount: number }>>('/forum', {
      params: {
        page,
        limit: 20,
        search: search || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    })
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Discussion Forum</h1>
        {isAuthenticated && (
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'New Thread'}
          </Button>
        )}
      </div>

      {showCreateForm && (
        <CreatePostForm onSuccess={() => setShowCreateForm(false)} />
      )}

      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={10}>
                <Form.Control
                  type="text"
                  placeholder="Search forum posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100">
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && (
        <Alert variant="danger">
          Failed to load forum posts. Please try again.
        </Alert>
      )}

      {data && (
        <>
          {data.data.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <p className="text-muted mb-0">
                  {search ? 'No posts found matching your search.' : 'No forum posts yet. Be the first to start a discussion!'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <>
              {data.data.map(post => (
                <ForumPostCard key={post.id} post={post} />
              ))}
              
              {data.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Button
                    variant="outline-primary"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="me-2"
                  >
                    Previous
                  </Button>
                  <span className="align-self-center mx-3">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.totalPages}
                    className="ms-2"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default ForumPage;