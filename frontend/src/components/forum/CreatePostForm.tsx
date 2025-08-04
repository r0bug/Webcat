import React from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface CreatePostFormData {
  title: string;
  content: string;
}

interface CreatePostFormProps {
  parentId?: number;
  onSuccess?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ parentId, onSuccess }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreatePostFormData>();

  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostFormData & { parentId?: number }) => 
      api.post('/forum', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] });
      reset();
      if (onSuccess) onSuccess();
    }
  });

  const onSubmit = (data: CreatePostFormData) => {
    createPostMutation.mutate({ ...data, parentId });
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <h5 className="mb-3">{parentId ? 'Post a Reply' : 'Create New Thread'}</h5>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {!parentId && (
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                {...register('title', {
                  required: 'Title is required',
                  maxLength: {
                    value: 200,
                    message: 'Title must be at most 200 characters'
                  }
                })}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title?.message}
              </Form.Control.Feedback>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              {...register('content', {
                required: 'Content is required'
              })}
              isInvalid={!!errors.content}
            />
            <Form.Control.Feedback type="invalid">
              {errors.content?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {createPostMutation.isError && (
            <div className="alert alert-danger">
              {(createPostMutation.error as any)?.response?.data?.message || 'Failed to create post'}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || createPostMutation.isPending}
          >
            {isSubmitting || createPostMutation.isPending ? 'Posting...' : 'Post'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreatePostForm;