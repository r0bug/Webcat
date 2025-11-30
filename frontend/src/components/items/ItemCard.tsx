import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiEye, FiUser, FiMapPin, FiTag } from 'react-icons/fi';
import type { Item } from '../../types';
import { format } from 'date-fns';
import ShareButton from '../common/ShareButton';
import ResponsiveImage from '../common/ResponsiveImage';

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const statusColors = {
    Available: 'success',
    Pending: 'warning',
    Sold: 'secondary',
    Removed: 'danger'
  };

  const defaultImage = '/api/placeholder/300/200';
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
  const imageUrl = firstImage 
    ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${firstImage.imageUrl}`
    : defaultImage;

  return (
    <Card className="h-100 shadow-sm">
      <Link to={`/items/${item.urlSlug}`} className="text-decoration-none">
        <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
          <ResponsiveImage
            src={imageUrl}
            variants={firstImage?.variants}
            alt={item.title}
            className="w-100"
            style={{ height: '200px', objectFit: 'cover' }}
            loading="lazy"
            sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, (max-width: 992px) 33vw, 25vw"
          />
        </div>
      </Link>
      
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="h5 mb-0 flex-grow-1">
            <Link to={`/items/${item.urlSlug}`} className="text-decoration-none text-dark">
              {item.title}
            </Link>
          </Card.Title>
          <div className="d-flex align-items-center gap-2">
            <ShareButton 
              url={`/items/${item.urlSlug}`}
              title={item.title}
              description={item.description}
            />
            <Badge bg={statusColors[item.status]}>
              {item.status}
            </Badge>
          </div>
        </div>

        {item.price && (
          <div className="h4 text-primary mb-2">
            ${item.price}
          </div>
        )}

        <Card.Text className="text-muted small flex-grow-1">
          {item.description && item.description.length > 100
            ? `${item.description.substring(0, 100)}...`
            : item.description}
        </Card.Text>

        <div className="mt-auto">
          {item.tags && item.tags.length > 0 && (
            <div className="mb-2">
              <FiTag className="me-1" />
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={tag.tagId} bg="light" text="dark" className="me-1">
                  {tag.tagName}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge bg="light" text="dark">+{item.tags.length - 3}</Badge>
              )}
            </div>
          )}

          <div className="d-flex justify-content-between text-muted small">
            <div>
              <FiUser className="me-1" />
              {item.vendor?.name}
            </div>
            {item.location && (
              <div>
                <FiMapPin className="me-1" />
                {item.location}
              </div>
            )}
          </div>

          <div className="d-flex justify-content-between text-muted small mt-1">
            <div>
              {format(new Date((item as any).date_added || item.dateAdded), 'MMM d, yyyy')}
            </div>
            <div>
              <FiEye className="me-1" />
              {item.viewCount} views
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ItemCard;