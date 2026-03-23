import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { statsAPI, materialsAPI } from '../api'

interface Stats {
  total_attempts: number; correct_attempts: number; overall_accuracy: number
  xp: number; streak_days: number; ai_recommendation: string
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const [stats, setStats]     = useState<Stats | null>(null)
  const [matCount, setMatCount] = useState(0)

  useEffect(() => {
    statsAPI.get().then(r => setStats(r.data)).catch(() => {})
    materialsAPI.list().then(r => setMatCount(r.data.length)).catch(() => {})
  }, [])

  const level     = Math.floor((user?.xp ?? 0) / 100) + 1
  const xpInLevel = (user?.xp ?? 0) % 100
  const accuracy  = stats ? Math.round(stats.overall_accuracy * 100) : 0
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { label:'Questions', value: stats?.total_attempts ?? 0,  icon:'📝', color:'var(--cyan)' },
    { label:'Accuracy',  value:`${accuracy}%`,               icon:'🎯', color: accuracy>=70?'var(--emerald)':accuracy>=50?'var(--amber)':'var(--red)' },
    { label:'Materials', value: matCount,                    icon:'📂', color:'#a78bfa' },
    { label:'Total XP',  value: user?.xp ?? 0,              icon:'⚡', color:'var(--amber)' },
  ]

  const actions = [
    { to:'/quiz',      icon:'⚡', label:'Start Adaptive Quiz',  desc:'AI targets your weak topics',     color:'var(--cyan)',   bg:'rgba(34,211,238,0.08)',   border:'rgba(34,211,238,0.2)' },
    { to:'/materials', icon:'📂', label:'Upload Material',      desc:'PDF, DOCX or TXT → instant quiz', color:'#a78bfa',     bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.2)' },
    { to:'/stats',     icon:'◑',  label:'View Progress',        desc:'Charts by topic, AI coaching',    color:'var(--emerald)', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)' },
    { to:'/badges',    icon:'◈',  label:'My Badges',            desc:'Achievements & milestones',       color:'var(--amber)', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Hero */}
      <div className="anim-up d-0" style={{
        borderRadius:20, padding:32, position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, rgba(34,211,238,0.1) 0%, rgba(129,140,248,0.06) 50%, transparent 100%)',
        border:'1px solid rgba(34,211,238,0.15)'
      }}>
        <div style={{
          position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(34,211,238,0.08), transparent 70%)',
          pointerEvents:'none'
        }} />
        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ color:'var(--cyan)', fontSize:13, fontWeight:600, marginBottom:6 }}>
              {greeting} 👋
            </p>
            <h1 style={{ fontFamily:'Syne', fontSize:26, fontWeight:800, color:'white', letterSpacing:'-0.02em' }}>
              {user?.name}
            </h1>
            <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>
              Level {level} Explorer · {user?.xp ?? 0} XP earned
            </p>
          </div>
          {(user?.streak_days ?? 0) > 0 && (
            <div style={{
              textAlign:'center', background:'rgba(251,191,36,0.1)',
              border:'1px solid rgba(251,191,36,0.2)', borderRadius:14, padding:'12px 18px'
            }}>
              <p style={{ fontSize:28 }}>🔥</p>
              <p style={{ color:'var(--amber)', fontWeight:700, fontSize:15, fontFamily:'JetBrains Mono' }}>
                {user?.streak_days}
              </p>
              <p style={{ color:'var(--text2)', fontSize:10, marginTop:1 }}>day streak</p>
            </div>
          )}
        </div>

        {/* XP bar */}
        <div style={{ marginTop:24, position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)', marginBottom:8 }}>
            <span>Level {level} progress</span>
            <span style={{ fontFamily:'JetBrains Mono' }}>{xpInLevel} / 100 XP</span>
          </div>
          <div className="progress-track" style={{ height:8 }}>
            <div className="progress-fill xp-bar" style={{ width:`${xpInLevel}%` }} />
          </div>
          <p style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
            {100-xpInLevel} XP to reach Level {level+1}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="anim-up d-1" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {statCards.map((s, i) => (
          <div key={s.label} className={`card-sm d-${i}`} style={{ textAlign:'center' }}>
            <p style={{ fontSize:22, marginBottom:8 }}>{s.icon}</p>
            <p className="stat-num" style={{ fontSize:22, fontWeight:600, color:s.color }}>
              {s.value}
            </p>
            <p style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Coach */}
      {stats?.ai_recommendation && (
        <div className="anim-up d-2" style={{
          background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.12)',
          borderRadius:16, padding:20, display:'flex', gap:16
        }}>
          <div style={{
            width:40, height:40, flexShrink:0, borderRadius:12,
            background:'rgba(34,211,238,0.12)', border:'1px solid rgba(34,211,238,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18
          }}>🤖</div>
          <div>
            <p style={{ color:'var(--cyan)', fontSize:12, fontWeight:700, marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>
              AI Study Coach
            </p>
            <p style={{ color:'var(--text)', fontSize:14, lineHeight:1.7 }}>
              {stats.ai_recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="anim-up d-3">
        <p style={{ fontFamily:'Syne', fontSize:13, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>
          Quick Actions
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {actions.map(a => (
            <Link key={a.to} to={a.to} style={{
              display:'flex', alignItems:'center', gap:14, padding:18,
              borderRadius:14, border:`1px solid ${a.border}`, background:a.bg,
              textDecoration:'none', transition:'all 0.2s', cursor:'pointer'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${a.bg}` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}
            >
              <div style={{
                width:40, height:40, flexShrink:0, borderRadius:11,
                background:`${a.color}18`, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:19
              }}>{a.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:'white', fontWeight:600, fontSize:13 }}>{a.label}</p>
                <p style={{ color:'var(--text2)', fontSize:11, marginTop:2 }}>{a.desc}</p>
              </div>
              <span style={{ color:'var(--text3)', fontSize:16 }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}