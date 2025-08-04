import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUser, FaComments, FaEye, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import type { ForumPost } from '../../types';
import ShareButton from '../common/ShareButton';

interface ForumPostCardProps {
  post: ForumPost & { replyCount?: number };
}

const ForumPostCard: React.FC<ForumPostCardProps> = ({ post }) => {
  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="mb-1">
            <Link to={`/forum/post/${post.id}`} className="text-decoration-none">
              {post.title}
            </Link>
          </h5>
          {post.isEdited && (
            <Badge bg="secondary" className="ms-2">Edited</Badge>
          )}
        </div>
        
        <div className="text-muted small mb-2">
          <FaUser className="me-1" />
          <span className="me-3">{post.author.username}</span>
          <FaClock className="me-1" />
          <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
        </div>
        
        <p className="mb-2 text-truncate">
          {post.content.substring(0, 200)}
          {post.content.length > 200 && '...'}
        </p>
        
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center text-muted small">
            <span className="me-3">
              <FaComments className="me-1" />
              {post.replyCount || 0} replies
            </span>
            <span>
              <FaEye className="me-1" />
              {post.viewCount} views
            </span>
          </div>
          <ShareButton
            url={`/forum/post/${post.id}`}
            title={post.title || 'Forum Post'}
            description={post.content.substring(0, 100)}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default ForumPostCard;