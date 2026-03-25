import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { statsAPI, materialsAPI } from '../api'

interface Stats {
  total_attempts: number
  correct_attempts: number
  overall_accuracy: number
  xp: number
  streak_days: number
  ai_recommendation: string
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const [stats, setStats] = useState<Stats | null>(null)
  const [matCount, setMatCount] = useState(0)

  useEffect(() => {
    statsAPI.get().then(r => setStats(r.data)).catch(() => {})
    materialsAPI.list().then(r => setMatCount(r.data.length)).catch(() => {})
  }, [])

  const level = Math.floor((user?.xp ?? 0) / 100) + 1
  const xpInLevel = (user?.xp ?? 0) % 100
  const accuracy = stats ? Math.round(stats.overall_accuracy * 100) : 0
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { label: 'Questions', value: stats?.total_attempts ?? 0, icon: '📝', color: 'var(--cyan)' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: '🎯', color: accuracy >= 70 ? 'var(--emerald)' : accuracy >= 50 ? 'var(--amber)' : 'var(--red)' },
    { label: 'Materials', value: matCount, icon: '📂', color: 'var(--cyan)' },
    { label: 'Total XP', value: user?.xp ?? 0, icon: '⚡', color: 'var(--amber)' },
  ]

  const actions = [
    { to: '/quiz', icon: '⚡', label: 'Start Adaptive Quiz', desc: 'AI targets your weak topics', color: 'var(--cyan)', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
    { to: '/materials', icon: '📂', label: 'Upload Material', desc: 'PDF, DOCX or TXT → instant quiz', color: 'var(--cyan)', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
    { to: '/stats', icon: '◑', label: 'View Progress', desc: 'Charts by topic, AI coaching', color: 'var(--emerald)', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
    { to: '/badges', icon: '◈', label: 'My Badges', desc: 'Achievements & milestones', color: 'var(--amber)', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Hero */}
      <div className="anim-up d-0 card" style={{
        borderRadius: 20,
        padding: 32,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(129,140,248,0.06), transparent)',
      }}>
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.08), transparent 70%)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p className="t-cyan" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {greeting} 👋
            </p>

            <h1 className="h1">{user?.name}</h1>

            <p className="t-secondary" style={{ fontSize: 13, marginTop: 4 }}>
              Level {level} Explorer · {user?.xp ?? 0} XP earned
            </p>
          </div>

          {(user?.streak_days ?? 0) > 0 && (
            <div className="card-sm" style={{ textAlign: 'center', padding: '12px 18px' }}>
              <p style={{ fontSize: 28 }}>🔥</p>
              <p className="t-amber mono" style={{ fontSize: 15 }}>
                {user?.streak_days}
              </p>
              <p className="t-secondary" style={{ fontSize: 10 }}>
                day streak
              </p>
            </div>
          )}
        </div>

        {/* XP */}
        <div style={{ marginTop: 24 }}>
          <div className="t-secondary" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
            <span>Level {level} progress</span>
            <span className="mono">{xpInLevel} / 100 XP</span>
          </div>

          <div className="progress-track" style={{ height: 8 }}>
            <div className="progress-fill xp-bar" style={{ width: `${xpInLevel}%` }} />
          </div>

          <p className="t-muted" style={{ fontSize: 11, marginTop: 6 }}>
            {100 - xpInLevel} XP to reach Level {level + 1}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="anim-up d-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {statCards.map((s, i) => (
          <div key={s.label} className={`card-sm d-${i}`} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 22 }}>{s.icon}</p>
            <p className="stat-num" style={{ fontSize: 22, color: s.color }}>
              {s.value}
            </p>
            <p className="t-secondary" style={{ fontSize: 11 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* AI */}
      {stats?.ai_recommendation && (
        <div className="anim-up d-2 card" style={{ display: 'flex', gap: 16 }}>
          <div className="card-sm" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🤖
          </div>
          <div>
            <p className="t-cyan" style={{ fontSize: 12, fontWeight: 700 }}>
              AI Study Coach
            </p>
            <p className="t-primary" style={{ fontSize: 14, lineHeight: 1.7 }}>
              {stats.ai_recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="anim-up d-3">
        <p className="section-label" style={{ marginBottom: 14 }}>
          Quick Actions
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {actions.map(a => (
            <Link key={a.to} to={a.to} className="card-sm" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 18,
              textDecoration: 'none'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: `${a.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {a.icon}
              </div>

              <div style={{ flex: 1 }}>
                <p className="t-primary" style={{ fontWeight: 600, fontSize: 13 }}>
                  {a.label}
                </p>
                <p className="t-secondary" style={{ fontSize: 11 }}>
                  {a.desc}
                </p>
              </div>

              <span className="t-secondary">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}