import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function OAuthCallback() {
  const { fetchMe } = useAuthStore()
  const navigate    = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const error  = params.get('error')

    if (error || !token) {
      navigate('/login?error=' + (error ?? 'oauth_failed'))
      return
    }

    localStorage.setItem('token', token)
    fetchMe().then(() => navigate('/'))
  }, [])

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}
         className="flex items-center justify-center">
      <div style={{ textAlign:'center' }}>
        <span className="spin" style={{
          display:'block', width:36, height:36, margin:'0 auto 16px',
          border:'2px solid var(--border2)', borderTopColor:'var(--cyan)', borderRadius:'50%'
        }} />
        <p className="t-secondary" style={{ fontSize:14 }}>Signing you in…</p>
      </div>
    </div>
  )
}