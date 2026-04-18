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
  const { maintenances, deleteMaintenance } = useAppData()
  const { isAdmin } = useAuth()
  
  // Filtros
  const [dateStart, setDateStart]     = useState('')
  const [dateEnd, setDateEnd]         = useState('')
  const [filterCentro, setFilterCentro] = useState('Todos')
  const [filterPrior, setFilterPrior]   = useState('Todos')
  const [confirmId, setConfirmId]     = useState(null)

  const filtered = maintenances.filter(m => {
    if (dateStart && m.data < dateStart) return false
    if (dateEnd && m.data > dateEnd) return false
    if (filterCentro !== 'Todos' && m.centro !== filterCentro) return false
    if (filterPrior !== 'Todos' && m.prioridade !== filterPrior) return false
    return true
  })

  function handleConfirmDelete() { 
    deleteMaintenance(confirmId)
    setConfirmId(null) 
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Banco de Dados: Manutenção</h1>
            <p>Consulta histórica de notas e apontamentos de produtividade</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="card" style={{ marginBottom: 'var(--space-md)', padding: '12px' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Início</label>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} style={{ padding: '6px', fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Fim</label>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} style={{ padding: '6px', fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Centro</label>
            <select value={filterCentro} onChange={e => setFilterCentro(e.target.value)} style={{ padding: '6px', fontSize: 13 }}>
              <option>Todos</option>
              {CENTROS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Prioridade</label>
            <select value={filterPrior} onChange={e => setFilterPrior(e.target.value)} style={{ padding: '6px', fontSize: 13 }}>
              <option>Todos</option>
              {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateStart(''); setDateEnd(''); setFilterCentro('Todos'); setFilterPrior('Todos'); }}>
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid var(--border)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Data</th>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Turno</th>
                <th style={{ border: '1px solid var(--border)', fontSize: 12 }}>Solicitante</th>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Nº Nota</th>
                <th style={{ border: '1px solid var(--border)', fontSize: 12 }}>Descrição</th>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Centro</th>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Prioridade</th>
                {isAdmin() && <th style={{ border: '1px solid var(--border)', width: 50 }}></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin() ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Wrench size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br/>
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id}>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13 }}>{m.data}</td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13 }}>
                      <span className="badge badge-muted">{m.turno || '—'}</span>
                    </td>
                    <td style={{ border: '1px solid var(--border)', fontSize: 13, padding: '8px 12px' }}>{m.nome}</td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, fontFamily: 'monospace', color: 'var(--accent-light)' }}>
                      {m.numNota || '—'}
                    </td>
                    <td style={{ border: '1px solid var(--border)', fontSize: 13, padding: '8px 12px' }}>{m.descricao}</td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
                      <span className="badge badge-muted" style={{ fontSize: 10 }}>{m.centro}</span>
                    </td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
                      <span className={`badge ${PRIOR_COLORS[m.prioridade] || 'badge-muted'}`} style={{ fontSize: 10 }}>{m.prioridade}</span>
                    </td>
                    {isAdmin() && (
                      <td style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setConfirmId(m.id)}><Trash2 size={13}/></button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--bg-card)', fontWeight: 700 }}>
                  <td colSpan={isAdmin() ? 8 : 7} style={{ border: '1px solid var(--border)', textAlign: 'right', padding: '12px' }}>
                    TOTAL DE NOTAS: <span style={{ color: 'var(--accent-light)', fontSize: 16, marginLeft: 8 }}>{filtered.length}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {confirmId && (
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmId(null)}><X size={16}/></button>
            </div>
            <p style={{ padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Deseja excluir permanentemente esta nota?</p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
