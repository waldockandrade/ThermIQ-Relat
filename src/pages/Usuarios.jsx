import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, hashPassword } from '../context/AuthContext'
import { Plus, Pencil, Trash2, X, Check, Users, Shield, User } from 'lucide-react'

const USERS_KEY = 'thermiq_users'
const EMPTY = { name: '', email: '', password: '', role: 'staff', contact: '' }

function getUsersFromLS() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUsersToLS(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export default function Usuarios() {
  const { isAdmin, user: currentUser } = useAuth()
  const [users, setUsers]         = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [error, setError]         = useState('')
  const [dbLoading, setDbLoading] = useState(true)

  useEffect(() => {
    setUsers(getUsersFromLS())
    setDbLoading(false)
  }, [])

  function saveToDB(updatedArray) {
    setUsers(updatedArray)
    saveUsersToLS(updatedArray)
  }

  function openAdd() { setForm(EMPTY); setEditId(null); setError(''); setShowModal(true) }
  
  function openEdit(u) {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, contact: u.contact || '' })
    setEditId(u.id)
    setError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Preencha nome e e-mail.'); return }
    if (!editId && !form.password) { setError('Senha é obrigatória para novos usuários.'); return }
    
    const dup = users.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editId)
    if (dup) { setError('E-mail já cadastrado.'); return }

    let finalPassword = undefined
    if (form.password) {
       finalPassword = await hashPassword(form.password)
    }

    let updated
    if (editId) {
      updated = users.map(u => {
        if (u.id === editId) {
           return {
             ...u,
             ...form,
             password: finalPassword || u.password
           }
        }
        return u
      })
    } else {
      updated = [...users, { ...form, password: finalPassword, id: `usr-${crypto.randomUUID()}` }]
    }
    
    saveToDB(updated)
    setShowModal(false)
  }

  function handleDelete(id) {
    if (id === currentUser?.id) {
      alert('Você não pode excluir sua própria conta enquanto está logado.')
      return
    }
    saveToDB(users.filter(u => u.id !== id))
  }

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  if (!isAdmin()) return <Navigate to="/variaveis" replace />

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Gestão de Usuários</h1>
            <p>Administração de acessos e permissões do sistema</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} disabled={dbLoading}>
            <Plus size={16}/> Novo Usuário
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {dbLoading ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
               Carregando usuários...
             </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>E-mail Corporativo</th>
                  <th>Permissão</th>
                  <th>Contato</th>
                  <th style={{ width: 100, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
                        <Users size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
                        <h4 style={{ color: 'var(--text-muted)' }}>Nenhum registro encontrado</h4>
                      </div>
                    </td>
                  </tr>
                )}
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
                        <div className="user-avatar" style={{ background: u.role === 'admin' ? 'var(--text-primary)' : 'var(--bg-surface)', color: u.role === 'admin' ? 'white' : 'var(--text-primary)' }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-accent' : 'badge-info'}`}>
                        {u.role === 'admin' ? <Shield size={12}/> : <User size={12}/>}
                        {u.role === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.contact || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => openEdit(u)}><Pencil size={15}/></button>
                        <button
                          className="btn btn-sm btn-ghost btn-icon"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDelete(u.id)}
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.15)' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, background: 'white' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Configurar Credenciais' : 'Registrar Novo Usuário'}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Informe os dados de acesso e permissão</p>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
                <div className="form-group">
                  <label>NOME COMPLETO</label>
                  <input className="cell-input" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Waldo Andrade" required />
                </div>
                
                <div className="form-group">
                  <label>ENDEREÇO DE E-MAIL</label>
                  <input className="cell-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="exemplo@thermiq.com" required />
                </div>
                
                <div className="form-group">
                  <label>{editId ? 'REDEFINIR SENHA (OPCIONAL)' : 'SENHA DE ACESSO'}</label>
                  <input className="cell-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={editId ? "••••••••" : "Mínimo 6 caracteres"} required={!editId} />
                  {editId && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Deixe em branco para manter a senha atual</span>}
                </div>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>NÍVEL DE PERMISSÃO</label>
                    <select className="cell-input" value={form.role} onChange={e => set('role', e.target.value)}>
                      <option value="staff">Staff Operacional</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>CONTATO / RAMAL</label>
                    <input className="cell-input" type="text" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="(00) 0000-0000" />
                  </div>
                </div>

                {error && (
                  <div style={{ padding:'10px', background:'var(--danger-glow)', border:'1px solid #fecaca', borderRadius: 1, color: 'var(--danger)', fontSize: 13, fontWeight: 500 }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>
              
              <div className="modal-footer" style={{ padding: '24px 0 0', marginTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  <Check size={16} style={{ marginRight: 8 }}/> Finalizar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
