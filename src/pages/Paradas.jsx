import React, { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, X, Check, Clock } from 'lucide-react'

const TIPOS = [
  'Programada', 'Elétrica', 'Mecânica', 'Operacional', 'Automação',
  'Processo', 'Qualidade', 'Utilidade', 'Perda por Queda de Velocidade',
]

const TIPO_COLORS = {
  'Programada': 'badge-info',
  'Elétrica': 'badge-warning',
  'Mecânica': 'badge-danger',
  'Operacional': 'badge-accent',
  'Automação': 'badge-info',
  'Processo': 'badge-warning',
  'Qualidade': 'badge-success',
  'Utilidade': 'badge-muted',
  'Perda por Queda de Velocidade': 'badge-danger',
}

function calcTempo(inicio, fim) {
  if (!inicio || !fim) return '—'
  const [ih, im] = inicio.split(':').map(Number)
  const [fh, fm] = fim.split(':').map(Number)
  let diff = (fh * 60 + fm) - (ih * 60 + im)
  if (diff < 0) diff += 24 * 60
  return `${diff} min`
}

function today() { return new Date().toISOString().slice(0,10) }
function nowTime() { return new Date().toTimeString().slice(0,5) }

const EMPTY = { data: today(), inicio: nowTime(), fim: '', tipo: 'Programada', descricao: '' }

export default function Paradas() {
  const { downtimes, addDowntime, updateDowntime, deleteDowntime } = useAppData()
  const { isAdmin } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [confirmId, setConfirmId] = useState(null) // A-01: id aguardando confirmação de exclusão

  function openAdd() { setForm(EMPTY); setEditId(null); setShowModal(true) }
  function openEdit(dt) {
    setForm({ data: dt.data, inicio: dt.inicio, fim: dt.fim, tipo: dt.tipo, descricao: dt.descricao })
    setEditId(dt.id)
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    if (editId) updateDowntime(editId, form)
    else addDowntime(form)
    setShowModal(false)
  }

  // A-01: exclusão com confirmação
  function handleDeleteRequest(id) { setConfirmId(id) }
  function handleConfirmDelete() { deleteDowntime(confirmId); setConfirmId(null) }

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Paradas de Processo</h1>
            <p>Registro de paradas operacionais com tempo e classificação</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Nova Parada</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Tempo</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th style={{ width:100 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {downtimes.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state"><Clock size={36}/><h4>Nenhuma parada registrada</h4><p>Clique em "Nova Parada" para adicionar.</p></div>
                </td></tr>
              )}
              {downtimes.map(dt => (
                <tr key={dt.id}>
                  <td>{dt.data}</td>
                  <td>{dt.inicio}</td>
                  <td>{dt.fim || <span className="badge badge-info" style={{fontSize:10}}>Em andamento</span>}</td>
                  <td>
                    {dt.fim
                      ? <span className="badge badge-warning"><Clock size={11}/> {calcTempo(dt.inicio, dt.fim)}</span>
                      : <span className="badge badge-info" style={{fontSize:10}}>Em andamento</span>}
                  </td>
                  <td><span className={`badge ${TIPO_COLORS[dt.tipo] || 'badge-muted'}`}>{dt.tipo}</span></td>
                  <td style={{ maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dt.descricao}</td>
                  <td>
                    {isAdmin() && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => openEdit(dt)}><Pencil size={13}/></button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeleteRequest(dt.id)}><Trash2 size={13}/></button>
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
              <h3>{editId ? 'Editar Parada' : 'Nova Parada de Processo'}</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="par-data">Data</label>
                  <input id="par-data" type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="par-inicio">Início</label>
                  <input id="par-inicio" type="time" value={form.inicio} onChange={e => set('inicio', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="par-fim">Fim</label>
                  <input id="par-fim" type="time" value={form.fim} onChange={e => set('fim', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop:'var(--space-md)' }}>
                <label htmlFor="par-tipo">Tipo de Parada</label>
                <select id="par-tipo" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginTop:'var(--space-md)' }}>
                <label htmlFor="par-desc">Descrição <span style={{ color:'var(--text-muted)' }}>(máx. 100 caracteres)</span></label>
                <input
                  id="par-desc"
                  type="text"
                  maxLength={100}
                  value={form.descricao}
                  onChange={e => set('descricao', e.target.value)}
                  placeholder="Descreva brevemente a ocorrência"
                />
              </div>
              {form.inicio && form.fim && (
                <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:8 }}>
                  ⏱ Tempo calculado: <strong style={{ color:'var(--warning)' }}>{calcTempo(form.inicio, form.fim)}</strong>
                </p>
              )}
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
              Tem certeza que deseja excluir esta parada? Esta ação é <strong>irreversível</strong>.
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
