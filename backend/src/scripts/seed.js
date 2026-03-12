require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const { encrypt } = require('../utils/crypto');
const { generateReceiptNumber } = require('../utils/receipt');

const PERMISSIONS = [
  { key: 'FAMILY_VIEW', description: 'View family and member records' },
  { key: 'FAMILY_CREATE', description: 'Add new family or member' },
  { key: 'FAMILY_EDIT', description: 'Edit family or member details' },
  { key: 'FAMILY_DELETE', description: 'Delete family or member records' },
  { key: 'TAX_VIEW', description: 'View tax records and dues' },
  { key: 'TAX_CREATE', description: 'Collect tax payment' },
  { key: 'EXPENSE_VIEW', description: 'View expense records' },
  { key: 'EXPENSE_CREATE', description: 'Create new expense entry' },
  { key: 'EXPENSE_APPROVE', description: 'Approve or reject expenses' },
  { key: 'ROLE_VIEW', description: 'View roles and permissions' },
  { key: 'ROLE_MANAGE', description: 'Create and manage roles' },
  { key: 'USER_VIEW', description: 'View user accounts' },
  { key: 'USER_CREATE', description: 'Create new user accounts' },
  { key: 'USER_EDIT', description: 'Edit or deactivate users' },
  { key: 'AUDIT_VIEW', description: 'View audit logs and reports' },
];

const ADMIN_PERMS = PERMISSIONS.map((p) => p.key);
const CLERK_PERMS = ['FAMILY_VIEW', 'FAMILY_CREATE', 'FAMILY_EDIT', 'TAX_VIEW', 'TAX_CREATE', 'EXPENSE_VIEW', 'EXPENSE_CREATE'];
const AUDITOR_PERMS = ['FAMILY_VIEW', 'TAX_VIEW', 'EXPENSE_VIEW', 'AUDIT_VIEW'];

const TAMIL_NAMES = [
  'Murugan', 'Selvam', 'Rajan', 'Kumaran', 'Arjun',
  'Priya', 'Kavitha', 'Meena', 'Lakshmi', 'Suresh',
];

function controlDb() {
  return new Sequelize(process.env.CONTROL_DB_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false,
  });
}

function tenantDb(url) {
  return new Sequelize(url, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false,
  });
}

async function seedControl(db) {
  // Root super admin
  const rootHash = await bcrypt.hash('Admin@123', 12);
  await db.query(`
    INSERT INTO super_admins (name, email, password_hash, is_root, assigned_villages)
    VALUES ('Root Admin', 'root@villageos.com', '${rootHash}', TRUE, '[]')
    ON CONFLICT (email) DO NOTHING;
  `);
  console.log('✅ Root super admin seeded');

  // Global permissions
  for (const p of PERMISSIONS) {
    await db.query(`
      INSERT INTO global_permissions (key, description) VALUES ('${p.key}', '${p.description}')
      ON CONFLICT (key) DO NOTHING;
    `);
  }
  console.log('✅ Global permissions seeded');

  // Demo villages
  const v01conn = encrypt(process.env.TENANT_DB_VILLAGE_01);
  const v02conn = encrypt(process.env.TENANT_DB_VILLAGE_02);

  await db.query(`
    INSERT INTO villages (name, subdomain, db_connection_string, theme_color, language_default)
    VALUES
      ('Keezhakudi Village', 'village-01', '${v01conn}', '#1B4D3E', 'ta'),
      ('Melpakkam Village', 'village-02', '${v02conn}', '#2D5986', 'en')
    ON CONFLICT (subdomain) DO NOTHING;
  `);

  const [villages] = await db.query(`SELECT id, subdomain FROM villages WHERE subdomain IN ('village-01','village-02')`);
  for (const v of villages) {
    await db.query(`
      INSERT INTO subscriptions (village_id, plan, status)
      VALUES ('${v.id}', 'standard', 'active')
      ON CONFLICT DO NOTHING;
    `);
  }
  console.log('✅ Demo villages and subscriptions seeded');
  return villages;
}

