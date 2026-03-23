import { useState, useEffect, useCallback } from 'react'
import { quizzesAPI, materialsAPI } from '../api'
import { useAuthStore } from '../store/authStore'

interface Question { id:number; question_text:string; options:string[]; topic:string; material_title?:string }
interface Result    { is_correct:boolean; correct_answer:number; explanation:string; xp_gained:number; new_total_xp:number; new_badges:string[] }
interface Material  { id:number; title:string }

export default function Quiz() {
  const { updateXP } = useAuthStore()
  const [question, setQuestion]     = useState<Question | null>(null)
  const [result, setResult]         = useState<Result | null>(null)
  const [selected, setSelected]     = useState<number | null>(null)
  const [loading, setLoading]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [sCorrect, setSCorrect]     = useState(0)
  const [sTotal, setSTotal]         = useState(0)
  const [materials, setMaterials]   = useState<Material[]>([])
  const [filterMat, setFilterMat]   = useState<number | undefined>()
  const [badges, setBadges]         = useState<string[]>([])
  const [seenIds, setSeenIds]       = useState<number[]>([])

  useEffect(() => { materialsAPI.list().then(r => setMaterials(r.data)).catch(() => {}) }, [])

  const fetchQ = useCallback(async () => {
    setLoading(true); setError(''); setResult(null); setSelected(null)
    try {
      const r = await quizzesAPI.next(filterMat, seenIds)
      setQuestion(r.data)
      setSeenIds(prev => {
        const updated = [...prev, r.data.id]
        // reset after seeing all questions (cycle complete)
        return updated
      })
    }
    catch (e: any) { setError(e.response?.data?.detail ?? 'No questions found. Upload study materials first.') }
    finally { setLoading(false) }
  }, [filterMat])

  useEffect(() => {
    setSeenIds([])
    fetchQ()
  }, [filterMat])

  const handleSelect = async (idx: number) => {
    if (result || submitting || !question) return
    setSelected(idx); setSubmitting(true)
    try {
      const r = await quizzesAPI.answer({ question_id: question.id, selected_answer: idx })
      setResult(r.data); setSTotal(t => t+1)
      if (r.data.is_correct) setSCorrect(c => c+1)
      updateXP(r.data.new_total_xp)
      if (r.data.new_badges.length > 0) { setBadges(r.data.new_badges); setTimeout(() => setBadges([]), 5000) }
    } catch { setResult(null); setSelected(null) }
    finally { setSubmitting(false) }
  }

  const acc = sTotal > 0 ? Math.round((sCorrect/sTotal)*100) : null
  const LETTERS = ['A','B','C','D']

  const optionState = (idx: number) => {
    if (!result) return idx === selected ? 'selected' : 'idle'
    if (idx === result.correct_answer) return 'correct'
    if (idx === selected && !result.is_correct) return 'wrong'
    return 'idle'
  }

  const optStyle = (state: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      cursor: result ? 'default' : 'pointer',
      borderRadius:12, padding:'14px 16px', transition:'all 0.15s',
      display:'flex', alignItems:'flex-start', gap:12,
      border:'1.5px solid', userSelect:'none'
    }
    if (state==='correct')  return { ...base, background:'rgba(52,211,153,0.1)',  borderColor:'var(--emerald)' }
    if (state==='wrong')    return { ...base, background:'rgba(248,113,113,0.1)', borderColor:'var(--red)' }
    if (state==='selected') return { ...base, background:'rgba(34,211,238,0.08)', borderColor:'var(--cyan)' }
    return { ...base, background:'var(--surface2)', borderColor:'var(--border)' }
  }

  const letterStyle = (state: string): React.CSSProperties => ({
    width:26, height:26, borderRadius:7, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:12, fontWeight:700, fontFamily:'JetBrains Mono',
    background: state==='correct' ? 'rgba(52,211,153,0.2)' : state==='wrong' ? 'rgba(248,113,113,0.2)' : state==='selected' ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)',
    color: state==='correct' ? 'var(--emerald)' : state==='wrong' ? 'var(--red)' : state==='selected' ? 'var(--cyan)' : 'var(--text2)'
  })

  return (
    <div style={{ maxWidth:660, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div className="anim-up d-0" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 className="h1" style={{ letterSpacing:'-0.02em' }}>
            Adaptive Quiz
          </h1>
          <p className="t-secondary" style={{ fontSize:13, marginTop:4 }}>
            AI selects questions based on your weak areas
          </p>
        </div>
        {sTotal > 0 && (
          <div style={{
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:14, padding:'12px 20px', textAlign:'center'
          }}>
            <p className="stat-num" style={{
              fontSize:24, fontWeight:600,
              color: (acc??0)>=70 ? 'var(--emerald)' : (acc??0)>=50 ? 'var(--amber)' : 'var(--red)'
            }}>{acc}%</p>
            <p style={{ color:'var(--text2)', fontSize:11 }}>{sCorrect}/{sTotal} correct</p>
          </div>
        )}
      </div>

      {/* Filter */}
      {materials.length > 0 && (
        <div className="anim-up d-1">
          <label className="label">Filter by material</label>
          <select className="input" value={filterMat??''} onChange={e => setFilterMat(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">All materials</option>
            {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      )}

      {/* Badge toasts */}
      {badges.map(b => (
        <div key={b} className="anim-right" style={{
          background:'var(--amber-dim)', border:'1px solid rgba(251,191,36,0.25)',
          borderRadius:12, padding:'14px 18px',
          display:'flex', alignItems:'center', gap:12
        }}>
          <span style={{ fontSize:22 }}>🏅</span>
          <div>
            <p style={{ color:'var(--amber)', fontWeight:700, fontSize:13 }}>Badge unlocked!</p>
            <p style={{ color:'var(--text2)', fontSize:12 }}>{b}</p>
          </div>
        </div>
      ))}

      {/* Loading */}
      {loading && (
        <div className="card anim-in" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:220 }}>
          <div style={{ textAlign:'center' }}>
            <span className="spin" style={{ display:'block', width:36, height:36, border:'2px solid var(--border2)', borderTopColor:'var(--cyan)', borderRadius:'50%', margin:'0 auto 14px' }} />
            <p style={{ color:'var(--text2)', fontSize:13 }}>Finding your next question…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card anim-scale" style={{ textAlign:'center', padding:'60px 32px' }}>
          <p style={{ fontSize:44, marginBottom:14 }}>📭</p>
          <p className="t-primary" style={{ fontWeight:600, fontSize:16, marginBottom:6 }}>{error}</p>
          <a href="/materials" className="btn-primary" style={{ display:'inline-flex', marginTop:16, fontSize:13, textDecoration:'none' }}>
            Upload Material →
          </a>
        </div>
      )}

      {/* Question card */}
      {!loading && question && (
        <div className="card anim-scale" style={{ padding:28 }}>
          {/* Meta */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:18 }}>
            <span className="chip chip-cyan">{question.topic}</span>
            {question.material_title && (
              <span style={{ color:'var(--text2)', fontSize:12 }}>
                📖 {question.material_title}
              </span>
            )}
          </div>

          {/* Question */}
          <p className="t-primary" style={{ fontSize:16, fontWeight:600, lineHeight:1.6, marginBottom:22, fontFamily:'Syne' }}>
            {question.question_text}
          </p>

          {/* Options */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {question.options.map((opt, idx) => {
              const state = optionState(idx)
              return (
                <div key={idx} style={optStyle(state)} onClick={() => handleSelect(idx)}>
                  <div style={letterStyle(state)}>{LETTERS[idx]}</div>
                  <p style={{
                    fontSize:14, lineHeight:1.6, flex:1, margin:0, paddingTop:2,
                    color: state==='correct' ? 'var(--emerald)' : state==='wrong' ? 'var(--red)' : 'var(--text)'
                  }}>{opt}</p>
                  {result && state==='correct' && <span style={{ color:'var(--emerald)', flexShrink:0, marginTop:2 }}>✓</span>}
                  {result && state==='wrong'   && <span style={{ color:'var(--red)',     flexShrink:0, marginTop:2 }}>✗</span>}
                </div>
              )
            })}
          </div>

          {/* Submitting hint */}
          {submitting && (
            <p style={{ color:'var(--text2)', fontSize:12, textAlign:'center', marginTop:14 }}>
              Checking answer…
            </p>
          )}
          {!result && !submitting && (
            <p style={{ color:'var(--text3)', fontSize:12, textAlign:'center', marginTop:14 }}>
              Select an option to answer
            </p>
          )}

          {/* Result feedback */}
          {result && (
            <div className="anim-up" style={{
              marginTop:20, borderRadius:14, padding:'18px 20px',
              background: result.is_correct ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
              border: `1px solid ${result.is_correct ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:18 }}>{result.is_correct ? '✅' : '❌'}</span>
                <span style={{ color: result.is_correct ? 'var(--emerald)' : 'var(--red)', fontWeight:700, fontSize:15 }}>
                  {result.is_correct ? 'Correct!' : 'Not quite'}
                </span>
                <span className="chip chip-amber" style={{ marginLeft:'auto' }}>
                  ⚡ +{result.xp_gained} XP
                </span>
              </div>
              <p style={{ color:'var(--text)', fontSize:13, lineHeight:1.7 }}>
                {result.explanation}
              </p>
              <button className="btn-primary" onClick={fetchQ}
                style={{ width:'100%', marginTop:18, fontSize:14, height:44 }}>
                Next Question →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}