import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { consultasApi, login, pacientesApi } from './api.js';

const storedSession = () => {
  try { return JSON.parse(localStorage.getItem('clinicacare-session') || 'null'); } catch { return null; }
};
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const currencyField = (value) => value === '' || value == null ? '' : money(value);
const currencyValue = (raw) => { const digits = raw.replace(/\D/g, ''); return digits ? (Number(digits) / 100).toFixed(2) : ''; };
const dateLabel = (value) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
const today = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
};
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    patient: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    pulse: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    exit: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.8 5Z"/></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await onLogin(username, password); } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="login-layout">
    <section className="login-brand">
      <div className="brand-mark"><span className="brand-symbol">v</span><span>vitacare</span></div>
      <div className="brand-copy"><div className="eyebrow light"><span className="eyebrow-dot"/> CUIDADO EM CADA DETALHE</div><h1>Mais tempo para cuidar. Mais clareza para organizar.</h1><p>Pacientes e consultas reunidos em um só lugar para acompanhar cada etapa do atendimento.</p></div>
      <div className="login-foot"><span>GESTÃO DE ATENDIMENTOS</span><span>01 — 02</span></div>
      <div className="brand-orbit orbit-one"/><div className="brand-orbit orbit-two"/><div className="brand-orbit orbit-three"/>
    </section>
    <section className="login-panel"><div className="login-form-wrap">
      <div className="mobile-brand brand-mark"><span className="brand-symbol">v</span><span>vitacare</span></div>
      <div className="eyebrow"><span className="eyebrow-dot"/> ÁREA DA CLÍNICA</div>
      <h2>Bem-vindo de volta.</h2><p className="login-subtitle">Entre com seus dados para acessar a clínica.</p>
      <form className="login-form" onSubmit={submit}>
        <label>Usuário<input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Seu usuário" required autoFocus/></label>
        <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required/></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary login-submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}<Icon name="chevron" size={18}/></button>
      </form>
      <div className="secure-note"><span className="secure-lock">✓</span> Acesso seguro e protegido</div>
    </div><div className="login-legal">VITACARE <span>•</span> GESTÃO DA CLÍNICA</div></section>
  </main>;
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => { const close = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-heading"><div><span className="eyebrow">GESTÃO DA CLÍNICA</span><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><Icon name="close"/></button></div>{children}
  </section></div>;
}

