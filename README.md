# VitaCare — gestão de atendimentos

Aplicação de gestão para uma clínica, com cadastro de pacientes e consultas relacionadas. O front-end React consome uma API REST Express; a API usa PostgreSQL e protege as rotas dos cadastros com JWT.

## Executar com Docker

```bash
cp .env.example .env
docker compose up --build
```

- Interface: http://localhost:5173
- API: http://localhost:4000/api
- Verificação da API: http://localhost:4000/api/health
- Acesso inicial: `admin` / `admin123`

Para encerrar: `docker compose down`. Para apagar também os dados do banco local: `docker compose down -v`.

## Estrutura dos dados

- **Pacientes**: nome, CPF, telefone, e-mail, data de nascimento, convênio, ID e `removido`.
- **Consultas**: paciente, especialidade, profissional, data, horário, valor decimal, status, observações, ID e `removido`.
- Cada paciente pode ter várias consultas. A exclusão é lógica: os registros ficam no banco com `removido = true`.
- O front-end não acessa o banco. Somente o back-end se conecta ao PostgreSQL.

## Rotas da API

O login é público. As demais rotas requerem `Authorization: Bearer <token>`.

| Recurso | Listar | Buscar por ID | Inserir | Atualizar | Remover |
|---|---|---|---|---|---|
| Pacientes | `GET /api/pacientes` | `GET /api/pacientes/:id` | `POST /api/pacientes` | `PUT /api/pacientes/:id` | `DELETE /api/pacientes/:id` |
| Consultas | `GET /api/consultas` | `GET /api/consultas/:id` | `POST /api/consultas` | `PUT /api/consultas/:id` | `DELETE /api/consultas/:id` |

Autenticação: `POST /api/auth/login`, com `username` e `password` no JSON.

Em cada inicialização, o back-end garante a conta definida em `ADMIN_USERNAME` e `ADMIN_PASSWORD`. Altere esses valores no `.env` antes de iniciar o ambiente.
