import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface ItemTagAttributes {
  itemId: number;
  tagId: number;
  addedByUserId: number;
  addedAt?: Date;
}

class ItemTag extends Model<ItemTagAttributes> implements ItemTagAttributes {
  public itemId!: number;
  public tagId!: number;
  public addedByUserId!: number;
  public readonly addedAt!: Date;
}

ItemTag.init(
  {
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'item_id',
      references: {
        model: 'items',
        key: 'item_id'
      },
      onDelete: 'CASCADE'
    },
    tagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'tag_id',
      references: {
        model: 'tags',
        key: 'tag_id'
      },
      onDelete: 'CASCADE'
    },
    addedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'added_by_user_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    }
  },
  {
    sequelize,
    modelName: 'ItemTag',
    tableName: 'item_tags',
    timestamps: true,
    updatedAt: false,
    createdAt: 'added_at',
    underscored: true
  }
);

export default ItemTag;