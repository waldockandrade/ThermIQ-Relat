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
  const { downtimes, deleteDowntime } = useAppData()
  const { isAdmin } = useAuth()
  
  // Filtros
  const [filterType, setFilterType] = useState('Todos')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd]     = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const filtered = downtimes.filter(dt => {
    if (filterType !== 'Todos' && dt.tipo !== filterType) return false
    if (dateStart && dt.data < dateStart) return false
    if (dateEnd && dt.data > dateEnd) return false
    return true
  })

  const totalMinutes = filtered.reduce((acc, dt) => {
    if (!dt.inicio || !dt.fim) return acc
    const [ih, im] = dt.inicio.split(':').map(Number)
    const [fh, fm] = dt.fim.split(':').map(Number)
    let diff = (fh * 60 + fm) - (ih * 60 + im)
    if (diff < 0) diff += 24 * 60
    return acc + diff
  }, 0)

  function handleConfirmDelete() { 
    deleteDowntime(confirmId)
    setConfirmId(null) 
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Banco de Dados: Paradas</h1>
            <p>Análise histórica e somatório de indisponibilidade</p>
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
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Tipo</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px', fontSize: 13 }}>
              <option>Todos</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateStart(''); setDateEnd(''); setFilterType('Todos'); }}>
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
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Início</th>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Fim</th>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Duração</th>
                <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>Tipo</th>
                <th style={{ border: '1px solid var(--border)', fontSize: 12 }}>Descrição</th>
                {isAdmin() && <th style={{ border: '1px solid var(--border)', width: 50 }}></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin() ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Clock size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br/>
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(dt => (
                  <tr key={dt.id}>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13 }}>{dt.data}</td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13 }}>
                      <span className="badge badge-muted">{dt.turno || '—'}</span>
                    </td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, fontFamily: 'monospace' }}>{dt.inicio}</td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, fontFamily: 'monospace' }}>{dt.fim || '...'}</td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 600 }}>
                      {dt.fim ? calcTempo(dt.inicio, dt.fim) : <span className="text-info">Ativo</span>}
                    </td>
                    <td style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
                      <span className={`badge ${TIPO_COLORS[dt.tipo] || 'badge-muted'}`} style={{ fontSize: 10 }}>{dt.tipo}</span>
                    </td>
                    <td style={{ border: '1px solid var(--border)', fontSize: 13, padding: '8px 12px' }}>{dt.descricao}</td>
                    {isAdmin() && (
                      <td style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setConfirmId(dt.id)}><Trash2 size={13}/></button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--bg-card)', fontWeight: 700 }}>
                  <td colSpan={4} style={{ border: '1px solid var(--border)', textAlign: 'right', padding: '12px' }}>
                    TOTAIS ({filtered.length} registros):
                  </td>
                  <td style={{ border: '1px solid var(--border)', textAlign: 'center', color: 'var(--danger)', fontSize: 15 }}>
                    {totalMinutes} min
                  </td>
                  <td style={{ border: '1px solid var(--border)' }}></td>
                  <td style={{ border: '1px solid var(--border)' }}></td>
                  {isAdmin() && <td style={{ border: '1px solid var(--border)' }}></td>}
                </tr>
                <tr style={{ background: 'var(--bg-surface)', fontWeight: 600, fontSize: 11 }}>
                  <td colSpan={4} style={{ border: '1px solid var(--border)', textAlign: 'right', padding: '4px 12px' }}>Média por parada:</td>
                  <td style={{ border: '1px solid var(--border)', textAlign: 'center' }}>{(totalMinutes / filtered.length).toFixed(1)} min</td>
                  <td colSpan={isAdmin() ? 3 : 2} style={{ border: '1px solid var(--border)' }}></td>
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
            <p style={{ padding: 'var(--space-md)', color: 'var(--text-secondary)' }}>Deseja excluir permanentemente este registro?</p>
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
