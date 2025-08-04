import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TagAttributes {
  tagId: number;
  tagName: string;
  createdAt?: Date;
}

interface TagCreationAttributes extends Optional<TagAttributes, 'tagId' | 'createdAt'> {}

class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
  public tagId!: number;
  public tagName!: string;
  public readonly createdAt!: Date;
}

Tag.init(
  {
    tagId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'tag_id'
    },
    tagName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'tag_name',
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    }
  },
  {
    sequelize,
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    hooks: {
      beforeCreate: (tag) => {
        // Normalize tag name
        tag.tagName = tag.tagName.toLowerCase().trim();
      }
    }
  }
);

export default Tag;