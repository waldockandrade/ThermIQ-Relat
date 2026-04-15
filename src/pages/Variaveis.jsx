import React, { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Layers, X, Check, Settings2, Target, BarChart2 } from 'lucide-react'

const UNITS = ['°C', 'kgf/cm²', 'm³/h', 't/h', 'kWh', 'MW', 'A', 'V', 'µS/cm', 'pH', 'bar', '%', 'ppm', 'Nm³/h', 'kg/h', '-']

function CategoryRow({ cat, isAdmin }) {
  const { updateCategory, deleteCategory, addVariable, updateVariable, deleteVariable } = useAppData()
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [catName, setCatName] = useState(cat.name)
  const [newVar, setNewVar]   = useState(null)   // {name:'', unit:'°C'}
  const [editVar, setEditVar] = useState(null)   // varId being edited
  // A-02: estado controlado para edição de variáveis
  const [editVarForm, setEditVarForm] = useState({ name: '', unit: '' })

  function saveCategory() {
    if (catName.trim()) updateCategory(cat.id, catName.trim())
    setEditing(false)
  }

  function startAddVar() {
    setNewVar({ name: '', unit: '°C' })
    setOpen(true)
  }

  function saveNewVar() {
    if (newVar.name.trim()) addVariable(cat.id, newVar)
    setNewVar(null)
  }

  // A-02: inicializa estado ao entrar em modo de edição
  function startEditVar(v) {
    setEditVarForm({ name: v.name, unit: v.unit })
    setEditVar(v.id)
  }

  function saveEditVar(v) {
    if (editVarForm.name.trim()) {
      updateVariable(cat.id, v.id, { name: editVarForm.name.trim(), unit: editVarForm.unit })
    }
    setEditVar(null)
  }

  return (
    <div className="accordion">
      <div className="accordion-header" onClick={() => !editing && setOpen(v => !v)}>
        {editing ? (
          <input
            value={catName}
            onChange={e => setCatName(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.key === 'Enter' && saveCategory()}
            autoFocus
            style={{ width: '60%' }}
          />
        ) : (
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            <Layers size={15} style={{ display:'inline', marginRight:8, color:'var(--accent)' }} />
            {cat.name}
            <span className="badge badge-muted" style={{ marginLeft:10 }}>{cat.variables.length} variáveis</span>
          </span>
        )}

        <div style={{ display:'flex', gap:8, alignItems:'center' }} onClick={e => e.stopPropagation()}>
          {isAdmin && (
            <>
              {editing ? (
                <>
                  <button className="btn btn-sm btn-success" onClick={saveCategory}><Check size={13}/></button>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(false); setCatName(cat.name) }}><X size={13}/></button>
                </>
              ) : (
                <>
                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setEditing(true)}><Pencil size={13}/></button>
                  <button className="btn btn-sm btn-danger btn-icon" onClick={() => deleteCategory(cat.id)}><Trash2 size={13}/></button>
                </>
              )}
            </>
          )}
          {open ? <ChevronUp size={16} style={{ color:'var(--text-muted)' }}/> : <ChevronDown size={16} style={{ color:'var(--text-muted)' }}/>}
        </div>
      </div>

      {open && (
        <div className="accordion-body">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Variável</th>
                  <th>Unidade</th>
                  {isAdmin && <th style={{ width:100 }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {cat.variables.map(v => (
                  <tr key={v.id}>
                    <td>
                      {editVar === v.id ? (
                        // A-02: inputs controlados por estado React
                        <input
                          value={editVarForm.name}
                          onChange={e => setEditVarForm(p => ({ ...p, name: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveEditVar(v)}
                          autoFocus
                          style={{ width:'100%' }}
                        />
                      ) : v.name}
                    </td>
                    <td>
                      {editVar === v.id ? (
                        <select
                          value={editVarForm.unit}
                          onChange={e => setEditVarForm(p => ({ ...p, unit: e.target.value }))}
                          style={{ width:'100%' }}
                        >
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      ) : (
                        <span className="badge badge-muted">{v.unit}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          {editVar === v.id ? (
                            <>
                              <button className="btn btn-sm btn-success btn-icon" onClick={() => saveEditVar(v)}><Check size={13}/></button>
                              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setEditVar(null)}><X size={13}/></button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => startEditVar(v)}><Pencil size={13}/></button>
                              <button className="btn btn-sm btn-danger btn-icon" onClick={() => deleteVariable(cat.id, v.id)}><Trash2 size={13}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {newVar && (
                  <tr>
                    <td>
                      <input
                        placeholder="Nome da variável"
                        value={newVar.name}
                        onChange={e => setNewVar(p => ({ ...p, name: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && saveNewVar()}
                        autoFocus
                      />
                    </td>
                    <td>
                      <select value={newVar.unit} onChange={e => setNewVar(p => ({ ...p, unit: e.target.value }))}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-success btn-icon" onClick={saveNewVar}><Check size={13}/></button>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setNewVar(null)}><X size={13}/></button>
                      </div>
                    </td>
                  </tr>
                )}

                {cat.variables.length === 0 && !newVar && (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state" style={{ padding:'var(--space-lg)' }}>
                        <p>Nenhuma variável cadastrada.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isAdmin && !newVar && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop:12 }} onClick={startAddVar}>
              <Plus size={14}/> Adicionar variável
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Variaveis() {
  const { categories, addCategory, dashboardConfig, updateDashboardConfig } = useAppData()
  const { isAdmin }                 = useAuth()
  const [newCat, setNewCat]         = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [cfgOpen, setCfgOpen]       = useState(false)

  function handleAddCat() {
    if (newCatName.trim()) {
      addCategory(newCatName.trim())
      setNewCatName('')
      setNewCat(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Variáveis de Processo</h1>
            <p>Categorias e variáveis monitoradas nas operações das caldeiras</p>
          </div>
          {isAdmin() && (
            <button className="btn btn-primary" onClick={() => setNewCat(true)}>
              <Plus size={16}/> Nova Categoria
            </button>
          )}
        </div>
      </div>

      {newCat && (
        <div className="card" style={{ marginBottom: 'var(--space-md)', display:'flex', gap:'var(--space-sm)', alignItems:'center' }}>
          <input
            placeholder="Nome da nova categoria"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCat()}
            autoFocus
            style={{ flex:1 }}
          />
          <button className="btn btn-primary" onClick={handleAddCat}><Check size={15}/> Criar</button>
          <button className="btn btn-ghost" onClick={() => { setNewCat(false); setNewCatName('') }}><X size={15}/></button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Layers size={40} />
            <h4>Nenhuma categoria</h4>
            <p>Crie uma categoria para começar a cadastrar variáveis de processo.</p>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-sm)' }}>
          {categories.map(cat => (
            <CategoryRow key={cat.id} cat={cat} isAdmin={isAdmin()} />
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────
          CONFIGURAÇÕES DO DASHBOARD
      ───────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop:'var(--space-xl)' }}>
        {/* Header clicavel */}
        <div
          className="card-header"
          onClick={() => setCfgOpen(v => !v)}
          style={{ cursor:'pointer', userSelect:'none', paddingBottom: cfgOpen ? undefined : 0, borderBottom: cfgOpen ? undefined : 'none' }}
        >
          <span className="card-title">
            <Settings2 size={17} style={{ color:'var(--accent)' }} />
            Configurações do Dashboard
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>Referenciais e metas dos KPIs</span>
            {cfgOpen
              ? <ChevronUp size={16} style={{ color:'var(--text-muted)' }}/>
              : <ChevronDown size={16} style={{ color:'var(--text-muted)' }}/>}
          </div>
        </div>

        {cfgOpen && (
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-xl)', paddingTop:'var(--space-lg)' }}>

            {/* ---- Referenciais de Variáveis Quantitativas ---- */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-md)' }}>
                <BarChart2 size={15} style={{ color:'var(--accent)' }}/>
                <span style={{ fontWeight:700, fontSize:'var(--text-sm)', color:'var(--text-primary)' }}>Referenciais das Variáveis Quantitativas</span>
              </div>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginBottom:'var(--space-md)' }}>
                Define o valor máximo de referência para a barra de progresso dos AccumCards no Dashboard.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'var(--space-md)' }}>
                {[
                  { key:'agua',            label:'Água de Alimentação', unit:'ton', color:'#3b82f6' },
                  { key:'vapor',           label:'Vapor Gerado',          unit:'ton', color:'#22c55e' },
                  { key:'energiaGerada',   label:'Energia Gerada',         unit:'MW',  color:'#f97316' },
                  { key:'energiaConsumida',label:'Energia Consumida',      unit:'kWh', color:'#a855f7' },
                  { key:'combustivel',     label:'Combustível (Cavaco)',  unit:'m³',  color:'#eab308' },
                ].map(({ key, label, unit, color }) => (
                  <div key={key} style={{
                    background:'var(--bg-surface)', border:`1px solid var(--border)`,
                    borderRadius:'var(--radius-md)', padding:'var(--space-md)',
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
                      {label}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input
                        type="number"
                        min={1}
                        step={100}
                        value={dashboardConfig.quantMaxes[key] ?? ''}
                        onChange={e => updateDashboardConfig('quantMaxes', key, parseFloat(e.target.value) || 0)}
                        disabled={!isAdmin()}
                        style={{ flex:1, marginBottom:0 }}
                      />
                      <span style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', minWidth:32 }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Metas dos KPIs ---- */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-md)' }}>
                <Target size={15} style={{ color:'var(--accent)' }}/>
                <span style={{ fontWeight:700, fontSize:'var(--text-sm)', color:'var(--text-primary)' }}>Metas dos Indicadores de Eficiência (KPIs)</span>
              </div>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginBottom:'var(--space-md)' }}>
                Define o valor alvo de cada KPI. O Dashboard usará esses valores como linha de meta nos gráficos e velocimêtros.
                Deixe em branco para não exibir meta.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'var(--space-md)' }}>
                {[
                  { key:'kwhGer',      label:'kW Gerado / ton Vapor Produzido (MW\u00d71000)',  unit:'kW/ton',  color:'#f97316' },
                  { key:'kwhCon',      label:'kWh Consumido / ton Vapor Produzido',       unit:'kWh/ton', color:'#a855f7' },
                  { key:'vaporCavaco', label:'kg Vapor Produzido / m\u00b3 Cavaco (ton\u00d71000)', unit:'kg/m\u00b3',  color:'#22c55e' },
                ].map(({ key, label, unit, color }) => (
                  <div key={key} style={{
                    background:'var(--bg-surface)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-md)', padding:'var(--space-md)',
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
                      {label}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={dashboardConfig.kpiMetas[key] ?? ''}
                        onChange={e => updateDashboardConfig('kpiMetas', key, e.target.value === '' ? null : parseFloat(e.target.value))}
                        disabled={!isAdmin()}
                        placeholder="Sem meta"
                        style={{ flex:1, marginBottom:0 }}
                      />
                      <span style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', minWidth:36 }}>{unit}</span>
                    </div>
                    {dashboardConfig.kpiMetas[key] !== null && (
                      <div style={{ fontSize:'var(--text-xs)', color: color, marginTop:6, fontWeight:600 }}>
                        Meta: {dashboardConfig.kpiMetas[key]} {unit}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {!isAdmin() && (
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', fontStyle:'italic' }}>
                🔒 Apenas administradores podem alterar as configurações do dashboard.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
