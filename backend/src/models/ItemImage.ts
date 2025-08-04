import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ItemImageAttributes {
  imageId: number;
  itemId: number;
  imageUrl: string;
  imageOrder: number;
  altText?: string;
  uploadedAt?: Date;
}

interface ItemImageCreationAttributes extends Optional<ItemImageAttributes, 'imageId' | 'imageOrder' | 'altText' | 'uploadedAt'> {}

class ItemImage extends Model<ItemImageAttributes, ItemImageCreationAttributes> implements ItemImageAttributes {
  public imageId!: number;
  public itemId!: number;
  public imageUrl!: string;
  public imageOrder!: number;
  public altText?: string;
  public readonly uploadedAt!: Date;
}

ItemImage.init(
  {
    imageId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'image_id'
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'item_id',
      references: {
        model: 'items',
        key: 'item_id'
      },
      onDelete: 'CASCADE'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'image_url'
    },
    imageOrder: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      field: 'image_order',
      validate: {
        min: 1,
        max: 6
      }
    },
    altText: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'alt_text'
    }
  },
  {
    sequelize,
    modelName: 'ItemImage',
    tableName: 'item_images',
    timestamps: true,
    updatedAt: false,
    createdAt: 'uploaded_at',
    underscored: true,
    indexes: [
      {
        fields: ['item_id', 'image_order'],
        unique: true
      }
    ]
  }
);

export default ItemImage;