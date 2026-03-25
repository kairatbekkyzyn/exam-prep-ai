import { useEffect, useState } from 'react'
import { quizzesAPI } from '../api'

interface Badge { key:string; name:string; description:string; icon:string; earned:boolean; earned_at?:string }

export default function Badges() {
  const [badges, setBadges]   = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { quizzesAPI.badges().then(r => setBadges(r.data)).finally(() => setLoading(false)) }, [])

  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)
  const pct    = badges.length ? Math.round((earned.length/badges.length)*100) : 0

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
      <span className="spin" style={{ display:'block', width:30, height:30, border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'var(--cyan)', borderRadius:'50%' }} />
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div className="anim-up d-0">
        <h1 className="h1">Achievements</h1>
        <p className="t-secondary" style={{ fontSize:13, marginTop:4 }}>
          {earned.length} of {badges.length} badges earned
        </p>
      </div>
      

      {/* Progress card */}
      <div className="anim-up d-1" style={{
        background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.15)',
        borderRadius:16, padding:22, display:'flex', alignItems:'center', gap:20
      }}>
        <div style={{ fontSize:40 }}>🏆</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <p className="t-primary" style={{ fontWeight:700, fontSize:15 }}>
              Badge Collection
            </p>
            <span className="stat-num" style={{ color:'var(--amber)', fontSize:18, fontWeight:700 }}>{pct}%</span>
          </div>
          <div className="progress-track">
            <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg, var(--amber), #fb923c)', width:`${pct}%`, transition:'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
          <p style={{ color:'var(--text2)', fontSize:12, marginTop:6 }}>{earned.length} earned · {locked.length} remaining</p>
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="anim-up d-2">
          <p style={{ fontSize:11, fontWeight:700, color:'var(--amber)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>
            ✨ Earned ({earned.length})
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {earned.map((b, i) => (
              <div key={b.key} className={`anim-scale d-${Math.min(i,4)}`} style={{
                background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.18)',
                borderRadius:14, padding:'20px 16px', textAlign:'center',
                transition:'all 0.2s', cursor:'default'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(251,191,36,0.15)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}
              >
                <span style={{ fontSize:36, display:'block', marginBottom:10 }}>{b.icon}</span>
                <p className="t-primary" style={{ fontWeight:700, fontSize:13, fontFamily:'Syne' }}>
                  {b.name}
                </p>                <p style={{ color:'var(--text2)', fontSize:11, marginTop:6, lineHeight:1.5 }}>{b.description}</p>
                {b.earned_at && (
                  <p style={{ color:'rgba(251,191,36,0.5)', fontSize:10, marginTop:10, borderTop:'1px solid rgba(251,191,36,0.1)', paddingTop:8 }}>
                    {new Date(b.earned_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div className="anim-up d-3">
          <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>
            🔒 Locked ({locked.length})
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {locked.map(b => (
              <div key={b.key} style={{
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:14, padding:'20px 16px', textAlign:'center', opacity:0.4, filter:'grayscale(1)'
              }}>
                <span style={{ fontSize:36, display:'block', marginBottom:10 }}>{b.icon}</span>
                <p className="t-primary" style={{ fontWeight:700, fontSize:13, fontFamily:'Syne' }}>
                  {b.name}
                </p>                <p style={{ color:'var(--text2)', fontSize:11, marginTop:6, lineHeight:1.5 }}>{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="card" style={{ textAlign:'center', padding:'80px 40px' }}>
          <p style={{ fontSize:48, marginBottom:14 }}>🏆</p>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Answer quiz questions to unlock badges!</p>
        </div>
      )}
    </div>
  )
}