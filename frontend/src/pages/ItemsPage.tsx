import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import ItemGrid from '../components/items/ItemGrid';
import api from '../services/api';
import type { PaginatedResponse, Item } from '../types';

const ItemsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'dateAdded',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', page, filters],
    queryFn: () => api.get<PaginatedResponse<Item>>('/items', {
      params: {
        page,
        limit: 20,
        ...filters
      }
    })
  });

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'dateAdded',
      sortOrder: 'desc'
    });
    setPage(1);
  };

  return (
    <Container fluid>
      <h1 className="mb-4">Browse Items</h1>
      
      <Row>
        <Col lg={3}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Filters</h5>
              <Form onSubmit={handleFilterSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search items..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All</option>
                    <option value="Available">Available</option>
                    <option value="Pending">Pending</option>
                    <option value="Sold">Sold</option>
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Min Price</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Price</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="999999"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  >
                    <option value="dateAdded">Date Added</option>
                    <option value="price">Price</option>
                    <option value="title">Title</option>
                    <option value="viewCount">Views</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button type="submit" variant="primary">
                    Apply Filters
                  </Button>
                  <Button variant="outline-secondary" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          {data && (
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="text-muted">
                Showing {data.data.length} of {data.total} items
              </div>
              {data.totalPages > 1 && (
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="me-2"
                  >
                    Previous
                  </Button>
                  <span className="mx-2">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.totalPages}
                    className="ms-2"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          <ItemGrid
            items={data?.data || []}
            loading={isLoading}
            error={error?.message}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ItemsPage;