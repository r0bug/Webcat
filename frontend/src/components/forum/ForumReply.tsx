import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaUser, FaClock, FaEdit, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import type { ForumPost } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ForumReplyProps {
  reply: ForumPost;
  onEdit?: (reply: ForumPost) => void;
  onDelete?: (replyId: number) => void;
}

const ForumReply: React.FC<ForumReplyProps> = ({ reply, onEdit, onDelete }) => {
  const { user } = useAuth();
  const canEdit = user && (user.id === reply.userId || user.role !== 'Vendor');
  const canDelete = user && (user.id === reply.userId || user.role === 'Admin');

  return (
    <Card className="mb-3 ms-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <FaUser className="me-2 text-muted" />
            <strong>{reply.author.username}</strong>
            {reply.author.role !== 'Vendor' && (
              <Badge bg={reply.author.role === 'Admin' ? 'danger' : 'primary'} className="ms-2">
                {reply.author.role}
              </Badge>
            )}
          </div>
          <div className="d-flex align-items-center">
            {reply.isEdited && (
              <Badge bg="secondary" className="me-2">Edited</Badge>
            )}
            {canEdit && onEdit && (
              <Button
                variant="link"
                size="sm"
                className="text-muted p-1"
                onClick={() => onEdit(reply)}
              >
                <FaEdit />
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                variant="link"
                size="sm"
                className="text-danger p-1"
                onClick={() => onDelete(reply.id)}
              >
                <FaTrash />
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-muted small mb-2">
          <FaClock className="me-1" />
          {format(new Date(reply.createdAt), 'MMM d, yyyy h:mm a')}
        </div>
        
        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
          {reply.content}
        </p>
      </Card.Body>
    </Card>
  );
};

export default ForumReply;