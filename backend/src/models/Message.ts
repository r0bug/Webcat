import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MessageAttributes {
  messageId: number;
  itemId?: number;
  senderId: number;
  recipientId: number;
  subject?: string;
  messageText: string;
  isRead: boolean;
  sentAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'messageId' | 'itemId' | 'subject' | 'isRead' | 'sentAt'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public messageId!: number;
  public itemId?: number;
  public senderId!: number;
  public recipientId!: number;
  public subject?: string;
  public messageText!: string;
  public isRead!: boolean;
  public readonly sentAt!: Date;
}

Message.init(
  {
    messageId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'message_id'
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'item_id',
      references: {
        model: 'items',
        key: 'item_id'
      }
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'recipient_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    messageText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message_text'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read'
    }
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    updatedAt: false,
    createdAt: 'sent_at',
    underscored: true,
    indexes: [
      {
        fields: ['sender_id']
      },
      {
        fields: ['recipient_id']
      },
      {
        fields: ['item_id']
      }
    ]
  }
);

export default Message;