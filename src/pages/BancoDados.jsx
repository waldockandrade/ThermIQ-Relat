import React, { useState, useMemo } from 'react'
import { useAppData } from '../context/AppDataContext'
import { 
  Database, 
  BarChart3, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  X, 
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react'

import { 
  fmt, 
  classifyVar, 
  getConversion, 
  processReportData 
} from '../utils/metrics'

export default function BancoDados() {
  const { reports, getAllVariables, dashboardConfig } = useAppData()
  const allVars = getAllVariables()
  const customKPIs = dashboardConfig.customKPIs || []

  // Filtros
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd]     = useState('')
  const [filterTurno, setFilterTurno] = useState('Todos')
  const [filterSetor, setFilterSetor] = useState('Todos')
  const [searchTerm, setSearchTerm]   = useState('')
  const [footerMode, setFooterMode]   = useState('both') // 'sum', 'avg', 'both'

  // Relatórios filtrados
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const info = r.turnoInfo || {}
      if (dateStart && info.data < dateStart) return false
      if (dateEnd && info.data > dateEnd) return false
      if (filterTurno !== 'Todos' && info.turno !== filterTurno) return false
      if (filterSetor !== 'Todos' && info.setor !== filterSetor) return false
      if (searchTerm) {
        const str = `${info.data} ${info.turno} ${info.setor} ${r.criadoPor}`.toLowerCase()
        if (!str.includes(searchTerm.toLowerCase())) return false
      }
      return true
    }).sort((a,b) => b.turnoInfo.data.localeCompare(a.turnoInfo.data))
  }, [reports, dateStart, dateEnd, filterTurno, filterSetor, searchTerm])

  // Lista de Turnos e Setores únicos para os filtros
  const turnosDisponiveis = useMemo(() => ['Todos', ...new Set(reports.map(r => r.turnoInfo.turno))], [reports])
  const setoresDisponiveis = useMemo(() => ['Todos', ...new Set(reports.map(r => r.turnoInfo.setor))], [reports])

  // Colunas: Variaveis e KPIs
  const tableColumns = useMemo(() => {
    const varsMap = {}
    allVars.forEach(v => { varsMap[v.id] = v })

    return [
      ...allVars.map(v => ({
        id: v.id,
        label: v.name,
        unit: v.unit,
        type: 'var',
        isQuantitative: classifyVar(v)
      })),
      ...customKPIs.map(k => ({
        id: k.id,
        label: k.label,
        unit: k.unit,
        type: 'kpi',
        config: k
      }))
    ]
  }, [allVars, customKPIs])

  // Cálculo de valores por linha (relatório)
  const rows = useMemo(() => {
    return filteredReports.map(rep => processReportData(rep, allVars, customKPIs))
  }, [filteredReports, allVars, customKPIs])

  // Cálculo de Totais / Médias no rodapé
  const footerStats = useMemo(() => {
    const stats = {}
    tableColumns.forEach(col => {
      const vals = rows.map(r => r.vals[col.id]).filter(v => v !== null && v !== undefined)
      if (vals.length === 0) {
        stats[col.id] = { sum: null, avg: null }
        return
      }
      const sum = vals.reduce((a, b) => a + b, 0)
      stats[col.id] = { sum, avg: sum / vals.length }
    })
    return stats
  }, [rows, tableColumns])

  function handleExport() {
    // CSV basic export
    const headers = ['Data', 'Turno', 'Setor', 'Operador', ...tableColumns.map(c => `${c.label} (${c.unit})`)]
    const lines = rows.map(r => [
      r.info.data, r.info.turno, r.info.setor, r.criadoPor,
      ...tableColumns.map(c => r.vals[c.id] || '')
    ])
    const csv = [headers, ...lines].map(l => l.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'thermiq_banco_dados_operacional.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url) // BUG-03: libera memória após download
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Banco de Dados Operacional</h1>
            <p>Histórico completo de variáveis quantitativas, qualitativas e KPIs</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16}/> Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 16 }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, width: 150 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Início</label>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, width: 150 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Fim</label>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, width: 120 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Turno</label>
            <select value={filterTurno} onChange={e => setFilterTurno(e.target.value)}>
              {turnosDisponiveis.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, width: 140 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Setor</label>
            <select value={filterSetor} onChange={e => setFilterSetor(e.target.value)}>
              {setoresDisponiveis.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Busca Livre</label>
            <div style={{ position: 'relative' }}>
              <input 
                placeholder="Data, operador, observações..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Visualizar no Rodapé</label>
            <div className="btn-group" style={{ display: 'flex', gap: 2, background: 'var(--bg-surface)', padding: 2, borderRadius: 6, border: '1px solid var(--border)' }}>
              {[
                { id: 'sum', label: 'Soma' },
                { id: 'avg', label: 'Média' },
                { id: 'both', label: 'Ambos' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setFooterMode(m.id)}
                  style={{
                    flex: 1, padding: '4px 8px', fontSize: 10, border: 'none', borderRadius: 4, cursor: 'pointer',
                    background: footerMode === m.id ? 'var(--accent)' : 'transparent',
                    color: footerMode === m.id ? 'white' : 'var(--text-muted)',
                    fontWeight: 700, transition: 'all 0.2s'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateStart(''); setDateEnd(''); setFilterTurno('Todos'); setFilterSetor('Todos'); setSearchTerm(''); setFooterMode('both'); }}>
            <X size={14}/> Limpar
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {/* Cabeçalho Fixo (Info do Turno) */}
                {['Data', 'Turno', 'Setor', 'Operador'].map((h, i) => (
                  <th key={h} style={{ 
                    position: 'sticky', left: i * 100, zIndex: 12,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    fontSize: 11, padding: '10px 12px', textAlign: 'center', minWidth: 100
                  }}>
                    {h}
                  </th>
                ))}

                {/* Variáveis e KPIs */}
                {tableColumns.map(col => (
                  <th key={col.id} style={{ 
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    fontSize: 10, padding: '10px 8px', textAlign: 'center', minWidth: 110,
                    color: col.type === 'kpi' ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: 700, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.2
                  }}>
                    {col.label}<br/>
                    <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-muted)' }}>{col.unit}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length + 4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Database size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>Nenhum dado encontrado para os critérios selecionados.</p>
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'white', border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{row.info.data}</td>
                    <td style={{ position: 'sticky', left: 100, zIndex: 1, background: 'white', border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}><span className="badge badge-muted">{row.info.turno}</span></td>
                    <td style={{ position: 'sticky', left: 200, zIndex: 1, background: 'white', border: '1px solid var(--border)', textAlign: 'center', fontSize: 12 }}>{row.info.setor}</td>
                    <td style={{ position: 'sticky', left: 300, zIndex: 1, background: 'white', border: '1px solid var(--border)', textAlign: 'left', fontSize: 12, paddingLeft: 12 }}>{row.criadoPor}</td>

                    {tableColumns.map(col => (
                      <td key={col.id} style={{ 
                        border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, 
                        fontFamily: 'monospace', color: col.type === 'kpi' ? 'var(--accent-dark)' : 'var(--text-secondary)'
                      }}>
                        {fmt(row.vals[col.id], col.type === 'kpi' ? 3 : 1)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, background: 'var(--bg-card)' }}>
                {/* Linha de Totais (Soma) */}
                {(footerMode === 'sum' || footerMode === 'both') && (
                  <tr style={{ background: 'var(--bg-surface)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ border: '1px solid var(--border)', textAlign: 'right', padding: '10px 16px', fontSize: 11 }}>
                      SOMA TOTAL DO PERÍODO:
                    </td>
                    {tableColumns.map(col => (
                      <td key={`sum-${col.id}`} style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--leaf-dark)' }}>
                        {fmt(footerStats[col.id].sum, col.type === 'kpi' ? 3 : 1)}
                      </td>
                    ))}
                  </tr>
                )}
                {/* Linha de Médias */}
                {(footerMode === 'avg' || footerMode === 'both') && (
                  <tr style={{ background: 'var(--bg-card)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ border: '1px solid var(--border)', textAlign: 'right', padding: '10px 16px', fontSize: 11 }}>
                      MÉDIA DO PERÍODO:
                    </td>
                    {tableColumns.map(col => (
                      <td key={`avg-${col.id}`} style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: col.type === 'kpi' ? 'var(--accent-dark)' : 'var(--text-primary)' }}>
                        {fmt(footerStats[col.id].avg, col.type === 'kpi' ? 3 : 1)}
                      </td>
                    ))}
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2 }} /> KPI Configurado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, background: 'var(--leaf)', borderRadius: 2 }} /> Variável Quantitativa (Delta)
        </div>
      </div>
    </div>
  )
}
