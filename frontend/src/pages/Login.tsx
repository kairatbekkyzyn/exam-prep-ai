import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuthStore()
  const navigate                = useNavigate()

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch (err: any) { setError(err.response?.data?.detail ?? 'Invalid email or password.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}
         className="flex items-center justify-center p-4 relative overflow-hidden">
      <div style={{
        position:'absolute', top:'20%', left:'50%', transform:'translate(-50%,-50%)',
        width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)',
        pointerEvents:'none'
      }} />

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>
        <div className="text-center anim-up d-0" style={{ marginBottom:36 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:52, height:52, borderRadius:14, marginBottom:12,
            background:'linear-gradient(135deg, #22d3ee, #818cf8)',
            boxShadow:'0 0 36px rgba(34,211,238,0.3)'
          }} className="float"><span style={{ fontSize:24 }}>🎓</span></div>
          <h1 className="h1" style={{ fontSize:26, letterSpacing:'-0.03em' }}>ExamAI</h1>
          <p className="t-secondary" style={{ marginTop:6, fontSize:13 }}>Smarter studying, better results</p>
        </div>

        <div className="card anim-scale d-1" style={{ padding:30 }}>
          <h2 className="h2" style={{ marginBottom:4 }}>Welcome back</h2>
          <p className="t-secondary" style={{ fontSize:13, marginBottom:24 }}>Continue your exam preparation</p>

          {error && <ErrBox msg={error} />}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@university.edu"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width:'100%', marginTop:4, height:44, fontSize:14 }}>
              {loading ? <Spin /> : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)', textAlign:'center', fontSize:13 }}>
            <span className="t-secondary">No account? </span>
            <Link to="/register" style={{ color:'var(--cyan)', fontWeight:600, textDecoration:'none' }}>Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrBox({ msg }: { msg: string }) {
  return <div style={{ background:'var(--red-dim)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, padding:'11px 15px', marginBottom:16, color:'var(--red)', fontSize:13 }}>⚠ {msg}</div>
}
function Spin() {
  return <span className="spin" style={{ display:'inline-block', width:15, height:15, border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'var(--bg)', borderRadius:'50%' }} />
}