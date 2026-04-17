import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth, hashPassword } from '../context/AuthContext'
import { Plus, Pencil, Trash2, X, Check, Users, Shield, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

const EMPTY = { name: '', email: '', password: '', role: 'staff', contact: '' }

export default function Usuarios() {
  const { isAdmin, user: currentUser } = useAuth()
  const [users, setUsers]         = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [error, setError]         = useState('')
  const [dbLoading, setDbLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
       const { data } = await supabase.from('app_data').select('*').eq('id', 'thermiq_users').single()
       if (data?.data) {
         setUsers(data.data)
       }
       setDbLoading(false)
    }
    fetchUsers()
  }, [])

  async function saveToDB(updatedArray) {
    setUsers(updatedArray)
    await supabase.from('app_data').upsert({ id: 'thermiq_users', data: updatedArray })
  }

  function openAdd() { setForm(EMPTY); setEditId(null); setError(''); setShowModal(true) }
  
  function openEdit(u) {
    // Não carregamos a senha real no edit para não confundi-la. Caso a pessoa digite algo, atualizamos.
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
             // Só sobrepõe a senha se ela foi alterada pelo form
             password: finalPassword || u.password
           }
        }
        return u
      })
    } else {
      updated = [...users, { ...form, password: finalPassword, id: `usr-${Date.now()}` }]
    }
    
    await saveToDB(updated)
    setShowModal(false)
  }

  async function handleDelete(id) {
    // A-07: não permite deletar o próprio usuário logado
    if (id === currentUser?.id) {
      alert('Você não pode excluir sua própria conta enquanto está logado.')
      return
    }
    const updated = users.filter(u => u.id !== id)
    await saveToDB(updated)
  }

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  // B-01: redireciona em vez de render condicional
  if (!isAdmin()) return <Navigate to="/variaveis" replace />

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Gestão de Usuários</h1>
            <p>Amministração de acessos ao sistema ThermIQ Relat</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} disabled={dbLoading}><Plus size={16}/> Novo Usuário</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {dbLoading ? (
             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
               Carregando usuários...
             </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Contato</th>
                  <th style={{ width:100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="empty-state"><Users size={36}/><h4>Sem usuários</h4></div>
                  </td></tr>
                )}
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:30, height:30, borderRadius:'50%',
                          background: u.role === 'admin' ? 'linear-gradient(135deg,var(--accent),var(--accent-dark))' : 'var(--bg-input)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'var(--text-xs)', fontWeight:700, color:'white',
                          flexShrink:0,
                        }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight:500, color:'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:'var(--text-sm)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-accent' : 'badge-info'}`}>
                        {u.role === 'admin' ? <Shield size={11}/> : <User size={11}/>}
                        {u.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>{u.contact || '—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => openEdit(u)}><Pencil size={13}/></button>
                        {/* A-07: desabilita exclusão do próprio usuário logado */}
                        <button
                          className="btn btn-sm btn-danger btn-icon"
                          onClick={() => handleDelete(u.id)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? 'Não é possível excluir sua própria conta' : 'Excluir usuário'}
                        ><Trash2 size={13}/></button>
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-md)' }}>
                <div className="form-group">
                  <label htmlFor="usr-nome">Nome completo</label>
                  <input id="usr-nome" type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: João da Silva" required />
                </div>
                <div className="form-group">
                  <label htmlFor="usr-email">E-mail</label>
                  <input id="usr-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="usr-pw">
                    {editId ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso'}
                  </label>
                  <input id="usr-pw" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={editId ? "••••••••" : "Digite uma senha segura"} required={!editId} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="usr-role">Perfil</label>
                    <select id="usr-role" value={form.role} onChange={e => set('role', e.target.value)}>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="usr-contact">Contato</label>
                    <input id="usr-contact" type="text" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Telefone ou ramal" />
                  </div>
                </div>
                {error && (
                  <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius-md)', color:'var(--danger-light)', fontSize:'var(--text-sm)' }}>
                    {error}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary"><Check size={15}/> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
