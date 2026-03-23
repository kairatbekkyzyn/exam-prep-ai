import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

const nav = [
  { to: '/',          label: 'Dashboard', icon: '⊞' },
  { to: '/quiz',      label: 'Quiz',      icon: '⚡' },
  { to: '/materials', label: 'Materials', icon: '📂' },
  { to: '/stats',     label: 'Progress',  icon: '◑' },
  { to: '/badges',    label: 'Badges',    icon: '◈' },
]

export default function Layout() {
  const { user, logout, theme, toggleTheme } = useAuthStore()
  const navigate = useNavigate()

  const level     = Math.floor((user?.xp ?? 0) / 100) + 1
  const xpInLevel = (user?.xp ?? 0) % 100
  const isDark    = theme === 'dark'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width:220, display:'flex', flexDirection:'column', flexShrink:0,
        background:'var(--surface)', borderRight:'1px solid var(--border)',
      }}>
        {/* Logo + theme toggle */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 16px', borderBottom:'1px solid var(--border)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:10, flexShrink:0,
              background:'linear-gradient(135deg, #22d3ee, #818cf8)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16
            }}>🎓</div>
            <span className='h3' style={{ fontSize:16 }}>
              ExamAI
            </span>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width:32, height:32, borderRadius:8, border:'1px solid var(--border)',
              background:'var(--surface2)', cursor:'pointer', fontSize:15,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s', flexShrink:0
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border)'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* User card */}
        <div style={{
          margin:'12px 10px 0',
          background:'var(--surface2)', border:'1px solid var(--border)',
          borderRadius:12, padding:14
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background:'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(129,140,248,0.2))',
              border:'1px solid rgba(34,211,238,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--cyan)', fontWeight:700, fontSize:15, fontFamily:'Syne'
            }}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth:0 }}>
              <p className='t-primary' style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ color:'var(--text2)', fontSize:11 }}>Level {level} · {user?.xp ?? 0} XP</p>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <div className="progress-track">
              <div className="progress-fill xp-bar" style={{ width:`${xpInLevel}%` }} />
            </div>
            <p style={{ color:'var(--text3)', fontSize:10, marginTop:4 }}>{xpInLevel}/100 to Level {level+1}</p>
          </div>
          {(user?.streak_days ?? 0) > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, fontSize:11, color:'#fb923c' }}>
              🔥 <span>{user?.streak_days} day streak</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display:'flex', flexDirection:'column', gap:2, padding:'12px 8px' }}>
          {nav.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:4, padding:'12px 8px', borderRadius:14,
                textDecoration:'none', cursor:'pointer', transition:'all 0.18s',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(129,140,248,0.1))'
                  : 'transparent',
                outline: isActive ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    fontSize:32, lineHeight:1,
                    opacity: isActive ? 1 : 0.4,
                    transition:'all 0.18s',
                  }}>{icon}</span>
                  <span style={{
                    fontFamily:'Manrope', fontSize:11, fontWeight:700,
                    letterSpacing:'0.03em', textAlign:'center', lineHeight:1,
                    color: isActive ? 'var(--cyan)' : 'var(--text)',
                    opacity: isActive ? 1 : 0.45,
                    transition:'all 0.18s',
                  }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding:'8px 8px 16px', borderTop:'1px solid var(--border)' }}>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              padding:'10px 14px', borderRadius:10, border:'none', cursor:'pointer',
              background:'transparent', color:'var(--text2)', fontSize:13,
              fontFamily:'Manrope', transition:'all 0.15s'
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--surface2)'; el.style.color='var(--text)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--text2)' }}
          >
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'36px 36px' }} className="anim-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}