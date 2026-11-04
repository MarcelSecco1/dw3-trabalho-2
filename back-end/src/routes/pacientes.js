import { Router } from 'express';
import { pool } from '../database/pool.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const fields = `id, nome, cpf, telefone, email, TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS "dataNascimento", convenio, removido, criado_em AS "criadoEm"`;
const validDate = (date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
const valid = (body) => body.nome?.trim() && validDate(body.dataNascimento);

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} FROM pacientes WHERE removido = FALSE ORDER BY nome`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} FROM pacientes WHERE id = $1 AND removido = FALSE`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Paciente não encontrado.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Informe o nome e uma data de nascimento válida.' });
    const { nome, cpf = '', telefone = '', email = '', dataNascimento, convenio = 'Particular' } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO pacientes (nome, cpf, telefone, email, data_nascimento, convenio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${fields}`,
      [nome.trim(), cpf.trim(), telefone.trim(), email.trim(), dataNascimento, convenio.trim() || 'Particular'],
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Informe o nome e uma data de nascimento válida.' });
    const { nome, cpf = '', telefone = '', email = '', dataNascimento, convenio = 'Particular' } = req.body;
    const { rows } = await pool.query(
      `UPDATE pacientes SET nome = $1, cpf = $2, telefone = $3, email = $4, data_nascimento = $5, convenio = $6 WHERE id = $7 AND removido = FALSE RETURNING ${fields}`,
      [nome.trim(), cpf.trim(), telefone.trim(), email.trim(), dataNascimento, convenio.trim() || 'Particular', req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Paciente não encontrado.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE pacientes SET removido = TRUE WHERE id = $1 AND removido = FALSE RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Paciente não encontrado.' });
    res.json({ message: 'Paciente removido com sucesso.' });
  } catch (error) { next(error); }
});

export default router;
