const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// AES Encryption config
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.createHash('sha256').update(process.env.JWT_SECRET || 'super_secret_jwt_key_traveliq_2026').digest('hex'); // Must be 256 bits (32 bytes / 64 hex characters)
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  // If already encrypted (contains :), skip
  if (text.includes(':') && text.split(':').length === 2) return text;
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return text;
  if (!text.includes(':')) return text; // Not encrypted
  try {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    return text; // Fallback to raw text if decryption fails
  }
}


const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true,
    set(val) {
      this.setDataValue('phone_number', encrypt(val));
    },
    get() {
      return decrypt(this.getDataValue('phone_number'));
    }
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trusted_devices: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  failed_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  suspended_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profile_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: ''
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
    set(val) {
      this.setDataValue('location', encrypt(val));
    },
    get() {
      return decrypt(this.getDataValue('location'));
    }
  },
  theme_preference: {
    type: DataTypes.ENUM('dark', 'light', 'system'),
    defaultValue: 'dark'
  },
  account_status: {
    type: DataTypes.ENUM('active', 'pending_verification', 'deactivated', 'deleted', 'suspended'),
    defaultValue: 'pending_verification'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  admin_role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'data_manager', 'support_admin'),
    allowNull: true,
    defaultValue: null
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe user object (no password)
User.prototype.toSafeObject = function () {
  const { password, ...safe } = this.toJSON();
  return safe;
};

module.exports = User;
