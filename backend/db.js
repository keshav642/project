import { Pool } from 'pg';

// ✅ PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'leaddb',
  password: 'keshav@123',
  port: 5432,
});


export default pool;
