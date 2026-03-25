import { useEffect, useState } from 'react'
import { statsAPI } from '../api'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

interface TopicStat { topic:string; total:number; correct:number; accuracy:number }
interface Stats { total_attempts:number; correct_attempts:number; overall_accuracy:number; xp:number; streak_days:number; topics:TopicStat[]; ai_recommendation:string }

const C = (a:number) => a>=0.75 ? '#34d399' : a>=0.5 ? '#fbbf24' : '#f87171'

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0c0f18', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'#e2e8f0', fontWeight:600, marginBottom:4 }}>{label}</p>
      <p style={{ color:C(payload[0].value/100), fontWeight:700, fontFamily:'JetBrains Mono' }}>{payload[0].value}%</p>
    </div>
  )
}

export default function Stats() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { statsAPI.get().then(r => setStats(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
      <span className="spin" style={{ display:'block', width:30, height:30, border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'var(--cyan)', borderRadius:'50%' }} />
    </div>
  )

  if (!stats || stats.total_attempts === 0) return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h1 style={{ fontFamily:'Syne', fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em' }}>Progress</h1>
      <div className="card" style={{ textAlign:'center', padding:'80px 40px' }}>
        <p style={{ fontSize:48, marginBottom:14 }}>📊</p>
        <p style={{ color:'var(--text)', fontWeight:600, fontSize:16, marginBottom:6 }}>No data yet</p>
        <p style={{ color:'var(--text2)', fontSize:13 }}>Answer quiz questions to see your analytics</p>
      </div>
    </div>
  )

  const acc      = Math.round(stats.overall_accuracy*100)
  const radar    = stats.topics.slice(0,8).map(t => ({ topic: t.topic.length>14 ? t.topic.slice(0,12)+'…' : t.topic, score: Math.round(t.accuracy*100) }))
  const bars     = [...stats.topics].sort((a,b) => a.accuracy-b.accuracy).slice(0,7).map(t => ({ topic: t.topic.length>16 ? t.topic.slice(0,14)+'…' : t.topic, acc: Math.round(t.accuracy*100) }))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <h1 className="anim-up d-0" style={{ fontFamily:'Syne', fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em' }}>
        Progress
      </h1>

      {/* Summary row */}
      <div className="anim-up d-1" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:'Questions',  v: stats.total_attempts,     sub:`${stats.correct_attempts} correct`,       color:'var(--cyan)' },
          { label:'Accuracy',   v:`${acc}%`,                 sub:'overall score',                          color:C(stats.overall_accuracy) },
          { label:'Streak',     v:`${stats.streak_days}🔥`,  sub:'consecutive days',                       color:'#fb923c' },
          { label:'XP',         v:stats.xp,                  sub:`Level ${Math.floor(stats.xp/100)+1}`,    color:'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="card-sm" style={{ textAlign:'center' }}>
            <p className="stat-num" style={{ fontSize:22, fontWeight:600, color:s.color }}>{s.v}</p>
            <p style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>{s.sub}</p>
            <p style={{ fontSize:10, color:'var(--text3)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Coach */}
      <div className="anim-up d-2" style={{
        background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.12)',
        borderRadius:16, padding:20, display:'flex', gap:14
      }}>
        <div style={{ width:38, height:38, flexShrink:0, borderRadius:10, background:'rgba(34,211,238,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🤖</div>
        <div>
          <p style={{ color:'var(--cyan)', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>AI Recommendation</p>
          <p style={{ color:'var(--text)', fontSize:13, lineHeight:1.7 }}>{stats.ai_recommendation}</p>
        </div>
      </div>

      {/* Charts */}
      {stats.topics.length >= 2 && (
        <div className="anim-up d-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="card" style={{ padding:22 }}>
            <p style={{ fontFamily:'Syne', color:'var(--text)', fontWeight:700, fontSize:14, marginBottom:18 }}>Topic Coverage</p>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={radar}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize:9, fill:'#475569' }} />
                <Radar dataKey="score" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding:22 }}>
            <p style={{ fontFamily:'Syne', color:'var(--text)', fontWeight:700, fontSize:14, marginBottom:18 }}>Weakest Topics</p>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={bars} layout="vertical" margin={{ left:0, right:20 }}>
                <XAxis type="number" domain={[0,100]} tick={{ fontSize:9, fill:'#334155' }} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="topic" tick={{ fontSize:9, fill:'#64748b' }} width={88} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="acc" radius={[0,6,6,0]} maxBarSize={18}>
                  {bars.map((e,i) => <Cell key={i} fill={C(e.acc/100)} fillOpacity={0.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Topic list */}
      <div className="card anim-up d-4" style={{ padding:24 }}>
        <p style={{ fontFamily:'Syne', color:'var(--text)', fontWeight:700, fontSize:14, marginBottom:20 }}>All Topics</p>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {stats.topics.map(t => {
            const pct = Math.round(t.accuracy*100)
            const c   = C(t.accuracy)
            return (
              <div key={t.topic}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <span style={{ color:c, fontSize:12 }}>{pct>=70?'↑':pct>=50?'→':'↓'}</span>
                    <span style={{ color:'var(--text)', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.topic}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginLeft:12 }}>
                    <span style={{ color:'var(--text3)', fontSize:11, fontFamily:'JetBrains Mono' }}>{t.correct}/{t.total}</span>
                    <span className="stat-num" style={{ color:c, fontSize:13, fontWeight:600, minWidth:36, textAlign:'right' }}>{pct}%</span>
                  </div>
                </div>
                <div className="progress-track">
                  <div style={{ height:'100%', borderRadius:99, background:c, opacity:0.65, width:`${pct}%`, transition:'width 0.7s cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}