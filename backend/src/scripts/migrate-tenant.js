require('dotenv').config();
const { Sequelize } = require('sequelize');

async function migrateTenant(connStr, label) {
  const db = new Sequelize(connStr, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: console.log,
  });

  await db.authenticate();
  console.log(`✅ Connected to ${label}`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_key VARCHAR(100) NOT NULL,
      UNIQUE(role_id, permission_key)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role_id UUID REFERENCES roles(id),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS families (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_head_name VARCHAR(255) NOT NULL,
      address TEXT,
      ward_number VARCHAR(50),
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      age INTEGER,
      gender VARCHAR(10),
      relation VARCHAR(20),
      aadhaar_last4 VARCHAR(4),
      is_voter BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tax_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id),
      amount NUMERIC(10,2) NOT NULL,
      type VARCHAR(30) NOT NULL,
      status VARCHAR(20) DEFAULT 'paid',
      collected_by UUID,
      receipt_number VARCHAR(100) UNIQUE,
      collected_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      category VARCHAR(50),
      bill_url VARCHAR(500),
      status VARCHAR(20) DEFAULT 'pending',
      created_by UUID,
      approved_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_id UUID NOT NULL REFERENCES expenses(id),
      action VARCHAR(20) NOT NULL,
      actor_id UUID,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tenant_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50),
      record_id UUID,
      old_value JSONB,
      new_value JSONB,
      ip VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log(`✅ ${label} migration complete`);
  await db.close();
}

async function main() {
  const tenants = [
    { url: process.env.TENANT_DB_VILLAGE_01, label: 'db_village_01' },
    { url: process.env.TENANT_DB_VILLAGE_02, label: 'db_village_02' },
  ];
  for (const t of tenants) {
    if (t.url) await migrateTenant(t.url, t.label);
    else console.warn(`⚠️  No connection string for ${t.label}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
