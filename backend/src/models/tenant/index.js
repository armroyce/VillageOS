const { DataTypes } = require('sequelize');

function defineTenantModels(sequelize) {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'roles', timestamps: true, underscored: true });

  const RolePermission = sequelize.define('RolePermission', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    role_id: { type: DataTypes.UUID, allowNull: false },
    permission_key: { type: DataTypes.STRING, allowNull: false },
  }, { tableName: 'role_permissions', timestamps: false, underscored: true });

  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role_id: { type: DataTypes.UUID },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'users', timestamps: true, underscored: true });

  const Family = sequelize.define('Family', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    family_name: { type: DataTypes.STRING },
    family_head_name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT },
    ward_number: { type: DataTypes.STRING },
    phone_number: { type: DataTypes.STRING(15) },
    created_by: { type: DataTypes.UUID },
  }, { tableName: 'families', timestamps: true, underscored: true });

  const Member = sequelize.define('Member', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    family_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER },
    gender: { type: DataTypes.ENUM('male', 'female', 'other') },
    relation: { type: DataTypes.ENUM('head', 'spouse', 'child', 'parent', 'other') },
    aadhaar_last4: { type: DataTypes.STRING(4) },
    is_voter: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'members', timestamps: true, underscored: true });

  const TaxLedger = sequelize.define('TaxLedger', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    family_id: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    type: { type: DataTypes.ENUM('house_tax', 'festival'), allowNull: false },
    status: { type: DataTypes.ENUM('paid', 'pending'), defaultValue: 'paid' },
    collected_by: { type: DataTypes.UUID },
    receipt_number: { type: DataTypes.STRING, unique: true },
    collected_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    description: { type: DataTypes.STRING },  // labels the assignment e.g. "House Tax 2026"
  }, { tableName: 'tax_ledger', timestamps: false, underscored: true });

  const Expense = sequelize.define('Expense', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    category: { type: DataTypes.ENUM('road', 'temple', 'water', 'electricity', 'sanitation', 'education', 'other') },
    bill_url: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    created_by: { type: DataTypes.UUID },
    approved_by: { type: DataTypes.UUID },
  }, { tableName: 'expenses', timestamps: true, underscored: true });

  const Approval = sequelize.define('Approval', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    expense_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.ENUM('approved', 'rejected'), allowNull: false },
    actor_id: { type: DataTypes.UUID },
    note: { type: DataTypes.TEXT },
  }, { tableName: 'approvals', timestamps: true, updatedAt: false, underscored: true });

  const TenantAuditLog = sequelize.define('TenantAuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    action: { type: DataTypes.STRING, allowNull: false },
    module: { type: DataTypes.STRING },
    record_id: { type: DataTypes.UUID },
    old_value: { type: DataTypes.JSONB },
    new_value: { type: DataTypes.JSONB },
    ip: { type: DataTypes.STRING },
  }, { tableName: 'tenant_audit_logs', timestamps: true, updatedAt: false, underscored: true });

  // Associations
  Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'permissions' });
  RolePermission.belongsTo(Role, { foreignKey: 'role_id' });

  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  Role.hasMany(User, { foreignKey: 'role_id' });

  Family.hasMany(Member, { foreignKey: 'family_id', as: 'members' });
  Member.belongsTo(Family, { foreignKey: 'family_id' });

  Family.hasMany(TaxLedger, { foreignKey: 'family_id', as: 'taxes' });
  TaxLedger.belongsTo(Family, { foreignKey: 'family_id' });

  Expense.hasMany(Approval, { foreignKey: 'expense_id', as: 'approvals' });
  Approval.belongsTo(Expense, { foreignKey: 'expense_id' });

  return { Role, RolePermission, User, Family, Member, TaxLedger, Expense, Approval, TenantAuditLog };
}

module.exports = { defineTenantModels };
