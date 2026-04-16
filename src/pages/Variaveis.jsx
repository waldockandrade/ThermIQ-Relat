import React, { useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Layers, X, Check, Settings2, Target, BarChart2, Droplets, Wind, Zap, Flame, Activity, TrendingUp, Box, Battery, Cpu, Filter, Sun, Thermometer, Info } from 'lucide-react'

const ICONS = {
  Droplets, Wind, Zap, Flame, Activity, TrendingUp, Box, Battery, Cpu, Filter, Sun, Thermometer, Target, Info
}

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
  const { categories, addCategory, dashboardConfig, updateDashboardConfig, getAllVariables } = useAppData()
  const { isAdmin }                 = useAuth()
  const [newCat, setNewCat]         = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [cfgOpen, setCfgOpen]       = useState(false)

  const allVars = getAllVariables()

  function updateQuant(idx, field, value) {
     const arr = [...(dashboardConfig.customQuantitatives || [])]
     arr[idx] = { ...arr[idx], [field]: value }
     updateDashboardConfig('customQuantitatives', null, arr)
  }

  function addQuant() {
     const arr = [...(dashboardConfig.customQuantitatives || [])]
     arr.push({ id: `q-${Date.now()}`, varId: allVars[0]?.id || '', label: 'Novo Indicador', max: 100, color: '#3b82f6', iconName: 'Box', factor: 1, unitOverride: '' })
     updateDashboardConfig('customQuantitatives', null, arr)
  }

  function rmQuant(idx) {
     const arr = [...(dashboardConfig.customQuantitatives || [])]
     arr.splice(idx, 1)
     updateDashboardConfig('customQuantitatives', null, arr)
  }

  function updateKpi(idx, field, value) {
     const arr = [...(dashboardConfig.customKPIs || [])]
     arr[idx] = { ...arr[idx], [field]: value }
     updateDashboardConfig('customKPIs', null, arr)
  }

  function addKpi() {
     const arr = [...(dashboardConfig.customKPIs || [])]
     arr.push({ id: `k-${Date.now()}`, label: 'Novo KPI', numVarId: allVars[0]?.id || '', numFactor: 1, denVarId: allVars[0]?.id || '', denFactor: 1, unit: 'un', meta: null, inverse: false, color: '#22c55e' })
     updateDashboardConfig('customKPIs', null, arr)
  }

  function rmKpi(idx) {
     const arr = [...(dashboardConfig.customKPIs || [])]
     arr.splice(idx, 1)
     updateDashboardConfig('customKPIs', null, arr)
  }

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

            {/* ---- Variáveis Quantitativas (Acumuladas) ---- */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-md)' }}>
                <BarChart2 size={15} style={{ color:'var(--accent)' }}/>
                <span style={{ fontWeight:700, fontSize:'var(--text-sm)', color:'var(--text-primary)' }}>Indicadores Quantitativos (Evolução Acumulada)</span>
              </div>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginBottom:'var(--space-md)' }}>
                Selecione quais variáveis sumarizar e exibir no topo do Dashboard. Especifique referências máximas, cores e customizações de unidade.
              </p>
              
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-md)' }}>
                {(dashboardConfig.customQuantitatives || []).map((q, i) => (
                  <div key={q.id} style={{
                    background:'var(--bg-surface)', border:`1px solid var(--border)`,
                    borderRadius:'var(--radius-md)', padding:'var(--space-md)',
                    borderLeft: `3px solid ${q.color}`, position:'relative'
                  }}>
                    {isAdmin() && (
                       <button onClick={() => rmQuant(i)} className="btn btn-sm btn-ghost btn-icon" style={{ position:'absolute', top:8, right:8, color:'var(--danger)', padding:4 }}>
                         <Trash2 size={14} />
                       </button>
                    )}
                    
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12, marginTop:8, paddingRight:32 }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <input value={q.label} onChange={e => updateQuant(i, 'label', e.target.value)} disabled={!isAdmin()} placeholder="Tìtulo do Indicador" style={{ flex:1, marginBottom:0 }} />
                        <select value={q.iconName} onChange={e => updateQuant(i, 'iconName', e.target.value)} disabled={!isAdmin()} style={{ width:120, marginBottom:0 }}>
                          {Object.keys(ICONS).map(ic => <option key={ic} value={ic}>Ícone: {ic}</option>)}
                        </select>
                        <input type="color" value={q.color} onChange={e => updateQuant(i, 'color', e.target.value)} disabled={!isAdmin()} style={{ width:40, padding:0, height:36, cursor:'pointer' }} />
                      </div>
                      
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:10, color:'var(--text-muted)', width:50 }}>Variável:</span>
                        <select value={q.varId} onChange={e => updateQuant(i, 'varId', e.target.value)} disabled={!isAdmin()} style={{ flex:1, marginBottom:0 }}>
                          {allVars.map(v => <option key={v.id} value={v.id}>{v.name} ({v.unit})</option>)}
                        </select>
                      </div>

                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:10, color:'var(--text-muted)', width:50 }}>Progress.%:</span>
                        <input type="number" step="any" value={q.max ?? ''} onChange={e => updateQuant(i, 'max', parseFloat(e.target.value)||0)} disabled={!isAdmin()} placeholder="Referência/Meta máx" style={{ flex:1, marginBottom:0 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {isAdmin() && (
                <button className="btn btn-ghost btn-sm" onClick={addQuant} style={{ marginTop:16 }}>
                  <Plus size={14}/> Adicionar Indicador Quantitativo
                </button>
              )}
            </div>

            {/* ---- Metas dos KPIs ---- */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'var(--space-md)' }}>
                <Target size={15} style={{ color:'var(--accent)' }}/>
                <span style={{ fontWeight:700, fontSize:'var(--text-sm)', color:'var(--text-primary)' }}>Métricas de Eficiência (KPIs customizados)</span>
              </div>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginBottom:'var(--space-md)' }}>
                Construa fórmulas dinâmicas dividindo duas variáveis. O Dashboard calculará a evolução a cada 15 minutos.
              </p>
              
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-md)' }}>
                {(dashboardConfig.customKPIs || []).map((k, i) => (
                  <div key={k.id} style={{
                    background:'var(--bg-surface)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-md)', padding:'var(--space-md)',
                    borderLeft: `3px solid ${k.color}`, position:'relative'
                  }}>
                    {isAdmin() && (
                       <button onClick={() => rmKpi(i)} className="btn btn-sm btn-ghost btn-icon" style={{ position:'absolute', top:8, right:8, color:'var(--danger)', padding:4 }}>
                         <Trash2 size={14} />
                       </button>
                    )}
                    
                    <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8, paddingRight:32 }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <input value={k.label} onChange={e => updateKpi(i, 'label', e.target.value)} disabled={!isAdmin()} placeholder="Nome do KPI" style={{ flex:1, marginBottom:0 }} />
                        <input type="color" value={k.color} onChange={e => updateKpi(i, 'color', e.target.value)} disabled={!isAdmin()} style={{ width:40, padding:0, height:36, cursor:'pointer' }} />
                      </div>

                      <div style={{ background:'var(--bg-body)', padding:12, borderRadius:'var(--radius-md)', border:'1px dashed var(--border)' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:8 }}>
                          {/* Num */}
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ fontSize:10, color:'var(--text-primary)', width:35, fontWeight:600 }}>Num:</span>
                            <select value={k.numVarId} onChange={e => updateKpi(i, 'numVarId', e.target.value)} disabled={!isAdmin()} style={{ flex:1, marginBottom:0 }}>
                              {allVars.map(v => <option key={v.id} value={v.id}>{v.name} ({v.unit})</option>)}
                            </select>
                            <span style={{ fontSize:10, color:'var(--text-muted)' }}>&times;</span>
                            <input type="number" step="any" value={k.numFactor ?? 1} onChange={e => updateKpi(i, 'numFactor', parseFloat(e.target.value)||1)} disabled={!isAdmin()} style={{ width:70, marginBottom:0 }} />
                          </div>
                          {/* Den */}
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ fontSize:10, color:'var(--text-primary)', width:35, fontWeight:600 }}>Den:</span>
                            <select value={k.denVarId} onChange={e => updateKpi(i, 'denVarId', e.target.value)} disabled={!isAdmin()} style={{ flex:1, marginBottom:0 }}>
                              {allVars.map(v => <option key={v.id} value={v.id}>{v.name} ({v.unit})</option>)}
                            </select>
                            <span style={{ fontSize:10, color:'var(--text-muted)' }}>&times;</span>
                            <input type="number" step="any" value={k.denFactor ?? 1} onChange={e => updateKpi(i, 'denFactor', parseFloat(e.target.value)||1)} disabled={!isAdmin()} style={{ width:70, marginBottom:0 }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:10, color:'var(--text-muted)', width:35 }}>Meta:</span>
                          <input type="number" step="any" value={k.meta ?? ''} onChange={e => updateKpi(i, 'meta', e.target.value === '' ? null : parseFloat(e.target.value))} disabled={!isAdmin()} placeholder="Sem meta" style={{ flex:1, marginBottom:0 }} />
                        </div>
                        
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:10, color:'var(--text-muted)', width:60 }}>Un Final:</span>
                          <input value={k.unit ?? ''} onChange={e => updateKpi(i, 'unit', e.target.value)} disabled={!isAdmin()} placeholder="Ex: kg/m³" style={{ flex:1, marginBottom:0 }} />
                        </div>
                      </div>
                      
                      <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:11, cursor:'pointer', marginTop:4, color:'var(--text-secondary)' }}>
                        <input type="checkbox" checked={k.inverse} onChange={e => updateKpi(i, 'inverse', e.target.checked)} disabled={!isAdmin()} />
                        Inverter Regra de Cor (Valores menores que a meta são considerados Bons)
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              {isAdmin() && (
                <button className="btn btn-ghost btn-sm" onClick={addKpi} style={{ marginTop:16 }}>
                  <Plus size={14}/> Criar Nova Métrica
                </button>
              )}
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