async function seedTenant(db, villageLabel) {
  // Roles
  await db.query(`
    INSERT INTO roles (name, description) VALUES
      ('Admin', 'Full access administrator'),
      ('Clerk', 'Data entry and tax collection'),
      ('Auditor', 'Read-only audit access')
    ON CONFLICT DO NOTHING;
  `);

  const [roles] = await db.query(`SELECT id, name FROM roles`);
  const roleMap = {};
  for (const r of roles) roleMap[r.name] = r.id;

  // Assign permissions to roles
  for (const key of ADMIN_PERMS) {
    await db.query(`INSERT INTO role_permissions (role_id, permission_key) VALUES ('${roleMap['Admin']}', '${key}') ON CONFLICT DO NOTHING;`);
  }
  for (const key of CLERK_PERMS) {
    await db.query(`INSERT INTO role_permissions (role_id, permission_key) VALUES ('${roleMap['Clerk']}', '${key}') ON CONFLICT DO NOTHING;`);
  }
  for (const key of AUDITOR_PERMS) {
    await db.query(`INSERT INTO role_permissions (role_id, permission_key) VALUES ('${roleMap['Auditor']}', '${key}') ON CONFLICT DO NOTHING;`);
  }
  console.log(`✅ Roles and permissions seeded for ${villageLabel}`);

  // Users
  const adminHash = await bcrypt.hash('Village@123', 12);
  const clerkHash = await bcrypt.hash('Clerk@123', 12);
  const label = villageLabel.replace('_', '').toLowerCase();
  await db.query(`
    INSERT INTO users (name, email, password_hash, role_id, is_active) VALUES
      ('Admin User', 'admin@${label}.com', '${adminHash}', '${roleMap['Admin']}', TRUE),
      ('Clerk User', 'clerk@${label}.com', '${clerkHash}', '${roleMap['Clerk']}', TRUE)
    ON CONFLICT (email) DO NOTHING;
  `);

  const [adminUser] = await db.query(`SELECT id FROM users WHERE email = 'admin@${label}.com'`);
  const adminId = adminUser[0]?.id;
  const clerkIds = await db.query(`SELECT id FROM users WHERE email = 'clerk@${label}.com'`);
  const clerkId = clerkIds[0][0]?.id;

  // 10 sample families
  const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'];
  const familyIds = [];
  for (let i = 0; i < 10; i++) {
    const name = TAMIL_NAMES[i];
    const ward = wards[i % wards.length];
    const [result] = await db.query(`
      INSERT INTO families (family_head_name, address, ward_number, created_by)
      VALUES ('${name} Family', '${i + 1} Main Street, ${ward}', '${ward}', '${adminId}')
      RETURNING id;
    `);
    const famId = result[0].id;
    familyIds.push(famId);

    // Head member
    await db.query(`
      INSERT INTO members (family_id, name, age, gender, relation, is_voter)
      VALUES ('${famId}', '${name}', ${30 + i}, 'male', 'head', TRUE);
    `);
    // Spouse
    await db.query(`
      INSERT INTO members (family_id, name, age, gender, relation, is_voter)
      VALUES ('${famId}', '${TAMIL_NAMES[(i + 5) % 10]}', ${28 + i}, 'female', 'spouse', TRUE);
    `);
    // Child
    await db.query(`
      INSERT INTO members (family_id, name, age, gender, relation, is_voter)
      VALUES ('${famId}', 'Child ${i + 1}', ${5 + i}, 'male', 'child', FALSE);
    `);
  }
  console.log(`✅ 10 families + members seeded for ${villageLabel}`);

  // Tax entries for first 8 families
  for (let i = 0; i < 8; i++) {
    const receipt = generateReceiptNumber();
    await db.query(`
      INSERT INTO tax_ledger (family_id, amount, type, status, collected_by, receipt_number, collected_at)
      VALUES ('${familyIds[i]}', ${500 + i * 100}, 'house_tax', 'paid', '${clerkId || adminId}', '${receipt}', NOW());
    `);
  }
  // Pongal festival tax for 5 families
  for (let i = 0; i < 5; i++) {
    const receipt = generateReceiptNumber();
    await db.query(`
      INSERT INTO tax_ledger (family_id, amount, type, status, collected_by, receipt_number, collected_at)
      VALUES ('${familyIds[i]}', 200, 'festival', 'paid', '${clerkId || adminId}', '${receipt}', NOW());
    `);
  }
  console.log(`✅ Tax ledger seeded for ${villageLabel}`);

  // Sample expenses
  const expenses = [
    { title: 'Road repair - Main Street', amount: 15000, category: 'road', status: 'approved' },
    { title: 'Temple renovation', amount: 25000, category: 'temple', status: 'approved' },
    { title: 'Water pump maintenance', amount: 8000, category: 'water', status: 'pending' },
    { title: 'Street lights', amount: 12000, category: 'electricity', status: 'rejected' },
  ];
  for (const exp of expenses) {
    await db.query(`
      INSERT INTO expenses (title, amount, category, status, created_by, approved_by)
      VALUES ('${exp.title}', ${exp.amount}, '${exp.category}', '${exp.status}', '${adminId}', ${exp.status === 'approved' ? `'${adminId}'` : 'NULL'});
    `);
  }
  console.log(`✅ Expenses seeded for ${villageLabel}`);
}

async function main() {
  const cdb = controlDb();
  await cdb.authenticate();
  await seedControl(cdb);
  await cdb.close();

  const db01 = tenantDb(process.env.TENANT_DB_VILLAGE_01);
  await db01.authenticate();
  await seedTenant(db01, 'village_01');
  await db01.close();

  const db02 = tenantDb(process.env.TENANT_DB_VILLAGE_02);
  await db02.authenticate();
  await seedTenant(db02, 'village_02');
  await db02.close();

  console.log('\n🎉 All seed data complete!');
}

main().catch((err) => { console.error(err); process.exit(1); });
