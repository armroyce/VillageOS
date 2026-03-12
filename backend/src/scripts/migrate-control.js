require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

async function migrateControl() {
  const db = new Sequelize(process.env.CONTROL_DB_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: console.log,
  });

  await db.authenticate();
  console.log('✅ Connected to control DB');

  await db.query(`
    CREATE TABLE IF NOT EXISTS villages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      subdomain VARCHAR(255) NOT NULL UNIQUE,
      db_connection_string TEXT NOT NULL,
      logo_url VARCHAR(500),
      theme_color VARCHAR(20) DEFAULT '#1B4D3E',
      language_default VARCHAR(5) DEFAULT 'en',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      village_id UUID NOT NULL REFERENCES villages(id),
      plan VARCHAR(20) DEFAULT 'free',
      status VARCHAR(20) DEFAULT 'active',
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS global_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(100) NOT NULL UNIQUE,
      description VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS super_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      assigned_villages JSONB DEFAULT '[]',
      is_root BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID,
      action VARCHAR(255) NOT NULL,
      target VARCHAR(255),
      ip_address VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ Control DB migration complete');
  await db.close();
}

migrateControl().catch((err) => { console.error(err); process.exit(1); });