function App() {
  const [session, setSession] = useState(storedSession);
  const [page, setPage] = useState('overview');
  const [pacientes, setPacientes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [greeting, setGreeting] = useState(getGreeting);

  const logout = useCallback(() => { localStorage.removeItem('clinicacare-session'); setSession(null); setPacientes([]); setConsultas([]); }, []);
  const refresh = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true); setError('');
    try {
      const [patientRows, consultationRows] = await Promise.all([pacientesApi.getAll(session.token), consultasApi.getAll(session.token)]);
      setPacientes(patientRows); setConsultas(consultationRows);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { window.addEventListener('auth:expired', logout); return () => window.removeEventListener('auth:expired', logout); }, [logout]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogin(username, password) {
    const result = await login(username, password);
    localStorage.setItem('clinicacare-session', JSON.stringify(result)); setSession(result);
  }

  const summary = useMemo(() => {
    const currentDay = today();
    const scheduled = consultas.filter(item => item.status === 'agendada' && item.data >= currentDay);
    const todayCount = consultas.filter(item => item.data === currentDay && item.status !== 'cancelada').length;
    const completedValue = consultas.filter(item => item.status === 'realizada').reduce((sum, item) => sum + Number(item.valor), 0);
    return { scheduled: scheduled.length, todayCount, completedValue, patients: pacientes.length };
  }, [pacientes, consultas]);

  async function saveRecord(payload) {
    if (!modal) return;
    setSaving(true);
    const api = modal.kind === 'patient' ? pacientesApi : consultasApi;
    try {
      if (modal.record?.id) await api.update(modal.record.id, payload, session.token);
      else await api.insert(payload, session.token);
      setModal(null); setToast(modal.record ? 'Alterações salvas.' : 'Cadastro realizado.'); await refresh();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function deleteRecord(kind, record) {
    const patient = kind === 'patient';
    const label = patient ? 'paciente' : 'consulta';
    const name = patient ? record.nome : 'de ' + record.pacienteNome;
    if (!window.confirm('Remover ' + label + ' ' + name + '?')) return;
    try {
      await (patient ? pacientesApi : consultasApi).remove(record.id, session.token);
      setToast('Registro removido.'); await refresh();
    } catch (e) { setError(e.message); }
  }

  if (!session?.token) return <LoginScreen onLogin={handleLogin}/>;

  const recent = [...consultas].slice(0, 5);
  const filteredConsultas = consultas.filter(item => (item.pacienteNome + ' ' + item.especialidade + ' ' + item.profissional + ' ' + item.status).toLowerCase().includes(search.toLowerCase()));
  const filteredPacientes = pacientes.filter(item => (item.nome + ' ' + item.cpf + ' ' + item.telefone + ' ' + item.convenio).toLowerCase().includes(search.toLowerCase()));
  const upcoming = consultas.filter(item => item.status === 'agendada' && item.data >= today()).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).slice(0, 4);
  const pageTitle = page === 'overview' ? 'Painel' : page === 'patients' ? 'Pacientes' : 'Consultas';

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand-mark sidebar-brand" href="#inicio" onClick={e => { e.preventDefault(); setPage('overview'); }}><span className="brand-symbol">v</span><span>vitacare</span></a>
      <div className="workspace-switch"><div className="workspace-icon">V</div><div><strong>Clínica Vitta</strong><span>Gestão de atendimentos</span></div><span className="workspace-caret">⌄</span></div>
      <div className="nav-label">VISÃO GERAL</div><button className={'nav-item ' + (page === 'overview' ? 'active' : '')} onClick={() => setPage('overview')}><Icon name="grid"/> Painel</button>
      <div className="nav-label nav-label-spaced">ATENDIMENTO</div>
      <button className={'nav-item ' + (page === 'patients' ? 'active' : '')} onClick={() => setPage('patients')}><Icon name="patient"/> Pacientes<span className="nav-count">{pacientes.length}</span></button>
      <button className={'nav-item ' + (page === 'consultations' ? 'active' : '')} onClick={() => setPage('consultations')}><Icon name="calendar"/> Consultas</button>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-mark">?</div><strong>Precisa de ajuda?</strong><span>Atendimento organizado, cuidado melhor.</span></div><button className="user-row" onClick={logout}><div className="avatar">{session.user?.username?.slice(0, 1).toUpperCase() || 'A'}</div><div className="user-info"><strong>{session.user?.username || 'Administrador'}</strong><span>Administrador</span></div><Icon name="exit" size={17}/></button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumb"><span>Clínica Vitta</span><Icon name="chevron" size={15}/><strong>{pageTitle}</strong></div><div className="topbar-right"><span className="today-label"><Icon name="calendar" size={16}/>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span><div className="avatar avatar-small">{session.user?.username?.slice(0, 1).toUpperCase() || 'A'}</div></div></header>
      <div className="page-content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> CUIDADO E ORGANIZAÇÃO</div><h1>{page === 'overview' ? greeting + ', ' + (session.user?.username || 'equipe') + '.' : pageTitle}<span className="heading-period">{page === 'overview' ? 'Acompanhe os atendimentos e o cuidado com cada paciente.' : page === 'patients' ? 'Mantenha os dados dos pacientes sempre organizados.' : 'Acompanhe os horários e os detalhes de cada atendimento.'}</span></h1></div><div className="heading-actions">{page === 'patients' && <button className="button button-primary" onClick={() => setModal({ kind: 'patient' })}><Icon name="plus" size={18}/> Novo paciente</button>}{page === 'consultations' && <button className="button button-primary" onClick={() => setModal({ kind: 'consultation' })}><Icon name="plus" size={18}/> Nova consulta</button>}{page === 'overview' && <button className="button button-primary" onClick={() => setModal({ kind: 'consultation' })}><Icon name="plus" size={18}/> Nova consulta</button>}</div></div>
      {error && <div className="notice-error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Fechar aviso"><Icon name="close" size={16}/></button></div>}
      {page === 'overview' && <>
        <section className="metric-grid"><Metric label="Atendimentos hoje" value={String(summary.todayCount).padStart(2, '0')} detail="Consultas confirmadas para hoje" icon="calendar" tone="green"/><Metric label="Próximas consultas" value={String(summary.scheduled).padStart(2, '0')} detail="Agendamentos em aberto" icon="pulse" tone="blue"/><Metric label="Atendimentos realizados" value={money(summary.completedValue)} detail="Valor total registrado" icon="grid" tone="amber"/><Metric label="Pacientes ativos" value={String(summary.patients).padStart(2, '0')} detail="Cadastros disponíveis" icon="patient" tone="lilac"/></section>
        <section className="overview-grid"><div className="panel recent-panel"><div className="panel-heading"><div><h2>Consultas recentes</h2><p>Últimos atendimentos registrados</p></div><button className="text-button" onClick={() => setPage('consultations')}>Ver todas <Icon name="chevron" size={15}/></button></div><ConsultationTable entries={recent} loading={loading} onEdit={record => setModal({ kind: 'consultation', record })} onDelete={record => deleteRecord('consultation', record)}/></div>
          <div className="panel accounts-panel"><div className="panel-heading"><div><h2>Próximos horários</h2><p>{upcoming.length} consultas agendadas</p></div><button className="icon-button subtle" onClick={() => setPage('consultations')} aria-label="Ver consultas"><Icon name="chevron"/></button></div>{upcoming.length === 0 ? <EmptyState title="Agenda livre por enquanto" text="Cadastre uma consulta para organizar o próximo atendimento." action="Nova consulta" onAction={() => setModal({ kind: 'consultation' })}/> : <div className="account-list">{upcoming.map(item => <div className="account-row" key={item.id}><div className="account-icon"><Icon name="calendar" size={18}/></div><div className="account-main"><strong>{item.pacienteNome}</strong><span>{item.especialidade} · {dateLabel(item.data)} às {item.hora}</span></div><strong className="account-balance">{money(item.valor)}</strong></div>)}</div>}<button className="add-account" onClick={() => setModal({ kind: 'patient' })}><Icon name="plus" size={17}/> Adicionar paciente</button></div></section>
        <div className="bottom-note"><div className="note-check"><Icon name="check" size={15}/></div><span>Os dados da clínica estão sincronizados com segurança.</span><span className="note-divider"/> Atualizado agora</div>
      </>}
      {page === 'consultations' && <section className="panel list-panel"><div className="panel-heading table-heading"><div><h2>Todas as consultas</h2><p>{filteredConsultas.length} registros encontrados</p></div><div className="search-box"><Icon name="search" size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar consulta" aria-label="Buscar consulta"/></div></div><ConsultationTable entries={filteredConsultas} loading={loading} onEdit={record => setModal({ kind: 'consultation', record })} onDelete={record => deleteRecord('consultation', record)}/></section>}
      {page === 'patients' && <section className="panel list-panel"><div className="panel-heading table-heading"><div><h2>Todos os pacientes</h2><p>{filteredPacientes.length} cadastros encontrados</p></div><div className="search-box"><Icon name="search" size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente" aria-label="Buscar paciente"/></div></div>{filteredPacientes.length === 0 && !loading ? <EmptyState title="Nenhum paciente encontrado" text="Cadastre seu primeiro paciente para começar." action="Adicionar paciente" onAction={() => setModal({ kind: 'patient' })}/> : <div className="account-cards">{filteredPacientes.map(patient => <article className="account-card patient-card" key={patient.id}><div className="account-card-top"><div className="account-icon"><Icon name="patient"/></div><span className="type-pill">{patient.convenio || 'Particular'}</span></div><h3>{patient.nome}</h3><p>{patient.telefone || 'Telefone não informado'}{patient.cpf ? ' · ' + patient.cpf : ''}</p><strong className="patient-birth">Nascimento: {dateLabel(patient.dataNascimento)}</strong><div className="row-actions"><button onClick={() => setModal({ kind: 'patient', record: patient })}><Icon name="edit" size={16}/> Editar</button><button className="danger-action" onClick={() => deleteRecord('patient', patient)}><Icon name="trash" size={16}/> Remover</button></div></article>)}</div>}</section>}
      </div><footer className="page-footer"><span>VITACARE <span className="footer-dot">•</span> GESTÃO DE ATENDIMENTOS</span><span>ORGANIZAÇÃO PARA CUIDAR MELHOR</span></footer></main>
    {modal && <RecordModal key={modal.kind + '-' + (modal.record?.id || 'new')} modal={modal} pacientes={pacientes} onClose={() => setModal(null)} onSave={saveRecord} saving={saving}/>}
    {toast && <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={16}/></span>{toast}</div>}
  </div>;
}

function Metric({ label, value, detail, icon, tone }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={'metric-icon ' + tone}><Icon name={icon} size={18}/></span></div><strong className="metric-value">{value}</strong><span className="metric-detail"><i/> {detail}</span></article>;
}

function ConsultationTable({ entries, loading, onEdit, onDelete }) {
  return <div className="table-wrap"><table className="entries-table"><thead><tr><th>PACIENTE</th><th>ESPECIALIDADE</th><th>DATA E HORA</th><th>VALOR</th><th>STATUS</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
    {loading ? <tr><td className="table-empty" colSpan="6">Carregando registros…</td></tr> : entries.length === 0 ? <tr><td className="table-empty" colSpan="6">Nenhuma consulta por aqui.</td></tr> : entries.map(entry => <tr key={entry.id}><td><div className="entry-name"><span className="entry-type-mark"><Icon name="patient" size={16}/></span><div><strong>{entry.pacienteNome}</strong><span>Consulta · #{String(entry.id).padStart(4, '0')}</span></div></div></td><td>{entry.especialidade}<span className="table-secondary">{entry.profissional}</span></td><td className="date-cell">{dateLabel(entry.data)} · {entry.hora}</td><td className="value-cell">{money(entry.valor)}</td><td><span className={'status-pill ' + entry.status}>{entry.status === 'realizada' ? 'Realizada' : entry.status === 'cancelada' ? 'Cancelada' : 'Agendada'}</span></td><td><div className="table-actions"><button aria-label="Editar consulta" onClick={() => onEdit(entry)}><Icon name="edit" size={16}/></button><button aria-label="Remover consulta" onClick={() => onDelete(entry)}><Icon name="trash" size={16}/></button></div></td></tr>)}
  </tbody></table></div>;
}

function EmptyState({ title, text, action, onAction }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name="pulse" size={23}/></div><h3>{title}</h3><p>{text}</p>{action && <button className="button button-secondary" onClick={onAction}><Icon name="plus" size={17}/>{action}</button>}</div>;
}

function RecordModal({ modal, pacientes, onClose, onSave, saving }) {
  const isPatient = modal.kind === 'patient';
  const record = modal.record;
  const [form, setForm] = useState(isPatient ? {
    nome: record?.nome || '', cpf: record?.cpf || '', telefone: record?.telefone || '', email: record?.email || '', dataNascimento: record?.dataNascimento || '', convenio: record?.convenio || 'Particular',
  } : {
    pacienteId: record?.pacienteId || pacientes[0]?.id || '', especialidade: record?.especialidade || '', profissional: record?.profissional || '', data: record?.data || today(), hora: record?.hora || '09:00', valor: record?.valor ?? '', status: record?.status || 'agendada', observacoes: record?.observacoes || '',
  });
  function update(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: name === 'valor' ? currencyValue(value) : value }));
  }
  function submit(event) {
    event.preventDefault();
    onSave(isPatient ? form : { ...form, pacienteId: Number(form.pacienteId), valor: Number(form.valor) });
  }
  return <Modal title={(record ? 'Editar' : 'Novo') + ' ' + (isPatient ? 'paciente' : 'consulta')} subtitle={isPatient ? 'Preencha os dados para manter o cadastro atualizado.' : 'Informe o paciente e os detalhes do atendimento.'} onClose={onClose}>
    <form className="record-form" onSubmit={submit}>
      {isPatient ? <><label>Nome completo<input name="nome" value={form.nome} onChange={update} placeholder="Ex.: Marina Oliveira" required maxLength="140" autoFocus/></label><div className="form-grid"><label>Data de nascimento<input name="dataNascimento" type="date" value={form.dataNascimento} onChange={update} required/></label><label>CPF<input name="cpf" value={form.cpf} onChange={update} placeholder="000.000.000-00" maxLength="14"/></label></div><div className="form-grid"><label>Telefone<input name="telefone" type="tel" value={form.telefone} onChange={update} placeholder="(11) 99999-9999" maxLength="30"/></label><label>E-mail<input name="email" type="email" value={form.email} onChange={update} placeholder="nome@email.com" maxLength="160"/></label></div><label>Convênio<input name="convenio" value={form.convenio} onChange={update} placeholder="Particular" maxLength="100"/></label></>
      : <><label>Paciente<select name="pacienteId" value={form.pacienteId} onChange={update} required disabled={!pacientes.length}><option value="">Selecione um paciente</option>{record && !pacientes.some(patient => patient.id === record.pacienteId) && <option value={record.pacienteId}>{record.pacienteNome} · cadastro removido</option>}{pacientes.map(patient => <option value={patient.id} key={patient.id}>{patient.nome}</option>)}</select></label><div className="form-grid"><label>Especialidade<input name="especialidade" value={form.especialidade} onChange={update} placeholder="Ex.: Cardiologia" required maxLength="120" autoFocus/></label><label>Profissional<input name="profissional" value={form.profissional} onChange={update} placeholder="Nome do profissional" required maxLength="140"/></label></div><div className="form-grid"><label>Data<input name="data" type="date" value={form.data} onChange={update} required/></label><label>Horário<input name="hora" type="time" value={form.hora} onChange={update} required/></label></div><div className="form-grid"><label>Valor<input name="valor" type="text" inputMode="decimal" value={currencyField(form.valor)} onChange={update} placeholder="R$ 0,00" autoComplete="off" required/></label><label>Status<select name="status" value={form.status} onChange={update}><option value="agendada">Agendada</option><option value="realizada">Realizada</option><option value="cancelada">Cancelada</option></select></label></div><label>Observações<textarea name="observacoes" value={form.observacoes} onChange={update} placeholder="Informações adicionais sobre o atendimento" rows="3"/></label>{!pacientes.length && <div className="inline-hint">Cadastre um paciente antes de adicionar consultas.</div>}</>}
      <div className="modal-footer"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving || (!isPatient && !pacientes.length)}>{saving ? 'Salvando…' : record ? 'Salvar alterações' : 'Salvar registro'}</button></div>
    </form>
  </Modal>;
}

export default App;
