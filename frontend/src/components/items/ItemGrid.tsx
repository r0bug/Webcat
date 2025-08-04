import React from 'react';
import { Row, Col, Spinner, Alert } from 'react-bootstrap';
import ItemCard from './ItemCard';
import type { Item } from '../../types';

interface ItemGridProps {
  items: Item[];
  loading?: boolean;
  error?: string;
}

const ItemGrid: React.FC<ItemGridProps> = ({ items, loading, error }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <Alert variant="info">
        No items found. Try adjusting your filters or check back later.
      </Alert>
    );
  }

  return (
    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
      {items.map((item) => (
        <Col key={item.itemId}>
          <ItemCard item={item} />
        </Col>
      ))}
    </Row>
  );
};

export default ItemGrid;