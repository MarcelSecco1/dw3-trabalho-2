import { Router } from 'express';
import { pool } from '../database/pool.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const fields = `c.id, c.paciente_id AS "pacienteId", p.nome AS "pacienteNome", c.especialidade, c.profissional, TO_CHAR(c.data, 'YYYY-MM-DD') AS data, TO_CHAR(c.hora, 'HH24:MI') AS hora, c.valor, c.status, c.observacoes, c.removido, c.criado_em AS "criadoEm"`;
const source = 'FROM consultas c JOIN pacientes p ON p.id = c.paciente_id';
const validDate = (date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
const validTime = (time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
const valid = (body) => Number.isInteger(Number(body.pacienteId)) && body.especialidade?.trim() && body.profissional?.trim() && validDate(body.data) && validTime(body.hora) && Number.isFinite(Number(body.valor)) && Number(body.valor) >= 0 && ['agendada', 'realizada', 'cancelada'].includes(body.status);

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE c.removido = FALSE ORDER BY c.data DESC, c.hora DESC, c.id DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE c.id = $1 AND c.removido = FALSE`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Consulta não encontrada.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Confira os dados da consulta.' });
    const { pacienteId, especialidade, profissional, data, hora, valor, status, observacoes = '' } = req.body;
    const patient = await pool.query('SELECT id FROM pacientes WHERE id = $1 AND removido = FALSE', [pacienteId]);
    if (!patient.rowCount) return res.status(400).json({ message: 'Selecione um paciente ativo.' });
    const { rows } = await pool.query(
      `INSERT INTO consultas (paciente_id, especialidade, profissional, data, hora, valor, status, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [pacienteId, especialidade.trim(), profissional.trim(), data, hora, valor, status, String(observacoes).trim()],
    );
    const created = await pool.query(`SELECT ${fields} ${source} WHERE c.id = $1`, [rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Confira os dados da consulta.' });
    const { pacienteId, especialidade, profissional, data, hora, valor, status, observacoes = '' } = req.body;
    const patient = await pool.query('SELECT id FROM pacientes WHERE id = $1', [pacienteId]);
    if (!patient.rowCount) return res.status(400).json({ message: 'Selecione um paciente válido.' });
    const updated = await pool.query(
      'UPDATE consultas SET paciente_id = $1, especialidade = $2, profissional = $3, data = $4, hora = $5, valor = $6, status = $7, observacoes = $8 WHERE id = $9 AND removido = FALSE RETURNING id',
      [pacienteId, especialidade.trim(), profissional.trim(), data, hora, valor, status, String(observacoes).trim(), req.params.id],
    );
    if (!updated.rowCount) return res.status(404).json({ message: 'Consulta não encontrada.' });
    const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE c.id = $1`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE consultas SET removido = TRUE WHERE id = $1 AND removido = FALSE RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Consulta não encontrada.' });
    res.json({ message: 'Consulta removida com sucesso.' });
  } catch (error) { next(error); }
});

export default router;
