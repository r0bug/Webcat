import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaClock, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import type { Event } from '../../types';
import ShareButton from '../common/ShareButton';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const eventDate = new Date(event.eventDate);
  const isToday = format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isPast = eventDate < new Date() && !isToday;

  return (
    <Card 
      className={`mb-3 ${onClick ? 'cursor-pointer' : ''} ${isPast ? 'opacity-75' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="mb-0 flex-grow-1">{event.title}</h6>
          <div className="d-flex align-items-center gap-2">
            <ShareButton
              url={`/calendar?event=${event.id}`}
              title={event.title}
              description={`${format(eventDate, 'MMM d, yyyy')}${event.startTime ? ` at ${event.startTime}` : ''}${event.location ? ` - ${event.location}` : ''}`}
            />
            {isToday && <Badge bg="primary">Today</Badge>}
            {isPast && <Badge bg="secondary">Past</Badge>}
          </div>
        </div>
        
        {event.description && (
          <p className="text-muted small mb-2">{event.description}</p>
        )}
        
        <div className="text-muted small">
          <div className="mb-1">
            <FaClock className="me-2" />
            {format(eventDate, 'MMM d, yyyy')}
            {event.startTime && ` at ${event.startTime}`}
            {event.endTime && ` - ${event.endTime}`}
          </div>
          
          {event.location && (
            <div className="mb-1">
              <FaMapMarkerAlt className="me-2" />
              {event.location}
            </div>
          )}
          
          {event.creator && (
            <div>
              <FaUser className="me-2" />
              Created by {event.creator.username}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default EventCard;