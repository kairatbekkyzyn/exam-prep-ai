import { useState, useEffect, FormEvent, useRef, DragEvent } from 'react'
import { materialsAPI } from '../api'

interface Material {
  id: number; title: string; content: string; question_count: number; created_at: string
}

type Tab = 'file' | 'text'

const ACCEPT = '.pdf,.docx,.txt,.jpg,.jpeg,.png,.webp'
const FILE_ICONS: Record<string, string> = { pdf:'📄', docx:'📝', txt:'📃', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', webp:'🖼️' }

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [tab, setTab]             = useState<Tab>('file')
  const [title, setTitle]         = useState('')
  const [content, setContent]     = useState('')
  const [numQ, setNumQ]           = useState(8)
  const [file, setFile]           = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(true)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const fileRef                   = useRef<HTMLInputElement>(null)

  const fetchMaterials = async () => {
    setFetching(true)
    try { const r = await materialsAPI.list(); setMaterials(r.data) }
    finally { setFetching(false) }
  }
  useEffect(() => { fetchMaterials() }, [])

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }
  const acceptFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['pdf','docx','txt','jpg','jpeg','png','webp'].includes(ext)) { setError('Only PDF, DOCX, or TXT files are supported.'); return }
    setFile(f); setError('')
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g,' '))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (tab === 'file') {
        if (!file) { setError('Please select a file.'); setLoading(false); return }
        const fd = new FormData()
        fd.append('file', file)
        if (title) fd.append('title', title)
        fd.append('num_questions', String(numQ))
        await materialsAPI.upload(fd)
      } else {
        if (content.trim().length < 100) { setError('Please enter at least 100 characters.'); setLoading(false); return }
        if (!title.trim()) { setError('Please enter a title.'); setLoading(false); return }
        await materialsAPI.create({ title, content, num_questions: numQ })
      }
      setFile(null); setTitle(''); setContent(''); setNumQ(8); setShowForm(false)
      setSuccess(`Material uploaded — AI generated ${numQ} questions! Head to the Quiz page to start.`)
      setTimeout(() => setSuccess(''), 5000)
      await fetchMaterials()
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed. Check your Groq API key in .env')
    } finally { setLoading(false) }
  }

  const ext = (f: File) => f.name.split('.').pop()?.toLowerCase() ?? ''

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div className="anim-up d-0" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontFamily:'Syne', fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em' }}>
            Study Materials
          </h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>
            Upload files or paste text — AI generates quiz questions instantly
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}
          style={{ gap:8, fontSize:13, padding:'10px 18px' }}>
          {showForm ? '✕ Cancel' : '+ Add Material'}
        </button>
      </div>

      {success && (
        <div className="anim-right" style={{
          background:'var(--em-dim)', border:'1px solid rgba(52,211,153,0.2)',
          borderRadius:12, padding:'14px 18px', color:'var(--emerald)', fontSize:13,
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:12
        }}>
          <span>✅ {success}</span>
          <a href="/quiz" style={{
            background:'var(--emerald)', color:'#06080d', fontWeight:700, fontSize:12,
            padding:'6px 14px', borderRadius:8, textDecoration:'none', whiteSpace:'nowrap',
            transition:'opacity 0.15s'
          }}>Go to Quiz →</a>
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="card anim-scale" style={{ border:'1px solid rgba(34,211,238,0.15)', padding:28 }}>
          <h3 style={{ fontFamily:'Syne', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:20 }}>
            Add New Material
          </h3>

          {/* Tab switcher */}
          <div style={{
            display:'flex', background:'var(--surface2)', borderRadius:10,
            padding:4, marginBottom:24, gap:4
          }}>
            {(['file','text'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, padding:'8px', borderRadius:7, border:'none', cursor:'pointer',
                fontFamily:'Manrope', fontWeight:600, fontSize:13, transition:'all 0.2s',
                background: tab===t ? 'var(--surface)' : 'transparent',
                color: tab===t ? 'var(--text)' : 'var(--text2)',
                boxShadow: tab===t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none'
              }}>
                {t==='file' ? '📁 Upload File' : '📋 Paste Text'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              background:'var(--red-dim)', border:'1px solid rgba(248,113,113,0.2)',
              borderRadius:10, padding:'12px 16px', marginBottom:16,
              color:'var(--red)', fontSize:13
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {tab === 'file' ? (
              <>
                {/* Drop zone */}
                <div
                  className={`drop-zone${dragging ? ' dragging' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <input ref={fileRef} type="file" accept={ACCEPT} style={{ display:'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }} />
                  {file ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:40 }}>{FILE_ICONS[ext(file)] ?? '📎'}</span>
                      <p style={{ color:'var(--text)', fontWeight:600, fontSize:14 }}>{file.name}</p>
                      <p style={{ color:'var(--text2)', fontSize:12 }}>
                        {(file.size/1024).toFixed(0)} KB
                      </p>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                        className="chip chip-red" style={{ cursor:'pointer' }}>
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:44 }}>☁</span>
                      <p style={{ color:'var(--text)', fontWeight:600, fontSize:15 }}>
                        Drop your file here
                      </p>
                      <p style={{ color:'var(--text2)', fontSize:13 }}>
                        or click to browse
                      </p>
                      <div style={{ display:'flex', gap:8, marginTop:4 }}>
                        {['PDF','DOCX','TXT','JPG','PNG'].map(t => (
                          <span key={t} className="chip chip-slate">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional title override */}
                <div>
                  <label className="label">Title (optional — auto-detected from filename)</label>
                  <input className="input" type="text" placeholder="e.g. Database Systems Chapter 3"
                    value={title} onChange={e => setTitle(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Title</label>
                  <input className="input" type="text" placeholder="e.g. Operating Systems Lecture 4"
                    value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Content</label>
                  <textarea className="input" placeholder="Paste your lecture notes, textbook text, or any study material here…"
                    value={content} onChange={e => setContent(e.target.value)} required />
                  <p style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
                    {content.length} chars{content.length > 0 && content.length < 100
                      ? <span style={{ color:'var(--amber)' }}> — need {100-content.length} more</span>
                      : content.length >= 100
                        ? <span style={{ color:'var(--emerald)' }}> ✓</span>
                        : null
                    }
                  </p>
                </div>
              </>
            )}

            {/* Question count slider */}
            <div>
              <label className="label">
                Questions to generate —{' '}
                <span style={{ color:'var(--text)', textTransform:'none', fontFamily:'JetBrains Mono' }}>{numQ}</span>
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ color:'var(--text2)', fontSize:11, width:30, textAlign:'center' }}>3</span>
                <input type="range" min={3} max={15} value={numQ}
                  onChange={e => setNumQ(Number(e.target.value))}
                  style={{ flex:1, accentColor:'var(--cyan)', cursor:'pointer' }} />
                <span style={{ color:'var(--text2)', fontSize:11, width:30, textAlign:'center' }}>15</span>
              </div>
            </div>

            <div style={{ display:'flex', gap:12, paddingTop:4 }}>
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ padding:'11px 24px', fontSize:14 }}>
                {loading ? (
                  <><span className="spin" style={{display:'inline-block',width:15,height:15,border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#06080d',borderRadius:'50%'}} /> Generating questions…</>
                ) : `🤖 Generate ${numQ} Questions`}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}
                style={{ padding:'11px 20px', fontSize:14 }}>
                Cancel
              </button>
            </div>
            {loading && (
              <p style={{ color:'var(--text2)', fontSize:12, fontStyle:'italic' }}>
                ⏳ AI is reading your material and creating questions… (10–20 seconds)
              </p>
            )}
          </form>
        </div>
      )}

      {/* Materials list */}
      {fetching ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <span className="spin" style={{ display:'inline-block', width:28, height:28, border:'2px solid var(--border2)', borderTopColor:'var(--cyan)', borderRadius:'50%' }} />
        </div>
      ) : materials.length === 0 ? (
        <div className="card anim-up" style={{ textAlign:'center', padding:'80px 40px' }}>
          <p style={{ fontSize:48, marginBottom:16 }}>📂</p>
          <h3 style={{ fontFamily:'Syne', color:'var(--text)', fontWeight:700, fontSize:18, marginBottom:8 }}>
            No materials yet
          </h3>
          <p style={{ color:'var(--text2)', fontSize:13, maxWidth:300, margin:'0 auto 24px' }}>
            Upload your first PDF, DOCX, or TXT file and get an AI-powered quiz in seconds
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}
            style={{ fontSize:14, padding:'11px 22px' }}>
            + Add First Material
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {materials.map((m, i) => (
            <div key={m.id} className={`anim-up d-${Math.min(i,4)}`}
              style={{
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:14, padding:'16px 20px',
                display:'flex', alignItems:'center', gap:16,
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLElement).style.background='var(--surface2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border)';  (e.currentTarget as HTMLElement).style.background='var(--surface)' }}
            >
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0,
                background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20
              }}>📖</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:'var(--text)', fontWeight:600, fontSize:14 }}>{m.title}</p>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:5 }}>
                  <span className="chip chip-cyan" style={{ fontSize:10 }}>
                    {m.question_count} questions
                  </span>
                  <span style={{ color:'var(--text3)', fontSize:11 }}>
                    {new Date(m.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!confirm('Delete this material and all its questions?')) return
                  setDeleting(m.id)
                  materialsAPI.delete(m.id)
                    .then(() => setMaterials(ms => ms.filter(x => x.id !== m.id)))
                    .finally(() => setDeleting(null))
                }}
                disabled={deleting === m.id}
                className="chip chip-red"
                style={{ cursor:'pointer', border:'none', flexShrink:0, opacity: deleting===m.id ? 0.5 : 1 }}
              >
                {deleting === m.id ? '…' : '✕ Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}