import { useState, FormEvent, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../api'

type Step = 'form' | 'otp'

export default function Register() {
  const [step, setStep]           = useState<Step>('form')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [otp, setOtp]             = useState(['','','','','',''])
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [resendCool, setResendCool] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { fetchMe } = useAuthStore()
  const navigate    = useNavigate()

  const submitForm = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    try {
      await useAuthStore.getState().register(name, email, password)
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Registration failed.')
    } finally { setLoading(false) }
  }

  const handleOtpKey = (i: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]; next[i] = value; setOtp(next)
    if (value && i < 5) inputRefs.current[i+1]?.focus()
    if (!value && i > 0) inputRefs.current[i-1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (text.length === 6) { setOtp(text.split('')); inputRefs.current[5]?.focus() }
  }

  const submitOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Enter all 6 digits.'); return }
    setError(''); setLoading(true)
    try {
      const res = await authAPI.verifyOtp({ email, code })
      localStorage.setItem('token', res.data.access_token)
      await fetchMe()
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Invalid code.')
      setOtp(['','','','','','']); inputRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const resend = async () => {
    if (resendCool) return
    setResendCool(true); setError('')
    try { await authAPI.resendOtp({ email }) }
    catch (err: any) { setError(err.response?.data?.detail ?? 'Failed to resend.') }
    setTimeout(() => setResendCool(false), 30000)
  }

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}
         className="flex items-center justify-center p-4 relative overflow-hidden">
      <div style={{
        position:'absolute', top:'30%', left:'50%', transform:'translate(-50%,-50%)',
        width:700, height:500, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
        pointerEvents:'none'
      }} />

      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        <div className="text-center anim-up d-0" style={{ marginBottom:32 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:52, height:52, borderRadius:14, marginBottom:12,
            background:'linear-gradient(135deg, #22d3ee, #818cf8)',
            boxShadow:'0 0 36px rgba(34,211,238,0.3)'
          }} className="float"><span style={{ fontSize:24 }}>🎓</span></div>
          <h1 className="h1" style={{ fontSize:26, letterSpacing:'-0.03em' }}>ExamAI</h1>
        </div>

        {step === 'form' ? (
          <div className="card anim-scale d-1" style={{ padding:30 }}>
            <h2 className="h2" style={{ marginBottom:4 }}>Create your account</h2>
            <p className="t-secondary" style={{ fontSize:13, marginBottom:24 }}>Free forever · No credit card</p>

            {error && <ErrBox msg={error} />}

            <form onSubmit={submitForm} style={{ display:'flex', flexDirection:'column', gap:15 }}>
              <div>
                <label className="label">Full Name</label>
                <input className="input" type="text" placeholder="Alex Johnson"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="you@university.edu"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ width:'100%', marginTop:6, height:44, fontSize:14 }}>
                {loading ? <Spin /> : 'Create Account →'}
              </button>
            </form>

            <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)', textAlign:'center', fontSize:13 }}>
              <span className="t-secondary">Have an account? </span>
              <Link to="/login" style={{ color:'var(--cyan)', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
            </div>
          </div>
        ) : (
          <div className="card anim-scale" style={{ padding:30 }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{
                width:52, height:52, borderRadius:14, margin:'0 auto 14px',
                background:'var(--cyan-dim)', border:'1px solid rgba(34,211,238,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24
              }}>📧</div>
              <h2 className="h2" style={{ marginBottom:8 }}>Check your inbox</h2>
              <p className="t-secondary" style={{ fontSize:13, lineHeight:1.6 }}>
                We sent a 6-digit code to<br />
                <span style={{ color:'var(--cyan)', fontWeight:600 }}>{email}</span>
              </p>
            </div>

            {error && <ErrBox msg={error} />}

            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:24 }} onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => { inputRefs.current[i] = el }}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOtpKey(i, e.target.value)}
                  onKeyDown={e => { if (e.key==='Backspace' && !digit && i>0) inputRefs.current[i-1]?.focus() }}
                  style={{
                    width:48, height:56, textAlign:'center', fontSize:22,
                    fontFamily:'JetBrains Mono', fontWeight:600,
                    background: digit ? 'var(--cyan-dim)' : 'var(--surface2)',
                    border:`2px solid ${digit ? 'rgba(34,211,238,0.4)' : 'var(--border)'}`,
                    borderRadius:10, color:'var(--text)', outline:'none', transition:'all 0.15s'
                  }}
                  onFocus={e => { e.target.style.borderColor='var(--cyan)'; e.target.style.boxShadow='0 0 0 3px rgba(34,211,238,0.1)' }}
                  onBlur={e  => { e.target.style.borderColor=digit?'rgba(34,211,238,0.4)':'var(--border)'; e.target.style.boxShadow='none' }}
                />
              ))}
            </div>

            <button onClick={submitOtp} disabled={loading || otp.join('').length < 6}
              className="btn-primary" style={{ width:'100%', height:44, fontSize:14, marginBottom:14 }}>
              {loading ? <Spin /> : 'Verify & Continue →'}
            </button>

            <div style={{ textAlign:'center', fontSize:13 }}>
              <span className="t-secondary">Didn't get it? </span>
              <button onClick={resend} disabled={resendCool} style={{
                background:'none', border:'none', padding:0, fontFamily:'Manrope', fontSize:13,
                cursor: resendCool ? 'default' : 'pointer',
                color: resendCool ? 'var(--text3)' : 'var(--cyan)', fontWeight:600
              }}>
                {resendCool ? 'Resend in 30s…' : 'Resend code'}
              </button>
              <span style={{ margin:'0 8px', color:'var(--text3)' }}>·</span>
              <button onClick={() => { setStep('form'); setOtp(['','','','','','']); setError('') }}
                style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Manrope', fontSize:13, padding:0 }}
                className="t-secondary">
                ← Back
              </button>
            </div>
          </div>
        )}
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