'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  async function handleAuth() {
    setLoading(true)
    setError('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message) }
      else if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, name })
      }
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (user) return (
    <div style={{ minHeight: '100vh', background: '#020B18', color: '#F1F5F9', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>¡Bienvenido a App Gym!</div>
        <div style={{ fontSize: 14, color: '#475569', marginBottom: 32 }}>{user.email}</div>
        <button onClick={handleLogout} style={{ background: '#1E293B', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#94A3B8', fontSize: 14, cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#020B18', color: '#F1F5F9', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>App Gym</div>
          <div style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>Tu entrenamiento, tu data</div>
        </div>

        <div style={{ background: '#0F172A', borderRadius: 20, padding: 32, border: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', marginBottom: 24, background: '#1E293B', borderRadius: 12, padding: 4 }}>
            <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: isLogin ? '#3B82F6' : 'transparent', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              Entrar
            </button>
            <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: !isLogin ? '#3B82F6' : 'transparent', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              Registrarse
            </button>
          </div>

          {!isLogin && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #1E293B', background: '#1E293B', color: '#F1F5F9', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #1E293B', background: '#1E293B', color: '#F1F5F9', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #1E293B', background: '#1E293B', color: '#F1F5F9', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }} />

          {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}