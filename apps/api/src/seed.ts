import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAIL = 'duongtrongnghia287@gmail.com';
const ADMIN_PASSWORD = 'Password123@';
const ADMIN_NAME = 'Leo Duong';
const ORG_NAME = 'Leo Duong Organization';

async function seed() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: process.env.DB_PATH || 'taskdb.sqlite',
    entities: ['dist/apps/api/**/*.entity.js'],
    synchronize: false,
  });

  await dataSource.initialize();

  const orgId = uuidv4();
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await dataSource.query(`
    INSERT OR IGNORE INTO organizations (id, name, createdAt, updatedAt)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `, [orgId, ORG_NAME]);

  const existingOrg = await dataSource.query(`
    SELECT id FROM organizations WHERE name = ?
  `, [ORG_NAME]);

  const finalOrgId = existingOrg[0]?.id || orgId;

  const existingUser = await dataSource.query(`
    SELECT id FROM users WHERE email = ?
  `, [ADMIN_EMAIL]);

  if (existingUser.length === 0) {
    await dataSource.query(`
      INSERT INTO users (id, email, name, password, role, organizationId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'owner', ?, datetime('now'), datetime('now'))
    `, [userId, ADMIN_EMAIL, ADMIN_NAME, hashedPassword, finalOrgId]);

    console.log('Admin user created successfully!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
  } else {
    console.log('Admin user already exists.');
  }

  await dataSource.destroy();
}

seed().catch(console.error);
