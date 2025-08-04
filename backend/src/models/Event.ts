import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EventAttributes {
  eventId: number;
  title: string;
  description?: string;
  eventDate: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  createdByUserId: number;
  isActive: boolean;
  createdAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, 'eventId' | 'description' | 'startTime' | 'endTime' | 'location' | 'isActive' | 'createdAt'> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public eventId!: number;
  public title!: string;
  public description?: string;
  public eventDate!: Date;
  public startTime?: string;
  public endTime?: string;
  public location?: string;
  public createdByUserId!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
}

Event.init(
  {
    eventId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'event_id'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'event_date'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'end_time'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by_user_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['event_date']
      },
      {
        fields: ['created_by_user_id']
      }
    ]
  }
);

export default Event;