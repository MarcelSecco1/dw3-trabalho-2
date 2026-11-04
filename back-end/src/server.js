import 'dotenv/config';
import bcrypt from 'bcryptjs';
import app from './app.js';
import { pool } from './database/pool.js';

const port = Number(process.env.PORT ?? 4000);

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
    throw new Error('JWT_SECRET precisa ter pelo menos 24 caracteres.');
  }

  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO usuarios (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, hash],
  );

  app.listen(port, '0.0.0.0', () => console.log(`API disponível na porta ${port}`));
}

start().catch((error) => {
  console.error('Não foi possível iniciar a API:', error);
  process.exit(1);
});
