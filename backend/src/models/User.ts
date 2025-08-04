import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import { UserType } from '../types';

interface UserAttributes {
  userId: number;
  name: string;
  email: string;
  passwordHash: string;
  contactInfo?: string;
  phoneNumber?: string;
  yfVendorId?: string;
  userType: UserType;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'userId' | 'contactInfo' | 'phoneNumber' | 'yfVendorId' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public userId!: number;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public contactInfo?: string;
  public phoneNumber?: string;
  public yfVendorId?: string;
  public userType!: UserType;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to check password
  public async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Instance method to set password
  public async setPassword(password: string): Promise<void> {
    this.passwordHash = await bcrypt.hash(password, 10);
  }
}

User.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'user_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    contactInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'contact_info'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone_number'
    },
    yfVendorId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'yf_vendor_id'
    },
    userType: {
      type: DataTypes.ENUM('Admin', 'Staff', 'Vendor'),
      allowNull: false,
      defaultValue: 'Vendor',
      field: 'user_type'
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash && !user.passwordHash.startsWith('$2')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash') && !user.passwordHash.startsWith('$2')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      }
    }
  }
);

export default User;