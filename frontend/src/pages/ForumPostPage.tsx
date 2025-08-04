import React, { useState } from 'react';
import { Container, Card, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUser, FaClock, FaEye, FaArrowLeft } from 'react-icons/fa';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import ForumReply from '../components/forum/ForumReply';
import CreatePostForm from '../components/forum/CreatePostForm';
import api from '../services/api';
import type { ForumPost } from '../types';

const ForumPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['forum-post', id],
    queryFn: () => api.get<ForumPost & { replies: ForumPost[] }>(`/forum/${id}`)
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      api.put(`/forum/${postId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      setEditingPost(null);
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => api.delete(`/forum/${postId}`),
    onSuccess: (_, deletedId) => {
      if (deletedId === Number(id)) {
        navigate('/forum');
      } else {
        queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      }
    }
  });

  const handleEdit = (post: ForumPost) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleUpdate = () => {
    if (editingPost) {
      updatePostMutation.mutate({ postId: editingPost.id, content: editContent });
    }
  };

  const handleDelete = async (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(postId);
    }
  };

  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container>
        <Alert variant="danger">
          Failed to load post. Please try again.
        </Alert>
      </Container>
    );
  }

  const canEdit = user && (user.id === post.userId || user.role !== 'Vendor');
  const canDelete = user && (user.id === post.userId || user.role === 'Admin');

  return (
    <Container>
      <Button
        variant="link"
        className="mb-3 ps-0"
        onClick={() => navigate('/forum')}
      >
        <FaArrowLeft className="me-2" />
        Back to Forum
      </Button>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h2>{post.title}</h2>
            <div>
              {post.isEdited && (
                <Badge bg="secondary" className="me-2">Edited</Badge>
              )}
              {canEdit && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEdit(post)}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
          
          <div className="d-flex align-items-center text-muted small mb-3">
            <FaUser className="me-1" />
            <span className="me-3">{post.author.username}</span>
            {post.author.role !== 'Vendor' && (
              <Badge bg={post.author.role === 'Admin' ? 'danger' : 'primary'} className="me-3">
                {post.author.role}
              </Badge>
            )}
            <FaClock className="me-1" />
            <span className="me-3">{format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}</span>
            <FaEye className="me-1" />
            <span>{post.viewCount} views</span>
          </div>
          
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>
        </Card.Body>
      </Card>

      {isAuthenticated && (
        <div className="mb-4">
          {showReplyForm ? (
            <CreatePostForm
              parentId={post.id}
              onSuccess={() => {
                setShowReplyForm(false);
                queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
              }}
            />
          ) : (
            <Button variant="primary" onClick={() => setShowReplyForm(true)}>
              Reply to Thread
            </Button>
          )}
        </div>
      )}

      {post.replies && post.replies.length > 0 && (
        <>
          <h4 className="mb-3">Replies ({post.replies.length})</h4>
          {post.replies.map(reply => (
            <ForumReply
              key={reply.id}
              reply={reply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </>
      )}

      <Modal show={!!editingPost} onHide={() => setEditingPost(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingPost(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={updatePostMutation.isPending}
          >
            {updatePostMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ForumPostPage;