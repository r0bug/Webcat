import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, Modal, Spinner, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import Calendar from '../components/calendar/Calendar';
import EventCard from '../components/calendar/EventCard';
import CreateEventForm from '../components/calendar/CreateEventForm';
import api from '../services/api';
import type { Event } from '../types';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: monthData, isLoading, error } = useQuery({
    queryKey: ['events', 'calendar', year, month],
    queryFn: () => api.get<{
      year: number;
      month: number;
      events: Event[];
      eventsByDay: { [key: number]: Event[] };
    }>(`/events/calendar/${year}/${month}`)
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => api.get<Event[]>('/events/upcoming', {
      params: { days: 30, limit: 10 }
    })
  });

  const canCreateEvents = user && (user.role === 'Admin' || user.role === 'Staff');

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (canCreateEvents) {
      setShowCreateModal(true);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Events Calendar</h1>
        <div className="d-flex gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('calendar')}
          >
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          {canCreateEvents && (
            <Button
              variant="success"
              onClick={() => {
                setSelectedDate(null);
                setShowCreateModal(true);
              }}
            >
              <FaPlus className="me-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && (
        <Alert variant="danger">
          Failed to load events. Please try again.
        </Alert>
      )}

      {monthData && viewMode === 'calendar' && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="outline-secondary" onClick={handlePreviousMonth}>
                  <FaChevronLeft />
                </Button>
                <div className="text-center">
                  <h4 className="mb-0">{format(currentDate, 'MMMM yyyy')}</h4>
                  <Button variant="link" size="sm" onClick={handleToday}>
                    Today
                  </Button>
                </div>
                <Button variant="outline-secondary" onClick={handleNextMonth}>
                  <FaChevronRight />
                </Button>
              </div>
              <Calendar
                currentDate={currentDate}
                events={monthData.events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </Card.Body>
          </Card>

          {upcomingEvents && upcomingEvents.length > 0 && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Upcoming Events</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {upcomingEvents.slice(0, 3).map(event => (
                    <Col md={4} key={event.id}>
                      <EventCard
                        event={event}
                        onClick={() => handleEventClick(event)}
                      />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {monthData && viewMode === 'list' && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Events in {format(currentDate, 'MMMM yyyy')}</h5>
          </Card.Header>
          <Card.Body>
            {monthData.events.length === 0 ? (
              <p className="text-muted text-center">No events scheduled for this month.</p>
            ) : (
              <Row>
                {monthData.events.map(event => (
                  <Col md={6} lg={4} key={event.id}>
                    <EventCard
                      event={event}
                      onClick={() => handleEventClick(event)}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Create Event Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreateEventForm
            initialDate={selectedDate || undefined}
            onSuccess={() => setShowCreateModal(false)}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Event Details Modal */}
      <Modal show={!!selectedEvent} onHide={() => setSelectedEvent(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              {selectedEvent.description && (
                <p className="mb-3">{selectedEvent.description}</p>
              )}
              <div className="text-muted">
                <p>
                  <strong>Date:</strong> {format(new Date(selectedEvent.eventDate), 'MMMM d, yyyy')}
                </p>
                {selectedEvent.startTime && (
                  <p>
                    <strong>Time:</strong> {selectedEvent.startTime}
                    {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                  </p>
                )}
                {selectedEvent.location && (
                  <p>
                    <strong>Location:</strong> {selectedEvent.location}
                  </p>
                )}
                {selectedEvent.creator && (
                  <p>
                    <strong>Created by:</strong> {selectedEvent.creator.username}
                  </p>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CalendarPage;