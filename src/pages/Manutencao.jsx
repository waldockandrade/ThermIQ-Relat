import React, { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, X, Check, Wrench } from 'lucide-react'

const TURNOS     = ['Turno A', 'Turno B', 'Turno C', 'Turno D'] // B-06: Turno D adicionado para consistência com NovoRelatorio
const CENTROS    = ['MEC-GER', 'ELE-GER', 'CALD-GER', 'MANT-UTL', 'MEC-LUBR']
const PRIORIDADES = ['Emergencial', 'Alta', 'Média', 'Baixa']

const PRIOR_COLORS = {
  'Emergencial': 'badge-danger',
  'Alta':        'badge-warning',
  'Média':       'badge-info',
  'Baixa':       'badge-success',
}

function today() { return new Date().toISOString().slice(0,10) }
const EMPTY = { data: today(), turno: 'Turno A', nome: '', numNota: '', descricao: '', centro: 'MEC-GER', prioridade: 'Média' }

export default function Manutencao() {
  const { maintenances, addMaintenance, updateMaintenance, deleteMaintenance } = useAppData()
  const { isAdmin } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [confirmId, setConfirmId] = useState(null) // A-01: id aguardando confirmação de exclusão

  function openAdd() { setForm(EMPTY); setEditId(null); setShowModal(true) }
  function openEdit(m) {
    setForm({ data: m.data, turno: m.turno, nome: m.nome, numNota: m.numNota, descricao: m.descricao, centro: m.centro, prioridade: m.prioridade })
    setEditId(m.id)
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    if (editId) updateMaintenance(editId, form)
    else addMaintenance(form)
    setShowModal(false)
  }

  // A-01: exclusão com confirmação
  function handleDeleteRequest(id) { setConfirmId(id) }
  function handleConfirmDelete() { deleteMaintenance(confirmId); setConfirmId(null) }

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Notas de Manutenção</h1>
            <p>Registro de solicitações e anotações de manutenção por turno</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Nova Nota</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Turno</th>
                <th>Solicitante</th>
                <th>N. da Nota</th>
                <th>Descrição</th>
                <th>Centro</th>
                <th>Prioridade</th>
                <th style={{ width:90 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state"><Wrench size={36}/><h4>Nenhuma nota registrada</h4><p>Clique em "Nova Nota" para adicionar.</p></div>
                </td></tr>
              )}
              {maintenances.map(m => (
                <tr key={m.id}>
                  <td>{m.data}</td>
                  <td><span className="badge badge-muted">{m.turno}</span></td>
                  <td>{m.nome}</td>
                  <td style={{ fontFamily:'monospace', color:'var(--accent-light)' }}>{m.numNota || '—'}</td>
                  <td style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.descricao}</td>
                  <td><span className="badge badge-muted">{m.centro}</span></td>
                  <td><span className={`badge ${PRIOR_COLORS[m.prioridade] || 'badge-muted'}`}>{m.prioridade}</span></td>
                  <td>
                    {isAdmin() && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => openEdit(m)}><Pencil size={13}/></button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeleteRequest(m.id)}><Trash2 size={13}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar Nota' : 'Nova Nota de Manutenção'}</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mnt-data">Data</label>
                  <input id="mnt-data" type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="mnt-turno">Turno</label>
                  <select id="mnt-turno" value={form.turno} onChange={e => set('turno', e.target.value)}>
                    {TURNOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ marginTop:'var(--space-md)' }}>
                <div className="form-group">
                  <label htmlFor="mnt-nome">Solicitante</label>
                  <input id="mnt-nome" type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="form-group">
                  <label htmlFor="mnt-nota">N. da Nota</label>
                  <input id="mnt-nota" type="text" value={form.numNota} onChange={e => set('numNota', e.target.value)} placeholder="Ex: 12345" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop:'var(--space-md)' }}>
                <label htmlFor="mnt-desc">Descrição</label>
                <textarea id="mnt-desc" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descreva o problema ou serviço solicitado" style={{ minHeight:80 }} />
              </div>
              <div className="form-row" style={{ marginTop:'var(--space-md)' }}>
                <div className="form-group">
                  <label htmlFor="mnt-centro">Centro Responsável</label>
                  <select id="mnt-centro" value={form.centro} onChange={e => set('centro', e.target.value)}>
                    {CENTROS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mnt-prior">Prioridade</label>
                  <select id="mnt-prior" value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
                    {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary"><Check size={15}/> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A-01: Modal de confirmação de exclusão */}
      {confirmId && (
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmId(null)}><X size={16}/></button>
            </div>
            <p style={{ padding:'var(--space-md)', color:'var(--text-secondary)', fontSize:'var(--text-sm)' }}>
              Tem certeza que deseja excluir esta nota de manutenção? Esta ação é <strong>irreversível</strong>.
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}><Trash2 size={14}/> Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
