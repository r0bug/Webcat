import React from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface CreateEventFormData {
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}

interface CreateEventFormProps {
  initialDate?: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ initialDate, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateEventFormData>({
    defaultValues: {
      eventDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }
  });

  const createEventMutation = useMutation({
    mutationFn: (data: CreateEventFormData) => api.post('/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (onSuccess) onSuccess();
    }
  });

  const onSubmit = (data: CreateEventFormData) => {
    createEventMutation.mutate(data);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
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

      <Form.Group className="mb-3">
        <Form.Label>Description (optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          {...register('description')}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Event Date</Form.Label>
        <Form.Control
          type="date"
          {...register('eventDate', {
            required: 'Event date is required'
          })}
          isInvalid={!!errors.eventDate}
        />
        <Form.Control.Feedback type="invalid">
          {errors.eventDate?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Start Time (optional)</Form.Label>
            <Form.Control
              type="time"
              {...register('startTime', {
                pattern: {
                  value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                  message: 'Invalid time format'
                }
              })}
              isInvalid={!!errors.startTime}
            />
            <Form.Control.Feedback type="invalid">
              {errors.startTime?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>End Time (optional)</Form.Label>
            <Form.Control
              type="time"
              {...register('endTime', {
                pattern: {
                  value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                  message: 'Invalid time format'
                }
              })}
              isInvalid={!!errors.endTime}
            />
            <Form.Control.Feedback type="invalid">
              {errors.endTime?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Location (optional)</Form.Label>
        <Form.Control
          type="text"
          {...register('location', {
            maxLength: {
              value: 200,
              message: 'Location must be at most 200 characters'
            }
          })}
          isInvalid={!!errors.location}
        />
        <Form.Control.Feedback type="invalid">
          {errors.location?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {createEventMutation.isError && (
        <div className="alert alert-danger">
          {(createEventMutation.error as any)?.response?.data?.message || 'Failed to create event'}
        </div>
      )}

      <div className="d-flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || createEventMutation.isPending}
        >
          {isSubmitting || createEventMutation.isPending ? 'Creating...' : 'Create Event'}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </Form>
  );
};

export default CreateEventForm;