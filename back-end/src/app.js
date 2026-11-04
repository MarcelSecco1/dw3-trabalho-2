import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import pacientesRouter from './routes/pacientes.js';
import consultasRouter from './routes/consultas.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'clinicacare-api' }));
app.use('/api/auth', authRouter);
app.use('/api/pacientes', pacientesRouter);
app.use('/api/consultas', consultasRouter);
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

export default app;
