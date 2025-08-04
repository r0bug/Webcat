import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ItemStatus } from '../types';

interface ItemAttributes {
  itemId: number;
  title: string;
  description?: string;
  price?: number;
  vendorId: number;
  location?: string;
  contactInfo?: string;
  status: ItemStatus;
  dateAdded?: Date;
  updatedAt?: Date;
  urlSlug: string;
  viewCount: number;
}

interface ItemCreationAttributes extends Optional<ItemAttributes, 'itemId' | 'description' | 'price' | 'location' | 'contactInfo' | 'status' | 'dateAdded' | 'updatedAt' | 'urlSlug' | 'viewCount'> {}

class Item extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
  public itemId!: number;
  public title!: string;
  public description?: string;
  public price?: number;
  public vendorId!: number;
  public location?: string;
  public contactInfo?: string;
  public status!: ItemStatus;
  public readonly dateAdded!: Date;
  public readonly updatedAt!: Date;
  public urlSlug!: string;
  public viewCount!: number;

  // Generate URL slug from title
  public static generateSlug(title: string, itemId?: number): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    return itemId ? `${slug}-${itemId}` : slug;
  }
}

Item.init(
  {
    itemId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'item_id'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'vendor_id',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contactInfo: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'contact_info'
    },
    status: {
      type: DataTypes.ENUM('Available', 'Pending', 'Sold', 'Removed'),
      allowNull: false,
      defaultValue: 'Available'
    },
    urlSlug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'url_slug'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'view_count'
    }
  },
  {
    sequelize,
    modelName: 'Item',
    tableName: 'items',
    timestamps: true,
    underscored: true,
    createdAt: 'date_added',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (item) => {
        if (!item.urlSlug) {
          item.urlSlug = Item.generateSlug(item.title);
        }
      },
      afterCreate: (item) => {
        // Update slug with ID after creation
        item.urlSlug = Item.generateSlug(item.title, item.itemId);
        item.save();
      }
    }
  }
);

export default Item;