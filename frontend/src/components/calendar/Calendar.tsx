import React from 'react';
import { Table, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import type { Event } from '../../types';

interface CalendarProps {
  currentDate: Date;
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, events, onDateClick, onEventClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Start from Sunday
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);
  
  // Group events by date
  const eventsByDate: { [key: string]: Event[] } = {};
  events.forEach(event => {
    const dateKey = format(new Date(event.eventDate), 'yyyy-MM-dd');
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  const weeks: (Date | null)[][] = [];
  const allDays = [...emptyDays, ...days];
  
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  
  // Fill last week if needed
  const lastWeek = weeks[weeks.length - 1];
  if (lastWeek && lastWeek.length < 7) {
    const remaining = 7 - lastWeek.length;
    lastWeek.push(...Array(remaining).fill(null));
  }

  const renderEvent = (event: Event) => (
    <div
      key={event.id}
      className="small text-truncate"
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onEventClick) onEventClick(event);
      }}
    >
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip>
            {event.title}
            {event.startTime && ` at ${event.startTime}`}
          </Tooltip>
        }
      >
        <Badge bg="primary" className="w-100 mb-1">
          {event.startTime || 'All day'}
        </Badge>
      </OverlayTrigger>
    </div>
  );

  return (
    <Table bordered className="calendar-table">
      <thead>
        <tr>
          <th>Sun</th>
          <th>Mon</th>
          <th>Tue</th>
          <th>Wed</th>
          <th>Thu</th>
          <th>Fri</th>
          <th>Sat</th>
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, weekIndex) => (
          <tr key={weekIndex}>
            {week.map((day, dayIndex) => {
              const dateKey = day ? format(day, 'yyyy-MM-dd') : '';
              const dayEvents = dateKey ? eventsByDate[dateKey] || [] : [];
              const isCurrentMonth = day && isSameMonth(day, currentDate);
              const isTodayDate = day && isToday(day);
              
              return (
                <td
                  key={dayIndex}
                  className={`calendar-cell ${!isCurrentMonth ? 'text-muted' : ''} ${isTodayDate ? 'bg-light' : ''}`}
                  style={{ 
                    height: '100px', 
                    verticalAlign: 'top',
                    cursor: day && onDateClick ? 'pointer' : 'default'
                  }}
                  onClick={() => day && onDateClick && onDateClick(day)}
                >
                  {day && (
                    <>
                      <div className="fw-bold mb-1">
                        {format(day, 'd')}
                      </div>
                      <div style={{ maxHeight: '70px', overflowY: 'auto' }}>
                        {dayEvents.slice(0, 3).map(renderEvent)}
                        {dayEvents.length > 3 && (
                          <Badge bg="secondary" className="w-100">
                            +{dayEvents.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default Calendar;