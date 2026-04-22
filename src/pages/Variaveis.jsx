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
  const [newVar, setNewVar]   = useState(null)
  const [editVar, setEditVar] = useState(null)
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
    <div className={`card ${open ? 'open' : ''}`} style={{ padding: 0, overflow: 'hidden', border: open ? '1px solid var(--border-active)' : '1px solid var(--border)' }}>
      <div 
        className="accordion-header" 
        onClick={() => !editing && setOpen(v => !v)}
        style={{ 
          padding: '16px 20px', 
          background: open ? 'var(--bg-surface)' : 'transparent',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 2, 
            background: open ? 'var(--accent-glow)' : 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s'
          }}>
            <Layers size={16} style={{ color: open ? 'var(--accent)' : 'var(--text-muted)' }} />
          </div>
          
          {editing ? (
            <input
              value={catName}
              onChange={e => setCatName(e.target.value)}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.key === 'Enter' && saveCategory()}
              autoFocus
              style={{ width: 'min(300px, 80%)', margin: 0 }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15, letterSpacing: '-0.01em' }}>{cat.name}</span>
              <span className="badge">
                {cat.variables.length} VARIÁVEIS
              </span>
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center' }} onClick={e => e.stopPropagation()}>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 6 }}>
              {editing ? (
                <>
                  <button className="btn btn-sm btn-success btn-icon" onClick={saveCategory}><Check size={14}/></button>
                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => { setEditing(false); setCatName(cat.name) }}><X size={14}/></button>
                </>
              ) : (
                <>
                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setEditing(true)}><Pencil size={14}/></button>
                  <button className="btn btn-sm btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteCategory(cat.id)}><Trash2 size={14}/></button>
                </>
              )}
            </div>
          )}
          <div style={{ padding: 4, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          <div className="table-wrapper">
            <table className="industrial-table">
              <thead>
                <tr>
                  <th style={{ width: '60%' }}>ID / Nome da Variável</th>
                  <th>Unidade</th>
                  {isAdmin && <th style={{ width: 100, textAlign: 'right' }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {cat.variables.map(v => (
                  <tr key={v.id}>
                    <td>
                      {editVar === v.id ? (
                        <input
                          value={editVarForm.name}
                          onChange={e => setEditVarForm(p => ({ ...p, name: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveEditVar(v)}
                          autoFocus
                          style={{ margin: 0 }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 1 }}>
                            {v.id?.slice(-4).toUpperCase() || '---'}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {editVar === v.id ? (
                        <select
                          value={editVarForm.unit}
                          onChange={e => setEditVarForm(p => ({ ...p, unit: e.target.value }))}
                          style={{ margin: 0 }}
                        >
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      ) : (
                        <span className="badge badge-accent">{v.unit}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display:'flex', gap:8, justifyContent: 'flex-end' }}>
                          {editVar === v.id ? (
                            <>
                              <button className="btn btn-sm btn-success btn-icon" onClick={() => saveEditVar(v)}><Check size={14}/></button>
                              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setEditVar(null)}><X size={14}/></button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => startEditVar(v)}><Pencil size={14}/></button>
                              <button className="btn btn-sm btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteVariable(cat.id, v.id)}><Trash2 size={14}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {newVar && (
                  <tr style={{ background: 'var(--accent-soft)' }}>
                    <td>
                      <input
                        className="cell-input"
                        placeholder="Nome da variável"
                        value={newVar.name}
                        onChange={e => setNewVar(p => ({ ...p, name: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && saveNewVar()}
                        autoFocus
                        style={{ width: '100%', margin: 0 }}
                      />
                    </td>
                    <td>
                      <select className="cell-input" value={newVar.unit} onChange={e => setNewVar(p => ({ ...p, unit: e.target.value }))} style={{ width: '100%', margin: 0 }}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display:'flex', gap:6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-success btn-icon" onClick={saveNewVar}><Check size={14}/></button>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setNewVar(null)}><X size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isAdmin && !newVar && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16, border: '1px dashed var(--border)', width: '100%', borderRadius: 8 }} onClick={startAddVar}>
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
  const admin                       = isAdmin() // PERF-02: calculado uma vez, evita 8+ chamadas por render
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
          {admin && (
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
            <CategoryRow key={cat.id} cat={cat} isAdmin={admin} />
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────
          CONFIGURAÇÕES DO DASHBOARD
      ───────────────────────────────────────────────── */}
      <div className="card industrial" style={{ marginTop:'var(--space-xl)', padding: 0, overflow: 'hidden' }}>
        <div
          className="card-header"
          onClick={() => setCfgOpen(v => !v)}
          style={{ 
            cursor:'pointer', padding: '20px 24px', background: cfgOpen ? 'var(--bg-surface)' : 'transparent',
            borderBottom: cfgOpen ? '1px solid var(--border)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 2, background: 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)'
            }}>
              <Settings2 size={18} style={{ color:'var(--text-primary)' }} />
            </div>
            <div>
              <span className="card-title" style={{ display: 'block' }}>Configurações do Dashboard</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Configuração de indicadores e KPIs</span>
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', transform: cfgOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
            <ChevronDown size={20} />
          </div>
        </div>

        {cfgOpen && (
          <div style={{ padding: '24px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'32px' }}>

              {/* ---- Variáveis Quantitativas ---- */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
                  <BarChart2 size={16} style={{ color:'var(--accent)' }}/>
                  <span style={{ fontWeight:800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Indicadores de Volume</span>
                </div>
                
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
                  {(dashboardConfig.customQuantitatives || []).map((q, i) => (
                    <div key={q.id} className="card" style={{
                      background:'white', border:`1px solid var(--border)`,
                      padding: '16px', position:'relative', borderRadius: 'var(--radius-md)'
                    }}>
                      {admin && (
                         <button onClick={() => rmQuant(i)} className="btn btn-sm btn-ghost" style={{ position:'absolute', top:12, right:12, color:'var(--danger)', padding: 6, borderRadius: 6 }}>
                           <Trash2 size={14} />
                         </button>
                      )}
                      
                      <div style={{ display:'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display:'flex', gap: 8 }}>
                          <input className="cell-input" value={q.label} onChange={e => updateQuant(i, 'label', e.target.value)} disabled={!isAdmin()} placeholder="Título" style={{ flex: 1, margin: 0 }} />
                          <input type="color" value={q.color} onChange={e => updateQuant(i, 'color', e.target.value)} disabled={!isAdmin()} style={{ width: 40, height: 38, padding: 2, background: 'transparent', border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer' }} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <select className="cell-input" value={q.varId} onChange={e => updateQuant(i, 'varId', e.target.value)} disabled={!isAdmin()} style={{ margin: 0 }}>
                            {allVars.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                          <input className="cell-input" type="number" step="any" value={q.max ?? ''} onChange={e => updateQuant(i, 'max', parseFloat(e.target.value)||0)} disabled={!isAdmin()} placeholder="Referencial Máx" style={{ margin: 0 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isAdmin() && (
                    <button className="btn btn-ghost" onClick={addQuant} style={{ border: '1px dashed var(--border)', height: '100px', borderRadius: 12 }}>
                      <Plus size={18} style={{ marginBottom: 4 }} /><br/>Novo Indicador
                    </button>
                  )}
                </div>
              </div>

              {/* ---- KPIs de Eficiência ---- */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
                  <Target size={16} style={{ color:'var(--accent)' }}/>
                  <span style={{ fontWeight:800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Métricas de Eficiência</span>
                </div>
                
                <div style={{ display:'flex', flexDirection:'column', gap: '12px' }}>
                  {(dashboardConfig.customKPIs || []).map((k, i) => (
                    <div key={k.id} className="card" style={{
                      background:'white', border:'1px solid var(--border)',
                      padding:'16px', borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                         <input className="cell-input" value={k.label} onChange={e => updateKpi(i, 'label', e.target.value)} disabled={!isAdmin()} placeholder="Nome do KPI" style={{ flex: 1, margin: 0 }} />
                         <input type="color" value={k.color} onChange={e => updateKpi(i, 'color', e.target.value)} disabled={!isAdmin()} style={{ width: 40, height: 38, padding: 2, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8 }} />
                         {admin && (
                           <button onClick={() => rmKpi(i)} className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)', padding: 8 }}>
                             <Trash2 size={16} />
                           </button>
                         )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, background: 'var(--bg-surface)', padding: 20, borderRadius: 2, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>NUMERADOR</span>
                          <select className="cell-input" value={k.numVarId} onChange={e => updateKpi(i, 'numVarId', e.target.value)} disabled={!isAdmin()} style={{ margin: 0 }}>
                            {allVars.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--leaf)' }}>DENOMINADOR</span>
                          <select className="cell-input" value={k.denVarId} onChange={e => updateKpi(i, 'denVarId', e.target.value)} disabled={!isAdmin()} style={{ margin: 0 }}>
                            {allVars.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>META ALVO</span>
                          <input className="cell-input" type="number" step="any" value={k.meta ?? ''} onChange={e => updateKpi(i, 'meta', e.target.value === '' ? null : parseFloat(e.target.value))} disabled={!isAdmin()} placeholder="0.00" style={{ margin: 0 }} />
                        </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>UNIDADE</span>
                          <input className="cell-input" value={k.unit ?? ''} onChange={e => updateKpi(i, 'unit', e.target.value)} disabled={!isAdmin()} placeholder="kg/t" style={{ margin: 0 }} />
                        </div>
                      </div>
                      
                      <label style={{ display:'flex', gap:10, alignItems:'center', fontSize: 12, cursor:'pointer', marginTop: 12, color:'var(--text-secondary)', padding: '4px 8px' }}>
                        <input type="checkbox" checked={k.inverse} onChange={e => updateKpi(i, 'inverse', e.target.checked)} disabled={!isAdmin()} style={{ width: 16, height: 16 }} />
                        <span>Inverter regra cromática (valores baixos = positivos)</span>
                      </label>
                    </div>
                  ))}
                  
                  {isAdmin() && (
                    <button className="btn btn-ghost" onClick={addKpi} style={{ marginTop: 8, border: '1px dashed var(--border)', borderRadius: 12 }}>
                      <Plus size={16}/> Criar Nova Métrica de Eficiência
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
