import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ForumPostAttributes {
  postId: number;
  itemId?: number;
  userId: number;
  parentPostId?: number;
  title?: string;
  content: string;
  isPinned: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ForumPostCreationAttributes extends Optional<ForumPostAttributes, 'postId' | 'itemId' | 'parentPostId' | 'title' | 'isPinned' | 'createdAt' | 'updatedAt'> {}

class ForumPost extends Model<ForumPostAttributes, ForumPostCreationAttributes> implements ForumPostAttributes {
  public postId!: number;
  public itemId?: number;
  public userId!: number;
  public parentPostId?: number;
  public title?: string;
  public content!: string;
  public isPinned!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ForumPost.init(
  {
    postId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'post_id'
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    parentPostId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_post_id',
      references: {
        model: 'forum_posts',
        key: 'post_id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_pinned'
    }
  },
  {
    sequelize,
    modelName: 'ForumPost',
    tableName: 'forum_posts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['item_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['parent_post_id']
      }
    ]
  }
);

export default ForumPost;