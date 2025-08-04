import { Request, Response, NextFunction } from 'express';
import { Event, User } from '../models';
import { Op } from 'sequelize';
import { AuthRequest } from '../types/auth';
import sequelize from '../config/database';

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, eventDate, startTime, endTime, location } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Only staff and admin can create events
    if (userRole === 'Vendor') {
      res.status(403).json({ message: 'Only staff and admin can create events' });
      return;
    }

    const event = await Event.create({
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      createdBy: userId,
      isActive: true
    });

    const createdEvent = await Event.findByPk(event.id, {
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['userId', 'name', 'email', 'userType']
      }]
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      month,
      year,
      upcoming = false,
      past = false
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };

    // Filter by month and year
    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      where.eventDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (year) {
      const startDate = new Date(parseInt(year as string), 0, 1);
      const endDate = new Date(parseInt(year as string), 11, 31);
      where.eventDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Filter upcoming or past events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (upcoming === 'true') {
      where.eventDate = { [Op.gte]: today };
    } else if (past === 'true') {
      where.eventDate = { [Op.lt]: today };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['userId', 'name', 'email', 'userType']
      }],
      order: [['eventDate', 'ASC'], ['startTime', 'ASC']],
      limit: limitNum,
      offset
    });

    res.json({
      data: rows,
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['userId', 'name', 'email', 'userType']
      }]
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user!.role;

    // Only staff and admin can update events
    if (userRole === 'Vendor') {
      res.status(403).json({ message: 'Only staff and admin can update events' });
      return;
    }

    const event = await Event.findByPk(id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const { title, description, eventDate, startTime, endTime, location, isActive } = req.body;

    await event.update({
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      isActive: isActive !== undefined ? isActive : event.isActive
    });

    const updatedEvent = await Event.findByPk(id, {
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['userId', 'name', 'email', 'userType']
      }]
    });

    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user!.role;

    // Only admin can delete events
    if (userRole !== 'Admin') {
      res.status(403).json({ message: 'Only admin can delete events' });
      return;
    }

    const event = await Event.findByPk(id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const daysNum = parseInt(days as string);
    const limitNum = parseInt(limit as string);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysNum);

    const events = await Event.findAll({
      where: {
        isActive: true,
        eventDate: {
          [Op.between]: [today, futureDate]
        }
      },
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['userId', 'name', 'email', 'userType']
      }],
      order: [['eventDate', 'ASC'], ['startTime', 'ASC']],
      limit: limitNum
    });

    res.json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventsByMonth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    const events = await Event.findAll({
      where: {
        isActive: true,
        eventDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['userId', 'name', 'email', 'userType']
      }],
      order: [['eventDate', 'ASC'], ['startTime', 'ASC']]
    });

    // Group events by day for calendar display
    const eventsByDay: { [key: number]: typeof events } = {};
    events.forEach(event => {
      const day = new Date(event.eventDate).getDate();
      if (!eventsByDay[day]) {
        eventsByDay[day] = [];
      }
      eventsByDay[day].push(event);
    });

    res.json({
      year: yearNum,
      month: monthNum,
      events,
      eventsByDay
    });
  } catch (error) {
    next(error);
  }
};