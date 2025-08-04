import { Model, DataTypes, Sequelize } from 'sequelize';

export interface ThemeSettingAttributes {
  id?: number;
  settingKey: string;
  settingValue: string | null;
  settingType: 'color' | 'text' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ThemeSetting extends Model<ThemeSettingAttributes> implements ThemeSettingAttributes {
  public id!: number;
  public settingKey!: string;
  public settingValue!: string | null;
  public settingType!: 'color' | 'text' | 'number' | 'boolean' | 'json';
  public category!: string;
  public description?: string;
  public updatedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof ThemeSetting {
    ThemeSetting.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        settingKey: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          field: 'setting_key'
        },
        settingValue: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'setting_value'
        },
        settingType: {
          type: DataTypes.ENUM('color', 'text', 'number', 'boolean', 'json'),
          allowNull: false,
          defaultValue: 'text',
          field: 'setting_type'
        },
        category: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'general'
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        updatedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'updated_by'
        }
      },
      {
        sequelize,
        modelName: 'ThemeSetting',
        tableName: 'theme_settings',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return ThemeSetting;
  }

  static associate(models: any): void {
    ThemeSetting.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  }
}