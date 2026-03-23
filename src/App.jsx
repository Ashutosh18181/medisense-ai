import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
//  ⚡ SUPABASE CONFIG
// ═══════════════════════════════════════════════════════════
const SUPA_URL  = "https://tuudrtqhxmozlxyhkcue.supabase.co";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dWRydHFoeG1vemx4eWhrY3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTU5NDksImV4cCI6MjA4OTc3MTk0OX0.k-yx-ulJ_nOdswz5VOAg8J7L5-LWWLc9inU68SBjbWE";
const ADMIN_PW  = "Ash1";
const AI_API    = "https://api.anthropic.com/v1/messages";
const MODEL     = "claude-sonnet-4-20250514";

// ── Supabase helpers ──────────────────────────────────────
const supa = {
  headers: { "Content-Type": "application/json",
    "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  },,
    "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  },, "apikey": SUPA_ANON, "Authorization": `Bearer ${SUPA_ANON}` },

  // Auth
  async signUp(email, password, name) {
    const r = await fetch(`${SUPA_URL}/auth/v1/signup`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password, data: { full_name: name } }),
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPA_URL}/auth/v1/logout`, {
      method: "POST", headers: { ...this.headers, "Authorization": `Bearer ${token}` },
    });
  },
  async getUser(token) {
    const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { ...this.headers, "Authorization": `Bearer ${token}` },
    });
    return r.json();
  },

  // Health sessions
  async getSessions(token) {
    const r = await fetch(`${SUPA_URL}/rest/v1/health_sessions?select=*&order=created_at.desc`, {
      headers: { ...this.headers, "Authorization": `Bearer ${token}` },
    });
    return r.json();
  },
  async addSession(token, data) {
    await fetch(`${SUPA_URL}/rest/v1/health_sessions`, {
      method: "POST",
      headers: { ...this.headers, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" },
      body: JSON.stringify(data),
    });
  },
  async deleteSession(token, id) {
    await fetch(`${SUPA_URL}/rest/v1/health_sessions?id=eq.${id}`, {
      method: "DELETE",
      headers: { ...this.headers, "Authorization": `Bearer ${token}` },
    });
  },
  async clearSessions(token, userId) {
    await fetch(`${SUPA_URL}/rest/v1/health_sessions?user_id=eq.${userId}`, {
      method: "DELETE",
      headers: { ...this.headers, "Authorization": `Bearer ${token}` },
    });
  },

  // Announcements
  async getAnnouncements() {
    const r = await fetch(`${SUPA_URL}/rest/v1/announcements?select=*&order=created_at.desc`, {
      headers: this.headers,
    });
    return r.json();
  },
  async addAnnouncement(data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/announcements`, {
      method: "POST",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async deleteAnnouncement(id) {
    await fetch(`${SUPA_URL}/rest/v1/announcements?id=eq.${id}`, {
      method: "DELETE", headers: this.headers,
    });
  },

  // Admin: all sessions
  async getAllSessions() {
    const r = await fetch(`${SUPA_URL}/rest/v1/health_sessions?select=*&order=created_at.desc`, {
      headers: this.headers,
    });
    return r.json();
  },
};

// ── App constants ─────────────────────────────────────────
const LANGS = {
  en: { flag:"🇬🇧", ph:"e.g. headache, fever, sore throat for 2 days...", hl:"en-IN" },
  hi: { flag:"🇮🇳", ph:"जैसे: सिरदर्द, बुखार और गले में दर्द...",       hl:"hi-IN" },
  ta: { flag:"🏳️", ph:"எ.கா: தலைவலி, காய்ச்சல்...",                     hl:"ta-IN" },
};
const SAMPLES = {
  en: ["Headache, fever, sore throat 2 days","Chest pain, shortness of breath","Stomach ache, nausea, vomiting","Skin rash with itching"],
  hi: ["सिरदर्द, बुखार, गले में दर्द","छाती में दर्द","पेट दर्द और मतली","त्वचा पर खुजली"],
  ta: ["தலைவலி, காய்ச்சல்","மார்பு வலி","வயிற்று வலி","தோல் அரிப்பு"],
};
const BPARTS = [
  {id:"head",   label:"Head",      sx:43,sy:3, sw:14,sh:11,q:"headache fever"},
  {id:"throat", label:"Throat",    sx:46,sy:15,sw:8, sh:5, q:"sore throat cough"},
  {id:"chest",  label:"Chest",     sx:36,sy:21,sw:28,sh:13,q:"chest pain breathing"},
  {id:"belly",  label:"Stomach",   sx:36,sy:35,sw:28,sh:11,q:"stomach pain nausea"},
  {id:"larm",   label:"Left Arm",  sx:18,sy:21,sw:16,sh:22,q:"left arm pain"},
  {id:"rarm",   label:"Right Arm", sx:66,sy:21,sw:16,sh:22,q:"right arm pain"},
  {id:"lleg",   label:"Left Leg",  sx:34,sy:47,sw:13,sh:30,q:"left leg pain"},
  {id:"rleg",   label:"Right Leg", sx:53,sy:47,sw:13,sh:30,q:"right leg pain"},
];
const SEV = {
  mild:      {bg:"rgba(16,185,129,.12)",bd:"rgba(16,185,129,.4)",tx:"#6ee7b7",dt:"#10b981"},
  moderate:  {bg:"rgba(245,158,11,.12)",bd:"rgba(245,158,11,.4)",tx:"#fcd34d",dt:"#f59e0b"},
  severe:    {bg:"rgba(249,115,22,.12)",bd:"rgba(249,115,22,.4)",tx:"#fdba74",dt:"#f97316"},
  emergency: {bg:"rgba(239,68,68,.15)", bd:"rgba(239,68,68,.5)", tx:"#fca5a5",dt:"#ef4444"},
};
const VOICE_PHRASES = {
  en:["I have fever and headache since yesterday","My chest hurts when I breathe","I have stomach ache and nausea"],
  hi:["मुझे कल से बुखार और सिरदर्द है","मेरे सीने में दर्द है"],
  ta:["நேற்று முதல் காய்ச்சல்","மார்பு வலி உள்ளது"],
};

const getSys = (lang) =>
  `You are MediSense AI. Analyze symptoms. Respond ONLY in valid JSON no markdown:
{"conditions":[{"name":"","description":"","severity":"mild","match":80}],"homeRemedies":[{"title":"","description":"","icon":"🌿"}],"specialist":"","specialistReason":"","specialistQuery":"general physician near me","isEmergency":false,"emergencyMessage":"","generalAdvice":""}
Respond in ${lang==="hi"?"Hindi":lang==="ta"?"Tamil":"English"}.`;

const getMedSys = () =>
  `You are a pharmacist AI. Check medicine interactions. Respond ONLY in JSON:
{"interactions":[{"medicines":["",""],"severity":"mild","effect":"","advice":""}],"safe":true,"summary":""}`;

function exportReport(symptoms, result, vitals) {
  const lines = ["MEDISENSE AI HEALTH REPORT",`Date: ${new Date().toLocaleString()}`,"─".repeat(40),
    `SYMPTOMS: ${symptoms}`,`VITALS: BP:${vitals.bp||"N/A"} Temp:${vitals.temp||"N/A"}C HR:${vitals.hr||"N/A"} Sugar:${vitals.sugar||"N/A"} SpO2:${vitals.spo2||"N/A"}%`,
    "─".repeat(40),"CONDITIONS:",...(result.conditions||[]).map(c=>`- ${c.name} (${c.match}% ${c.severity}): ${c.description}`),
    "─".repeat(40),"REMEDIES:",...(result.homeRemedies||[]).map(r=>`${r.icon} ${r.title}: ${r.description}`),
    "─".repeat(40),`SPECIALIST: ${result.specialist||"GP"} — ${result.specialistReason||""}`,"─".repeat(40),
    result.generalAdvice||"","─".repeat(40),"AI-generated. NOT a substitute for professional medical advice."];
  const blob=new Blob([lines.join("\n")],{type:"text/plain"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download="MediSense-Report.txt";a.click();URL.revokeObjectURL(url);
}

// ── Shared UI atoms ───────────────────────────────────────
function MatchBar({pct,color}){
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),120);return()=>clearTimeout(t);},[pct]);
  return <div style={{height:3,background:"rgba(255,255,255,.08)",borderRadius:99,overflow:"hidden",margin:"6px 0"}}><div style={{height:"100%",width:`${w}%`,background:color,borderRadius:99,transition:"width 1s ease"}}/></div>;
}
function Btn({onClick,disabled,grad,danger,full,sm,children,style}){
  return <button onClick={onClick} disabled={disabled} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:disabled?"rgba(128,128,128,.2)":danger?"rgba(239,68,68,.15)":grad?"linear-gradient(135deg,#38bdf8,#818cf8)":"rgba(255,255,255,.07)",border:danger?"1px solid rgba(239,68,68,.4)":"1px solid rgba(255,255,255,.1)",borderRadius:11,padding:sm?"7px 12px":"9px 16px",color:disabled?"rgba(255,255,255,.3)":danger?"#fca5a5":grad?"white":"rgba(255,255,255,.6)",fontSize:sm?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",width:full?"100%":undefined,transition:"all .2s",...(style||{})}}>{children}</button>;
}

// ════════════════════════════════════════════════════════════
//  ADMIN LOGIN
// ════════════════════════════════════════════════════════════
function AdminLoginPage({onSuccess,onBack}){
  const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [show,setShow]=useState(false); const [shake,setShake]=useState(false);
  const attempt=()=>{
    if(pw===ADMIN_PW){onSuccess();}
    else{setErr("Incorrect admin password.");setShake(true);setTimeout(()=>setShake(false),500);setPw("");}
  };
  return(
    <div style={{minHeight:"100vh",background:"#07090f",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif",color:"white"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(239,68,68,.06) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(245,158,11,.06) 0%,transparent 70%)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:380,padding:"0 20px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:13,fontFamily:"inherit",marginBottom:28,display:"flex",alignItems:"center",gap:6}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:64,height:64,background:"linear-gradient(135deg,#f59e0b,#ef4444)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 14px",boxShadow:"0 8px 32px rgba(245,158,11,.25)"}}>🛡️</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,marginBottom:6}}>Admin Access</h1>
          <p style={{color:"rgba(255,255,255,.4)",fontSize:14}}>Enter admin password to continue</p>
        </div>
        <div style={{animation:shake?"shake .4s ease":undefined,marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.45)",display:"block",marginBottom:8}}>Admin Password</label>
          <div style={{position:"relative"}}>
            <input value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} type={show?"text":"password"} placeholder="Enter password"
              style={{width:"100%",background:"rgba(255,255,255,.05)",border:`1px solid ${err?"rgba(239,68,68,.5)":"rgba(255,255,255,.1)"}`,borderRadius:13,padding:"13px 44px 13px 14px",color:"white",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",letterSpacing:"0.1em"}}/>
            <button onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:16}}>{show?"🙈":"👁️"}</button>
          </div>
          {err&&<p style={{color:"#fca5a5",fontSize:12,marginTop:7,fontWeight:600}}>⚠️ {err}</p>}
        </div>
        <button onClick={attempt} style={{width:"100%",background:pw?"linear-gradient(135deg,#f59e0b,#ef4444)":"rgba(128,128,128,.2)",border:"none",borderRadius:13,padding:"14px",color:"white",fontWeight:800,fontSize:15,cursor:pw?"pointer":"not-allowed",fontFamily:"inherit",marginBottom:16,boxSizing:"border-box",transition:"all .2s"}}>
          🛡️ Enter Admin Panel
        </button>
        <p style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,.2)"}}>Restricted access. Authorised personnel only.</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMIN PANEL — Connected to Supabase
// ════════════════════════════════════════════════════════════
function AdminPanel({onLogout}){
  const [activeTab,setActiveTab]=useState("overview");
  const [sessions,setSessions]=useState([]);
  const [announcements,setAnnouncements]=useState([]);
  const [loading,setLoading]=useState(true);
  const [newTitle,setNewTitle]=useState(""); const [newBody,setNewBody]=useState("");
  const [posting,setPosting]=useState(false);

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{
        const [s,a]=await Promise.all([supa.getAllSessions(),supa.getAnnouncements()]);
        setSessions(Array.isArray(s)?s:[]);
        setAnnouncements(Array.isArray(a)?a:[]);
      }catch(e){}finally{setLoading(false);}
    };
    load();
  },[]);

  const addAnnouncement=async()=>{
    if(!newTitle.trim()||!newBody.trim())return;
    setPosting(true);
    try{
      const res=await supa.addAnnouncement({title:newTitle.trim(),body:newBody.trim(),active:true});
      if(Array.isArray(res)&&res[0])setAnnouncements(p=>[res[0],...p]);
      else setAnnouncements(p=>[{id:Date.now(),title:newTitle.trim(),body:newBody.trim(),active:true,created_at:new Date().toISOString()},...p]);
      setNewTitle(""); setNewBody("");
    }catch(e){}finally{setPosting(false);}
  };

  const deleteAnnouncement=async(id)=>{
    await supa.deleteAnnouncement(id);
    setAnnouncements(p=>p.filter(a=>a.id!==id));
  };

  const sevCounts={mild:0,moderate:0,severe:0,emergency:0};
  sessions.forEach(s=>{const sv=s.result?.conditions?.[0]?.severity||"mild";sevCounts[sv]=(sevCounts[sv]||0)+1;});

  // Unique users from sessions
  const uniqueUsers=[...new Map(sessions.map(s=>[s.user_id,s])).values()];

  const stats=[
    {icon:"📋",label:"Total Queries",  value:sessions.length,      color:"#7dd3fc",bg:"rgba(56,189,248,.1)", bd:"rgba(56,189,248,.25)"},
    {icon:"👥",label:"Unique Users",   value:uniqueUsers.length,   color:"#c4b5fd",bg:"rgba(139,92,246,.1)", bd:"rgba(139,92,246,.25)"},
    {icon:"🚨",label:"Severe Cases",   value:sevCounts.severe+sevCounts.emergency, color:"#fca5a5",bg:"rgba(239,68,68,.1)", bd:"rgba(239,68,68,.25)"},
    {icon:"📢",label:"Announcements",  value:announcements.length, color:"#fcd34d",bg:"rgba(245,158,11,.1)", bd:"rgba(245,158,11,.25)"},
  ];

  const condStats=sessions.reduce((acc,s)=>{const n=s.result?.conditions?.[0]?.name||"Unknown";acc[n]=(acc[n]||0)+1;return acc;},{});

  const TABS=[{id:"overview",ic:"📊",lb:"Overview"},{id:"queries",ic:"📋",lb:"Queries"},{id:"analytics",ic:"📈",lb:"Analytics"},{id:"announce",ic:"📢",lb:"Announce"},{id:"settings",ic:"⚙️",lb:"Settings"}];

  return(
    <div style={{fontFamily:"'Nunito',sans-serif",background:"#07090f",minHeight:"100vh",color:"white"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        input:focus,textarea:focus{outline:none}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
      `}</style>

      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-10%",left:0,width:"50%",height:"50%",background:"radial-gradient(ellipse,rgba(245,158,11,.04) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-10%",right:0,width:"50%",height:"50%",background:"radial-gradient(ellipse,rgba(239,68,68,.04) 0%,transparent 70%)"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,maxWidth:520,margin:"0 auto",padding:"0 14px 80px"}}>
        {/* Header */}
        <div style={{paddingTop:22,paddingBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,background:"linear-gradient(135deg,#f59e0b,#ef4444)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🛡️</div>
              <div>
                <p style={{fontWeight:800,fontSize:15}}>Admin Panel</p>
                <p style={{fontSize:9,color:"rgba(255,255,255,.4)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>MediSense AI · Supabase Live</p>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.25)",borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:6,height:6,background:"#10b981",borderRadius:"50%"}}/>
                <span style={{fontSize:11,color:"#6ee7b7",fontWeight:700}}>Live</span>
              </div>
              <button onClick={onLogout} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,padding:"7px 14px",color:"#fca5a5",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
            </div>
          </div>
          <div style={{background:"linear-gradient(135deg,rgba(245,158,11,.12),rgba(239,68,68,.12))",border:"1px solid rgba(245,158,11,.25)",borderRadius:16,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>👋</span>
            <div>
              <p style={{fontWeight:700,fontSize:14,color:"#fcd34d"}}>Welcome, Admin Ash!</p>
              <p style={{fontSize:12,color:"rgba(255,255,255,.45)",marginTop:2}}>All data is live from Supabase. {loading?"Loading…":`${sessions.length} sessions loaded.`}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,padding:3,marginBottom:16,gap:2,overflowX:"auto"}}>
          {TABS.map(({id,ic,lb})=><button key={id} onClick={()=>setActiveTab(id)} style={{flex:"1 0 auto",padding:"7px 5px",borderRadius:10,border:"none",cursor:"pointer",fontSize:10.5,fontWeight:700,transition:"all .2s",background:activeTab===id?"linear-gradient(135deg,#f59e0b,#ef4444)":"transparent",color:activeTab===id?"white":"rgba(255,255,255,.35)",fontFamily:"inherit",whiteSpace:"nowrap"}}>{ic} {lb}</button>)}
        </div>

        {loading&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,.4)",fontSize:14}}><div style={{width:28,height:28,border:"3px solid rgba(255,255,255,.1)",borderTopColor:"#f59e0b",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px"}}/>Loading from Supabase…</div>}

        {!loading&&(
          <>
          {/* OVERVIEW */}
          {activeTab==="overview"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
                {stats.map((s,i)=>(
                  <div key={i} style={{background:s.bg,border:`1px solid ${s.bd}`,borderRadius:16,padding:"14px 15px"}}>
                    <span style={{fontSize:22}}>{s.icon}</span>
                    <p style={{fontSize:28,fontWeight:800,color:s.color,margin:"5px 0 2px"}}>{s.value}</p>
                    <p style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>{s.label}</p>
                  </div>
                ))}
              </div>

              <p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:10}}>Recent Health Queries</p>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
                {sessions.slice(0,5).map((s,i)=>{
                  const sv=SEV[s.result?.conditions?.[0]?.severity]||SEV.mild;
                  return(
                    <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:13,padding:"11px 13px",display:"flex",gap:10,alignItems:"center"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:sv.dt,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:"rgba(255,255,255,.7)",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.symptoms}</p>
                        <p style={{color:sv.tx,fontSize:11,marginTop:2}}>{s.result?.conditions?.[0]?.name||"Unknown"}</p>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,border:`1px solid ${sv.bd}`,color:sv.tx,textTransform:"capitalize",fontWeight:600}}>{s.result?.conditions?.[0]?.severity||"mild"}</span>
                        <p style={{color:"rgba(255,255,255,.25)",fontSize:10,marginTop:3}}>{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
                {sessions.length===0&&<p style={{textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:13,padding:"20px 0"}}>No sessions yet.</p>}
              </div>

              <p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:10}}>Severity Breakdown</p>
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:16}}>
                {Object.entries(sevCounts).map(([sev,cnt])=>{
                  const s=SEV[sev]||SEV.mild;
                  const pct=sessions.length?Math.round((cnt/sessions.length)*100):0;
                  return(
                    <div key={sev} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:12,color:s.tx,fontWeight:600,textTransform:"capitalize"}}>{sev}</span>
                        <span style={{fontSize:12,color:"rgba(255,255,255,.4)"}}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{height:6,background:"rgba(255,255,255,.07)",borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:s.dt,borderRadius:99,transition:"width 1s ease"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUERIES */}
          {activeTab==="queries"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <div style={{marginBottom:14}}>
                <h2 style={{fontSize:16,fontWeight:700}}>All Health Queries</h2>
                <p style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:2}}>{sessions.length} total queries · live from Supabase</p>
              </div>
              {sessions.length===0?<p style={{textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:13,padding:"40px 0"}}>No queries yet.</p>:(
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {sessions.map((s,i)=>{
                    const sv=SEV[s.result?.conditions?.[0]?.severity]||SEV.mild;
                    return(
                      <div key={i} style={{background:sv.bg,border:`1px solid ${sv.bd}`,borderRadius:14,padding:"12px 14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:sv.dt,flexShrink:0}}/>
                            <p style={{color:"rgba(255,255,255,.5)",fontWeight:600,fontSize:11}}>User: {s.user_id?.slice(0,8)}…</p>
                          </div>
                          <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
                            <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,border:`1px solid ${sv.bd}`,color:sv.tx,textTransform:"capitalize",fontWeight:600}}>{s.result?.conditions?.[0]?.severity||"mild"}</span>
                            <span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{new Date(s.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p style={{color:"rgba(255,255,255,.7)",fontSize:12,marginBottom:4}}>🤒 {s.symptoms}</p>
                        <p style={{color:sv.tx,fontSize:12,fontWeight:600}}>🩺 {s.result?.conditions?.[0]?.name||"Unknown"}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab==="analytics"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <h2 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Analytics</h2>
              <p style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:16}}>Live platform insights from Supabase</p>

              <p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:10}}>Top Diagnosed Conditions</p>
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:16,marginBottom:16}}>
                {Object.keys(condStats).length===0?<p style={{color:"rgba(255,255,255,.3)",fontSize:13,textAlign:"center"}}>No data yet.</p>:
                  Object.entries(condStats).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,cnt],i)=>{
                    const pct=sessions.length?Math.round((cnt/sessions.length)*100):0;
                    const colors=["#38bdf8","#818cf8","#6ee7b7","#fcd34d","#fdba74","#fca5a5"];
                    return(
                      <div key={i} style={{marginBottom:i<5?12:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <span style={{fontSize:12,color:"rgba(255,255,255,.7)",fontWeight:600}}>{name}</span>
                          <span style={{fontSize:12,color:"rgba(255,255,255,.4)"}}>{cnt} ({pct}%)</span>
                        </div>
                        <div style={{height:6,background:"rgba(255,255,255,.07)",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:colors[i%colors.length],borderRadius:99,transition:"width 1s ease"}}/>
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {ic:"📊",label:"Total Sessions",  value:sessions.length,     color:"#7dd3fc"},
                  {ic:"👥",label:"Unique Users",    value:uniqueUsers.length,  color:"#c4b5fd"},
                  {ic:"🚨",label:"Emergencies",     value:sessions.filter(s=>s.result?.isEmergency).length, color:"#fca5a5"},
                  {ic:"🟢",label:"Mild Cases",      value:sevCounts.mild,      color:"#6ee7b7"},
                ].map((s,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,padding:"13px 14px"}}>
                    <span style={{fontSize:20}}>{s.ic}</span>
                    <p style={{fontSize:24,fontWeight:800,color:s.color,margin:"4px 0 2px"}}>{s.value}</p>
                    <p style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {activeTab==="announce"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <h2 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Announcements</h2>
              <p style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:16}}>Push announcements — saved to Supabase</p>
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:16,marginBottom:16}}>
                <p style={{fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:12}}>New Announcement</p>
                <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Title..."
                  style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:10,padding:"10px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:10,boxSizing:"border-box"}}/>
                <textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="Write your message..." rows={3}
                  style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:10,padding:"10px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none",resize:"none",marginBottom:12,display:"block"}}/>
                <Btn onClick={addAnnouncement} disabled={!newTitle.trim()||!newBody.trim()||posting} grad full>
                  {posting?"Publishing…":"📢 Publish Announcement"}
                </Btn>
              </div>
              {announcements.length===0?<p style={{textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:13,padding:"20px 0"}}>No announcements yet.</p>:(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {announcements.map(a=>(
                    <div key={a.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"13px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                        <p style={{color:"white",fontWeight:700,fontSize:13}}>{a.title}</p>
                        <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0,marginLeft:10}}>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",color:"#6ee7b7",fontWeight:700}}>Live</span>
                          <button onClick={()=>deleteAnnouncement(a.id)} style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:7,padding:"2px 8px",color:"#fca5a5",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                        </div>
                      </div>
                      <p style={{color:"rgba(255,255,255,.55)",fontSize:12,lineHeight:1.6,marginBottom:7}}>{a.body}</p>
                      <p style={{color:"rgba(255,255,255,.25)",fontSize:10}}>{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab==="settings"&&(
            <div style={{animation:"fadeUp .4s ease"}}>
              <h2 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Settings</h2>
              <p style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:16}}>Platform configuration</p>
              {[
                {title:"⚡ Supabase",   desc:`Connected · ${SUPA_URL.split("//")[1].split(".")[0]}`,     status:"Connected",   color:"#6ee7b7",bg:"rgba(16,185,129,.1)", bd:"rgba(16,185,129,.25)"},
                {title:"🤖 AI Model",   desc:"Claude Sonnet 4 — latest",                                status:"Active",      color:"#6ee7b7",bg:"rgba(16,185,129,.1)", bd:"rgba(16,185,129,.25)"},
                {title:"🗺️ Google Maps",desc:"Embedded maps for nearby doctors",                        status:"Active",      color:"#6ee7b7",bg:"rgba(16,185,129,.1)", bd:"rgba(16,185,129,.25)"},
                {title:"🌐 Languages",  desc:"English, Hindi, Tamil supported",                         status:"3 Active",    color:"#7dd3fc",bg:"rgba(56,189,248,.1)", bd:"rgba(56,189,248,.25)"},
                {title:"🔐 Admin Auth", desc:"Password protected · No Firebase needed",                 status:"Secured",     color:"#fcd34d",bg:"rgba(245,158,11,.1)", bd:"rgba(245,158,11,.25)"},
              ].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:"13px 14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{flex:1}}><p style={{color:"white",fontWeight:600,fontSize:13,marginBottom:3}}>{s.title}</p><p style={{color:"rgba(255,255,255,.4)",fontSize:12}}>{s.desc}</p></div>
                    <span style={{fontSize:10,padding:"3px 9px",borderRadius:100,background:s.bg,border:`1px solid ${s.bd}`,color:s.color,fontWeight:700,flexShrink:0,marginLeft:10}}>{s.status}</span>
                  </div>
                </div>
              ))}
              <div style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:16,padding:16,marginTop:8}}>
                <p style={{color:"#fca5a5",fontWeight:700,fontSize:13,marginBottom:4}}>⚠️ Danger Zone</p>
                <p style={{color:"rgba(252,165,165,.6)",fontSize:12,marginBottom:14,lineHeight:1.6}}>These actions are irreversible.</p>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  <Btn danger full>🗑️ Clear All Sessions from DB</Btn>
                  <Btn danger full>🔒 Disable Platform Access</Btn>
                </div>
              </div>
              <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:14,marginTop:14}}>
                <p style={{fontSize:11,color:"rgba(255,255,255,.3)",textAlign:"center",lineHeight:1.7}}>
                  MediSense AI · Ultimate Edition v1.0.0<br/>
                  Built for CodeCure AI Hackathon — SPIRIT'26, IIT BHU<br/>
                  Admin: Ash · DB: Supabase · AI: Claude Sonnet 4
                </p>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  HERO PAGE
// ════════════════════════════════════════════════════════════
function HeroPage({onLogin,onSignup,onAdmin}){
  const features=[
    {icon:"🧬",title:"Body Map",        desc:"Tap where it hurts to auto-fill"},
    {icon:"🎙️",title:"Voice Input",     desc:"Speak symptoms in any language"},
    {icon:"📷",title:"Photo Analysis",  desc:"Upload a photo for AI diagnosis"},
    {icon:"🗺️",title:"Nearby Doctors", desc:"Find specialists near you instantly"},
    {icon:"💊",title:"Medicine Checker",desc:"Check dangerous drug interactions"},
    {icon:"📄",title:"Health Reports",  desc:"Download your diagnosis as a report"},
  ];
  const stats=[{n:"50K+",l:"Users Helped"},{n:"95%",l:"Accuracy"},{n:"3",l:"Languages"},{n:"Free",l:"Always"}];
  return(
    <div style={{minHeight:"100vh",background:"#07090f",color:"white",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(56,189,248,.07) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(139,92,246,.07) 0%,transparent 70%)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 20px 60px"}}>
        <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:24,paddingBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#38bdf8,#818cf8)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🩺</div>
            <span style={{fontWeight:800,fontSize:16}}>MediSense AI</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onAdmin} style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.25)",borderRadius:10,padding:"7px 14px",color:"#fcd34d",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🛡️ Admin</button>
            <button onClick={onLogin} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,padding:"7px 14px",color:"rgba(255,255,255,.8)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
          </div>
        </nav>
        <div style={{textAlign:"center",paddingTop:32,paddingBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(56,189,248,.1)",border:"1px solid rgba(56,189,248,.25)",borderRadius:100,padding:"6px 16px",marginBottom:20}}>
            <span style={{fontSize:13}}>✨</span>
            <span style={{fontSize:12,fontWeight:700,color:"#7dd3fc",letterSpacing:".06em"}}>AI-Powered Health Companion</span>
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:700,lineHeight:1.15,marginBottom:16}}>Your symptoms,<br/><em style={{color:"#38bdf8",fontStyle:"italic"}}>understood.</em></h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,.5)",lineHeight:1.75,marginBottom:28}}>Describe symptoms by voice, text or photo. Get instant AI diagnosis, home remedies, nearby doctor recommendations — in seconds.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={onSignup} style={{background:"linear-gradient(135deg,#38bdf8,#818cf8)",border:"none",borderRadius:14,padding:"13px 28px",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 32px rgba(56,189,248,.25)"}}>Get Started Free →</button>
            <button onClick={onLogin} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:14,padding:"13px 24px",color:"rgba(255,255,255,.8)",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
          </div>
          <p style={{marginTop:12,fontSize:12,color:"rgba(255,255,255,.25)"}}>No credit card required · Free forever</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:40}}>
          {stats.map((s,i)=><div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:"13px 8px",textAlign:"center"}}><p style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:"#38bdf8",marginBottom:3}}>{s.n}</p><p style={{fontSize:10,color:"rgba(255,255,255,.35)",fontWeight:600}}>{s.l}</p></div>)}
        </div>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.3)",textAlign:"center",marginBottom:16}}>Everything you need</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:40}}>
          {features.map((f,i)=><div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:14}}><span style={{fontSize:22}}>{f.icon}</span><p style={{color:"white",fontWeight:700,fontSize:13,margin:"7px 0 3px"}}>{f.title}</p><p style={{color:"rgba(255,255,255,.4)",fontSize:11.5,lineHeight:1.6}}>{f.desc}</p></div>)}
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(56,189,248,.12),rgba(139,92,246,.12))",border:"1px solid rgba(56,189,248,.2)",borderRadius:24,padding:26,textAlign:"center"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:8}}>Ready to take control<br/>of your health?</h2>
          <p style={{color:"rgba(255,255,255,.45)",fontSize:13,marginBottom:18,lineHeight:1.6}}>Join thousands of users who trust MediSense AI.</p>
          <button onClick={onSignup} style={{background:"linear-gradient(135deg,#38bdf8,#818cf8)",border:"none",borderRadius:14,padding:"13px 36px",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>Start for Free →</button>
        </div>
        <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,.2)",marginTop:24,lineHeight:1.65}}>⚕️ Not a substitute for professional medical advice.<br/>Built for CodeCure AI Hackathon — SPIRIT'26, IIT BHU</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  AUTH PAGE — Real Supabase Auth
// ════════════════════════════════════════════════════════════
function AuthPage({mode,onSuccess,onSwitch,onBack}){
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [showPass,setShowPass]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const isLogin=mode==="login";

  const handle=async()=>{
    setError("");
    if(!email.trim()||!password.trim()){setError("Please fill in all fields.");return;}
    if(!isLogin&&!name.trim()){setError("Please enter your full name.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}
    setLoading(true);
    try{
      let res;
      if(isLogin){
        res=await supa.signIn(email,password);
        if(res.error)throw new Error(res.error.message||"Invalid email or password.");
      }else{
        res=await supa.signUp(email,password,name);
        if(res.error)throw new Error(res.error.message||"Could not create account.");
        // Auto sign in after signup
        const loginRes=await supa.signIn(email,password);
        if(loginRes.error)throw new Error("Account created! Please sign in.");
        res=loginRes;
      }
      const token=res.access_token;
      const userData=res.user||await supa.getUser(token);
      onSuccess({
        name: userData?.user_metadata?.full_name || name || email.split("@")[0],
        email: userData?.email||email,
        uid: userData?.id,
        token,
      });
    }catch(e){setError(e.message||"Something went wrong.");}
    finally{setLoading(false);}
  };

  return(
    <div style={{minHeight:"100vh",background:"#07090f",color:"white",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(56,189,248,.06) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(139,92,246,.06) 0%,transparent 70%)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420,padding:"0 20px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:13,fontFamily:"inherit",marginBottom:24,display:"flex",alignItems:"center",gap:6}}>← Back to home</button>
        <div style={{textAlign:"center",marginBottom:26}}>
          <div style={{width:52,height:52,background:"linear-gradient(135deg,#38bdf8,#818cf8)",borderRadius:15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 12px"}}>🩺</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,marginBottom:5}}>{isLogin?"Welcome back":"Create account"}</h1>
          <p style={{color:"rgba(255,255,255,.4)",fontSize:14}}>{isLogin?"Sign in to MediSense AI":"Start your health journey today"}</p>
        </div>

        {/* Supabase badge */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:20,background:"rgba(62,207,142,.08)",border:"1px solid rgba(62,207,142,.2)",borderRadius:10,padding:"8px 14px"}}>
          <div style={{width:7,height:7,background:"#3ecf8e",borderRadius:"50%"}}/>
          <span style={{fontSize:12,color:"#3ecf8e",fontWeight:700}}>Powered by Supabase Auth</span>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
          {!isLogin&&<div><label style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.45)",display:"block",marginBottom:6}}>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="John Doe" style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px 14px",color:"white",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>}
          <div><label style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.45)",display:"block",marginBottom:6}}>Email Address</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email" style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px 14px",color:"white",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>
          <div><label style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.45)",display:"block",marginBottom:6}}>Password</label><div style={{position:"relative"}}><input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} type={showPass?"text":"password"} placeholder="••••••••" style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px 44px 12px 14px",color:"white",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/><button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:16}}>{showPass?"🙈":"👁️"}</button></div></div>
        </div>

        {error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",color:"#fca5a5",fontSize:12.5,marginBottom:14,lineHeight:1.5}}>{error}</div>}

        <button onClick={handle} disabled={loading} style={{width:"100%",background:loading?"rgba(128,128,128,.2)":"linear-gradient(135deg,#38bdf8,#818cf8)",border:"none",borderRadius:13,padding:"13px",color:"white",fontWeight:800,fontSize:15,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16,boxSizing:"border-box"}}>
          {loading?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>{isLogin?"Signing in…":"Creating account…"}</>:isLogin?"Sign In →":"Create Account →"}
        </button>

        <p style={{textAlign:"center",fontSize:13,color:"rgba(255,255,255,.35)"}}>{isLogin?"Don't have an account?":"Already have an account?"}{" "}<button onClick={onSwitch} style={{background:"none",border:"none",color:"#7dd3fc",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>{isLogin?"Sign Up":"Sign In"}</button></p>
        <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,.18)",marginTop:20,lineHeight:1.6}}>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN APP SHELL
// ════════════════════════════════════════════════════════════
function AppShell({user,onLogout}){
  const [lang,setLang]=useState("en"); const [dark,setDark]=useState(true);
  const [tab,setTab]=useState("checker"); const [sub,setSub]=useState("symptoms");
  const [symptoms,setSymptoms]=useState(""); const [image,setImage]=useState(null); const [imgPrev,setImgPrev]=useState(null);
  const [vitals,setVitals]=useState({});
  const [loading,setLoading]=useState(false); const [result,setResult]=useState(null); const [error,setError]=useState("");
  const [speaking,setSpeaking]=useState(false); const [showMap,setShowMap]=useState(false); const [exported,setExported]=useState(false);
  const [history,setHistory]=useState([]); const [histLoading,setHistLoading]=useState(false);
  const [showVoice,setShowVoice]=useState(false); const [showImg,setShowImg]=useState(false); const [showProf,setShowProf]=useState(false);
  const [announcements,setAnnouncements]=useState([]);
  const L=LANGS[lang];

  // Load history + announcements from Supabase
  useEffect(()=>{
    const load=async()=>{
      setHistLoading(true);
      try{
        const [sessions,ann]=await Promise.all([
          supa.getSessions(user.token),
          supa.getAnnouncements(),
        ]);
        if(Array.isArray(sessions))setHistory(sessions.map(s=>({id:s.id,symptoms:s.symptoms,result:s.result,vitals:s.vitals||{},timestamp:s.created_at})));
        if(Array.isArray(ann))setAnnouncements(ann);
      }catch(e){}finally{setHistLoading(false);}
    };
    load();
  },[user.token]);

  const handleLogout=async()=>{
    try{await supa.signOut(user.token);}catch(e){}onLogout();
  };

  const analyze=async()=>{
    if(!symptoms.trim()&&!image)return;
    setLoading(true);setError("");setResult(null);setShowMap(false);setExported(false);
    try{
      const uc=[];
      if(image)uc.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:image}});
      let pt=symptoms.trim()||"Analyze this image.";
      if(Object.values(vitals).some(v=>v))pt+=`\nVitals: BP=${vitals.bp||"?"},Temp=${vitals.temp||"?"}C,HR=${vitals.hr||"?"},Sugar=${vitals.sugar||"?"},SpO2=${vitals.spo2||"?"}%`;
      uc.push({type:"text",text:pt});
      const res=await fetch(AI_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:1000,system:getSys(lang),messages:[{role:"user",content:uc}]})});
      const data=await res.json();
      const txt=data.content?.[0]?.text||"";const m=txt.match(/\{[\s\S]*\}/);if(!m)throw new Error();
      const parsed=JSON.parse(m[0]);setResult(parsed);

      // Save to Supabase
      const sessionData={user_id:user.uid,symptoms:symptoms||"📷 Photo",result:parsed,vitals};
      await supa.addSession(user.token,sessionData);
      setHistory(p=>[{id:Date.now(),symptoms:symptoms||"📷 Photo",result:parsed,vitals,timestamp:new Date().toISOString()},...p].slice(0,40));
    }catch(e){setError("Could not analyze. Please try again.");}finally{setLoading(false);}
  };

  const deleteSession=async(id)=>{
    try{await supa.deleteSession(user.token,id);}catch(e){}
    setHistory(p=>p.filter(h=>h.id!==id));
  };

  const clearAllSessions=async()=>{
    try{await supa.clearSessions(user.token,user.uid);}catch(e){}
    setHistory([]);
  };

  const speakResult=()=>{
    if(!result||!window.speechSynthesis)return;window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(`${(result.conditions||[]).map(c=>`${c.name},${c.severity}`).join(". ")}. ${result.generalAdvice||""}`);
    u.lang=L.hl;u.rate=0.9;u.onstart=()=>setSpeaking(true);u.onend=()=>setSpeaking(false);window.speechSynthesis.speak(u);
  };

  const surf=dark?"rgba(255,255,255,.04)":"rgba(255,255,255,.9)";
  const bd=dark?"rgba(255,255,255,.09)":"rgba(0,0,0,.1)";
  const sc=dark?"rgba(255,255,255,.35)":"rgba(0,0,0,.4)";
  const tc=dark?"white":"#0f172a";
  const crd={background:surf,border:`1px solid ${bd}`,borderRadius:18,padding:16};

  const MAIN_TABS=[{id:"checker",ic:"🔍",lb:"Checker"},{id:"medicine",ic:"💊",lb:"Medicine"},{id:"dashboard",ic:"📊",lb:"Dashboard"},{id:"history",ic:"📋",lb:"History"},{id:"reminders",ic:"🔔",lb:"Reminders"}];
  const SUB_TABS=[{id:"symptoms",lb:"Symptoms"},{id:"bodymap",lb:"🧬 Body Map"},{id:"vitals",lb:"🩸 Vitals"},{id:"chat",lb:"💬 Chat"}];

  return(
    <div style={{fontFamily:"'Nunito',sans-serif",background:dark?"#07090f":"#f0f4f8",minHeight:"100vh",color:tc,transition:"background .3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        textarea{resize:none;background:transparent;border:none;color:inherit;font-family:inherit;font-size:14px;line-height:1.7;width:100%;caret-color:#38bdf8}
        textarea::placeholder{color:rgba(128,128,128,.38)}
        textarea:focus,input:focus{outline:none}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(128,128,128,.2);border-radius:2px}
      `}</style>
      {dark&&<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}><div style={{position:"absolute",top:"-10%",left:0,width:"55%",height:"55%",background:"radial-gradient(ellipse,rgba(56,189,248,.05) 0%,transparent 70%)"}}/><div style={{position:"absolute",bottom:"-10%",right:0,width:"55%",height:"55%",background:"radial-gradient(ellipse,rgba(139,92,246,.05) 0%,transparent 70%)"}}/></div>}

      <div style={{position:"relative",zIndex:1,maxWidth:500,margin:"0 auto",padding:"0 14px 80px"}}>
        {/* Header */}
        <div style={{paddingTop:20,paddingBottom:14}}>

          {/* Announcements banner */}
          {announcements.length>0&&(
            <div style={{background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.2)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:16,flexShrink:0}}>📢</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:"#7dd3fc",fontWeight:700,fontSize:12}}>{announcements[0].title}</p>
                <p style={{color:"rgba(255,255,255,.5)",fontSize:11,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{announcements[0].body}</p>
              </div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,background:"linear-gradient(135deg,#38bdf8,#818cf8)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🩺</div>
              <div><p style={{fontWeight:800,fontSize:14}}>MediSense AI</p><p style={{fontSize:9,color:sc,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Ultimate Edition</p></div>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <div style={{display:"flex",gap:2,background:surf,border:`1px solid ${bd}`,borderRadius:9,padding:3}}>
                {Object.entries(LANGS).map(([k,v])=><button key={k} onClick={()=>setLang(k)} style={{background:lang===k?"linear-gradient(135deg,#38bdf8,#818cf8)":"transparent",border:"none",borderRadius:6,padding:"3px 6px",color:lang===k?"white":sc,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>{v.flag}</button>)}
              </div>
              <button onClick={()=>setDark(d=>!d)} style={{background:surf,border:`1px solid ${bd}`,borderRadius:9,padding:"5px 9px",fontSize:14,cursor:"pointer",color:tc}}>{dark?"☀️":"🌙"}</button>
              <button onClick={()=>setShowProf(v=>!v)} style={{width:34,height:34,background:"linear-gradient(135deg,#38bdf8,#818cf8)",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                <span style={{color:"white",fontWeight:800,fontSize:14}}>{(user.name||"U")[0].toUpperCase()}</span>
              </button>
            </div>
          </div>

          {showProf&&(
            <div style={{background:dark?"rgba(12,18,28,.98)":"white",border:`1px solid ${bd}`,borderRadius:16,padding:16,marginBottom:12,animation:"fadeUp .2s ease"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${bd}`}}>
                <div style={{width:42,height:42,background:"linear-gradient(135deg,#38bdf8,#818cf8)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"white",flexShrink:0}}>{(user.name||"U")[0].toUpperCase()}</div>
                <div><p style={{color:tc,fontWeight:700,fontSize:14}}>{user.name}</p><p style={{color:sc,fontSize:12}}>{user.email}</p><p style={{color:"rgba(62,207,142,.8)",fontSize:10,marginTop:2,fontWeight:600}}>⚡ Supabase Auth</p></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[["📊",`${history.length} Sessions`],["🟢",`${history.filter(h=>(h.result?.conditions||[])[0]?.severity==="mild").length} Mild`],["🚨",`${history.filter(h=>h.result?.isEmergency).length} Emergencies`],["💊","Medicine Log"]].map(([ic,lb],i)=>(
                  <div key={i} style={{background:surf,border:`1px solid ${bd}`,borderRadius:10,padding:"8px 10px",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14}}>{ic}</span><span style={{fontSize:11,color:sc,fontWeight:600}}>{lb}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>{setShowProf(false);handleLogout();}} style={{width:"100%",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,padding:"9px",color:"#fca5a5",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
            </div>
          )}

          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,lineHeight:1.2}}>Hi {(user.name||"there").split(" ")[0]}, <em style={{color:"#38bdf8",fontStyle:"italic"}}>how are you feeling?</em></h1>
        </div>

        {/* Main tabs */}
        <div style={{display:"flex",background:surf,border:`1px solid ${bd}`,borderRadius:13,padding:3,marginBottom:14,gap:2,overflowX:"auto"}}>
          {MAIN_TABS.map(({id,ic,lb})=><button key={id} onClick={()=>setTab(id)} style={{flex:"1 0 auto",padding:"7px 4px",borderRadius:10,border:"none",cursor:"pointer",fontSize:10.5,fontWeight:700,transition:"all .2s",background:tab===id?"linear-gradient(135deg,#38bdf8,#818cf8)":"transparent",color:tab===id?"white":sc,fontFamily:"inherit",whiteSpace:"nowrap"}}>{ic} {lb}</button>)}
        </div>

        {/* CHECKER */}
        {tab==="checker"&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
              {SUB_TABS.map(({id,lb})=><button key={id} onClick={()=>setSub(id)} style={{padding:"5px 12px",borderRadius:100,border:`1px solid ${sub===id?"#38bdf8":bd}`,background:sub===id?"rgba(56,189,248,.1)":surf,color:sub===id?"#38bdf8":sc,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}>{lb}</button>)}
            </div>
            {sub==="bodymap"&&<div style={{...crd,marginBottom:12}}><BodyMap onSelect={p=>{setSymptoms(s=>(s?s+", ":"")+p.q);setSub("symptoms");}}/></div>}
            {sub==="vitals"&&<div style={{...crd,marginBottom:12}}><VitalsPanel vitals={vitals} setVitals={setVitals}/></div>}
            {sub==="chat"&&<div style={{...crd,marginBottom:12}}><ChatPanel baseResult={result} lang={lang}/></div>}
            {sub==="symptoms"&&(<>
              {showVoice&&<VoicePanel lang={lang} onResult={t=>setSymptoms(s=>(s?s+" ":"")+t)} onClose={()=>setShowVoice(false)}/>}
              {showImg&&<ImagePanel onImageB64={(b64,prev)=>{setImage(b64);setImgPrev(prev);}} onClose={()=>setShowImg(false)}/>}
              <div style={{...crd,marginBottom:10}}>
                <p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:sc,marginBottom:10}}>Describe your symptoms</p>
                {imgPrev&&<div style={{position:"relative",marginBottom:10}}><img src={imgPrev} alt="s" style={{width:"100%",borderRadius:11,maxHeight:130,objectFit:"cover"}}/><button onClick={()=>{setImage(null);setImgPrev(null);}} style={{position:"absolute",top:7,right:7,background:"rgba(0,0,0,.65)",border:"none",borderRadius:"50%",width:24,height:24,color:"white",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>}
                <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder={L.ph} rows={imgPrev?2:4} style={{color:tc}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:9,paddingTop:9,borderTop:`1px solid ${bd}`}}>
                  <div style={{display:"flex",gap:6}}>
                    <Btn onClick={()=>{setShowVoice(v=>!v);setShowImg(false);}} danger={showVoice} sm>🎙 Voice</Btn>
                    <Btn onClick={()=>{setShowImg(v=>!v);setShowVoice(false);}} sm>📷 Photo</Btn>
                  </div>
                  <button onClick={analyze} disabled={(!symptoms.trim()&&!image)||loading} style={{background:(symptoms.trim()||image)&&!loading?"linear-gradient(135deg,#38bdf8,#818cf8)":"rgba(128,128,128,.2)",border:"none",borderRadius:10,padding:"8px 15px",color:"white",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
                    {loading?<><div style={{width:12,height:12,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>Analyzing…</>:"Analyze →"}
                  </button>
                </div>
              </div>
              {!result&&!loading&&<div style={{marginBottom:14}}><p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:sc,marginBottom:9}}>Try an example</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(SAMPLES[lang]||SAMPLES.en).map((s,i)=><button key={i} onClick={()=>setSymptoms(s)} style={{background:surf,border:`1px solid ${bd}`,borderRadius:100,padding:"5px 12px",color:sc,fontSize:11.5,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}</div></div>}
              {loading&&<div style={{display:"flex",flexDirection:"column",gap:9,opacity:.6}}>{[1,.7,.5].map((o,i)=><div key={i} style={{...crd,opacity:o,animation:`pulse ${1+i*.3}s ease infinite`}}><div style={{height:9,background:"rgba(128,128,128,.15)",borderRadius:6,width:"50%",marginBottom:7}}/><div style={{height:6,background:"rgba(128,128,128,.1)",borderRadius:6,width:"100%",marginBottom:5}}/><div style={{height:6,background:"rgba(128,128,128,.1)",borderRadius:6,width:"70%"}}/></div>)}</div>}
              {error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:13,padding:"11px 14px",color:"#fca5a5",fontSize:13}}>⚠️ {error}</div>}
              {result&&(<>
                <ResultsView result={result}/>
                <div style={{display:"flex",gap:7,marginTop:12,flexWrap:"wrap"}}>
                  <Btn onClick={()=>setShowMap(v=>!v)} style={{flex:1}}>🗺️ {showMap?"Hide":"Nearby Doctors"}</Btn>
                  <Btn onClick={()=>{exportReport(symptoms||"Photo",result,vitals);setExported(true);setTimeout(()=>setExported(false),3000);}} style={{flex:1,color:exported?"#6ee7b7":undefined}}>{exported?"✅ Downloaded!":"📄 Export"}</Btn>
                  <Btn onClick={speakResult} style={{color:speaking?"#c4b5fd":undefined}}>🔊</Btn>
                </div>
                {result.isEmergency&&<button onClick={()=>window.open("tel:112")} style={{width:"100%",marginTop:9,background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:13,padding:"12px",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",animation:"breathe 1.5s infinite"}}>🆘 EMERGENCY — Call 112</button>}
                {showMap&&result.specialistQuery&&(<div style={{marginTop:12,borderRadius:14,overflow:"hidden",border:`1px solid ${bd}`}}><div style={{background:"rgba(56,189,248,.07)",borderBottom:`1px solid ${bd}`,padding:"8px 13px"}}><span style={{fontSize:12,color:sc}}>🗺️ Nearby: {result.specialistQuery}</span></div><iframe title="Map" width="100%" height="200" style={{border:"none",display:"block"}} loading="lazy" src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${encodeURIComponent(result.specialistQuery)}`}/><div style={{padding:"8px 13px"}}><a href={`https://www.google.com/maps/search/${encodeURIComponent(result.specialistQuery)}`} target="_blank" rel="noreferrer" style={{color:"#7dd3fc",fontSize:12,textDecoration:"none",fontWeight:600}}>Open in Google Maps →</a></div></div>)}
              </>)}
              <p style={{textAlign:"center",fontSize:10,color:dark?"rgba(255,255,255,.17)":"rgba(0,0,0,.25)",marginTop:18,lineHeight:1.65}}>MediSense AI is not a substitute for professional medical advice.</p>
            </>)}
          </div>
        )}
        {tab==="medicine"&&<div style={crd}><MedicinePanel/></div>}
        {tab==="dashboard"&&<div style={crd}><DashboardPanel history={history}/></div>}
        {tab==="reminders"&&<div style={crd}><RemindersPanel/></div>}
        {tab==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div><h2 style={{fontSize:16,fontWeight:700}}>Health History</h2>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                <p style={{fontSize:11,color:sc}}>{history.length} sessions</p>
                <span style={{fontSize:10,color:"rgba(62,207,142,.7)",fontWeight:600}}>⚡ Supabase</span>
              </div></div>
              {history.length>0&&<button onClick={clearAllSessions} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:9,padding:"5px 11px",color:"#fca5a5",fontSize:11.5,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Clear all</button>}
            </div>
            {histLoading&&<div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,.4)",fontSize:13}}><div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.1)",borderTopColor:"#38bdf8",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 10px"}}/>Loading from Supabase…</div>}
            {!histLoading&&(!history.length?<div style={{textAlign:"center",padding:"46px 0",color:sc,fontSize:13}}>No sessions yet. Your sessions are saved to Supabase!</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {history.map(e=>{const s=SEV[(e.result?.conditions||[])[0]?.severity]||SEV.mild;return(
                  <div key={e.id} style={{background:s.bg,border:`1px solid ${s.bd}`,borderRadius:13,padding:"11px 13px",position:"relative"}}>
                    <button onClick={()=>deleteSession(e.id)} style={{position:"absolute",top:9,right:9,background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:12}}>✕</button>
                    <div style={{display:"flex",gap:9}}><div style={{width:7,height:7,borderRadius:"50%",background:s.dt,marginTop:4,flexShrink:0}}/><div style={{flex:1,paddingRight:18,minWidth:0}}><p style={{color:"rgba(255,255,255,.8)",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.symptoms}</p><p style={{color:s.tx,fontSize:11,marginTop:2}}>{(e.result?.conditions||[])[0]?.name||"Unknown"}</p><p style={{color:"rgba(255,255,255,.28)",fontSize:10,marginTop:2}}>{new Date(e.timestamp).toLocaleDateString()}</p></div></div>
                  </div>
                );})}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────
function ResultsView({result}){
  if(!result)return null;
  return <div>{result.isEmergency&&<div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.5)",borderRadius:16,padding:14,marginBottom:14,display:"flex",gap:12}}><span style={{fontSize:22}}>🚨</span><div><p style={{color:"#fca5a5",fontWeight:700,fontSize:13}}>EMERGENCY — Seek Immediate Care</p><p style={{color:"rgba(252,165,165,.75)",fontSize:12,marginTop:3}}>{result.emergencyMessage}</p></div></div>}<p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:10}}>Possible Conditions</p><div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>{(result.conditions||[]).map((c,i)=>{const s=SEV[c.severity]||SEV.mild;return <div key={i} style={{background:s.bg,border:`1px solid ${s.bd}`,borderRadius:15,padding:"12px 14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:s.dt}}/><span style={{color:"white",fontWeight:600,fontSize:14}}>{c.name}</span></div><div style={{display:"flex",gap:7,alignItems:"center"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:100,border:`1px solid ${s.bd}`,color:s.tx,textTransform:"capitalize",fontWeight:600}}>{c.severity}</span><span style={{color:"rgba(255,255,255,.35)",fontSize:11}}>{c.match}%</span></div></div><MatchBar pct={c.match} color={s.dt}/><p style={{color:"rgba(255,255,255,.55)",fontSize:12,lineHeight:1.6}}>{c.description}</p></div>; })}</div>{(result.homeRemedies||[]).length>0&&(<><p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:10}}>Home Remedies</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>{(result.homeRemedies||[]).map((r,i)=><div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,padding:12}}><span style={{fontSize:22}}>{r.icon}</span><p style={{color:"white",fontWeight:600,fontSize:13,margin:"5px 0 3px"}}>{r.title}</p><p style={{color:"rgba(255,255,255,.45)",fontSize:11,lineHeight:1.6}}>{r.description}</p></div>)}</div></>)}{result.specialist&&<div style={{background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.25)",borderRadius:13,padding:"12px 14px",display:"flex",gap:12,marginBottom:12}}><span style={{fontSize:20}}>🏥</span><div><p style={{color:"#7dd3fc",fontWeight:600,fontSize:13}}>See a {result.specialist}</p><p style={{color:"rgba(255,255,255,.45)",fontSize:12,marginTop:3}}>{result.specialistReason}</p></div></div>}{result.generalAdvice&&<p style={{color:"rgba(255,255,255,.3)",fontSize:11,textAlign:"center",borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:12,fontStyle:"italic"}}>⚕️ {result.generalAdvice}</p>}</div>;
}
function BodyMap({onSelect}){
  const [hov,setHov]=useState(null);const [sel,setSel]=useState(null);
  return <div style={{textAlign:"center"}}><p style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:14}}>👆 Tap where it hurts</p><div style={{position:"relative",width:180,height:310,margin:"0 auto"}}><svg viewBox="0 0 100 175" width={180} height={310}><ellipse cx="50" cy="9" rx="11" ry="10" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/><rect x="34" y="20" width="32" height="28" rx="6" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/><rect x="17" y="21" width="16" height="26" rx="5" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/><rect x="67" y="21" width="16" height="26" rx="5" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/><rect x="34" y="49" width="14" height="32" rx="5" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/><rect x="52" y="49" width="14" height="32" rx="5" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.18)" strokeWidth=".5"/>{BPARTS.map(p=><rect key={p.id} x={p.sx} y={p.sy} width={p.sw} height={p.sh} rx="3" fill={sel===p.id?"rgba(239,68,68,.35)":hov===p.id?"rgba(56,189,248,.25)":"transparent"} stroke={sel===p.id?"#ef4444":hov===p.id?"#38bdf8":"transparent"} strokeWidth=".8" style={{cursor:"pointer"}} onMouseEnter={()=>setHov(p.id)} onMouseLeave={()=>setHov(null)} onClick={()=>{setSel(p.id);onSelect(p);}}/>)}</svg>{hov&&<div style={{position:"absolute",top:-26,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.85)",color:"white",fontSize:11,padding:"3px 10px",borderRadius:8,whiteSpace:"nowrap",pointerEvents:"none"}}>{BPARTS.find(p=>p.id===hov)?.label}</div>}</div>{sel&&<div style={{marginTop:10,background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.25)",borderRadius:10,padding:"7px 14px",fontSize:12,color:"#7dd3fc"}}>✅ <b>{BPARTS.find(p=>p.id===sel)?.label}</b> added</div>}</div>;
}
function VitalsPanel({vitals,setVitals}){
  const F=[{k:"bp",l:"Blood Pressure",u:"mmHg",p:"120/80",i:"❤️"},{k:"temp",l:"Temperature",u:"°C",p:"37.0",i:"🌡️"},{k:"hr",l:"Heart Rate",u:"bpm",p:"72",i:"💓"},{k:"sugar",l:"Blood Sugar",u:"mg/dL",p:"90",i:"🩸"},{k:"spo2",l:"SpO2",u:"%",p:"98",i:"🫁"},{k:"weight",l:"Weight",u:"kg",p:"65",i:"⚖️"}];
  return <div><p style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:12}}>Enter vitals for a more accurate diagnosis.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>{F.map(f=><div key={f.k} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,padding:"11px 13px"}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:15}}>{f.i}</span><span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.4)",textTransform:"uppercase"}}>{f.l}</span></div><div style={{display:"flex",alignItems:"center",gap:5}}><input value={vitals[f.k]||""} onChange={e=>setVitals(v=>({...v,[f.k]:e.target.value}))} placeholder={f.p} style={{flex:1,background:"transparent",border:"none",color:"white",fontSize:16,fontWeight:700,fontFamily:"inherit",outline:"none",width:0}}/><span style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{f.u}</span></div></div>)}</div></div>;
}
function ChatPanel({baseResult,lang}){
  const [msgs,setMsgs]=useState([{r:"ai",t:baseResult?`Hi! I analyzed: ${(baseResult.conditions||[])[0]?.name||"your symptoms"}. Ask anything!`:"Hi! Ask me any health question."}]);
  const [inp,setInp]=useState("");const [load,setLoad]=useState(false);const endRef=useRef(null);
  useEffect(()=>{endRef.current&&endRef.current.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{
    if(!inp.trim()||load)return;const um={r:"user",t:inp.trim()};setMsgs(p=>[...p,um]);setInp("");setLoad(true);
    try{const res=await fetch(AI_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:500,system:`You are MediSense AI. ${baseResult?`Context: ${(baseResult.conditions||[]).map(c=>c.name).join(", ")}.`:""} Be concise and empathetic. Respond in ${lang==="hi"?"Hindi":lang==="ta"?"Tamil":"English"}.`,messages:[...msgs,um].map(m=>({role:m.r==="user"?"user":"assistant",content:m.t}))})});const data=await res.json();setMsgs(p=>[...p,{r:"ai",t:data.content?.[0]?.text||"Sorry, couldn't respond."}]);}catch(e){setMsgs(p=>[...p,{r:"ai",t:"Something went wrong."}]);}finally{setLoad(false);}
  };
  return <div style={{display:"flex",flexDirection:"column",height:360}}><div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:9,marginBottom:10}}>{msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"80%",background:m.r==="user"?"linear-gradient(135deg,#38bdf8,#818cf8)":"rgba(255,255,255,.06)",borderRadius:m.r==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"9px 13px",fontSize:13,color:m.r==="user"?"white":"rgba(255,255,255,.85)",lineHeight:1.6}}>{m.t}</div></div>)}{load&&<div><div style={{background:"rgba(255,255,255,.06)",borderRadius:"14px 14px 14px 3px",padding:"9px 13px",fontSize:13,color:"rgba(255,255,255,.4)",display:"inline-block"}}>Thinking…</div></div>}<div ref={endRef}/></div><div style={{display:"flex",gap:8}}><input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask a follow-up question..." style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:11,padding:"9px 13px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none"}}/><Btn onClick={send} disabled={!inp.trim()||load} grad>{load?"…":"Send"}</Btn></div></div>;
}
function VoicePanel({lang,onResult,onClose}){
  const [mode,setMode]=useState("choose");const [typed,setTyped]=useState("");const [listening,setListening]=useState(false);const recRef=useRef(null);
  const phrases=VOICE_PHRASES[lang]||VOICE_PHRASES.en;
  const tryMic=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setMode("type");return;}setMode("mic");setListening(true);const rec=new SR();rec.continuous=false;rec.lang=LANGS[lang].hl;rec.onresult=e=>{onResult(e.results[0][0].transcript);onClose();};rec.onerror=()=>{setListening(false);setMode("type");};rec.onend=()=>setListening(false);recRef.current=rec;rec.start();};
  return <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:16,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><p style={{color:"white",fontWeight:700,fontSize:14}}>🎙️ Voice Input</p><button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:18}}>✕</button></div>{mode==="choose"&&<div style={{display:"flex",flexDirection:"column",gap:10}}><button onClick={tryMic} style={{background:"linear-gradient(135deg,#38bdf8,#818cf8)",border:"none",borderRadius:12,padding:"12px",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>🎤 Use Microphone</button><button onClick={()=>setMode("type")} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px",color:"rgba(255,255,255,.7)",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>⌨️ Type Instead</button><p style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:600}}>Quick phrases:</p>{phrases.map((s,i)=><button key={i} onClick={()=>{onResult(s);onClose();}} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:"8px 12px",color:"rgba(255,255,255,.6)",fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>"{s}"</button>)}</div>}{mode==="mic"&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{width:60,height:60,background:"rgba(239,68,68,.2)",borderRadius:"50%",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🎙️</div><p style={{color:"white",fontWeight:600}}>{listening?"Listening…":"Done!"}</p><button onClick={()=>setMode("type")} style={{marginTop:14,background:"transparent",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"7px 16px",color:"rgba(255,255,255,.4)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Switch to typing</button></div>}{mode==="type"&&<div><textarea value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Type symptoms here..." rows={3} style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none",resize:"none",marginBottom:10}}/><div style={{display:"flex",gap:8}}><button onClick={()=>setMode("choose")} style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"9px",color:"rgba(255,255,255,.5)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Back</button><button onClick={()=>{if(typed.trim()){onResult(typed.trim());onClose();}}} disabled={!typed.trim()} style={{flex:2,background:typed.trim()?"linear-gradient(135deg,#38bdf8,#818cf8)":"rgba(128,128,128,.2)",border:"none",borderRadius:10,padding:"9px",color:"white",fontWeight:700,fontSize:13,cursor:typed.trim()?"pointer":"not-allowed",fontFamily:"inherit"}}>✅ Add to Symptoms</button></div></div>}</div>;
}
function ImagePanel({onImageB64,onClose}){
  const [mode,setMode]=useState("choose");const [url,setUrl]=useState("");const [loading,setLoading]=useState(false);const fileRef=useRef(null);
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{onImageB64(ev.target.result.split(",")[1],ev.target.result);onClose();};r.readAsDataURL(f);};
  const handleUrl=async()=>{if(!url.trim())return;setLoading(true);try{const res=await fetch(url);const blob=await res.blob();const r=new FileReader();r.onload=ev=>{onImageB64(ev.target.result.split(",")[1],ev.target.result);onClose();};r.readAsDataURL(blob);}catch(e){onClose();}finally{setLoading(false);}};
  return <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:16,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><p style={{color:"white",fontWeight:700,fontSize:14}}>📷 Photo Input</p><button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:18}}>✕</button></div>{mode==="choose"&&<div style={{display:"flex",flexDirection:"column",gap:10}}><button onClick={()=>{setMode("file");setTimeout(()=>fileRef.current&&fileRef.current.click(),100);}} style={{background:"linear-gradient(135deg,#38bdf8,#818cf8)",border:"none",borderRadius:12,padding:"12px",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>📁 Upload from Device</button><button onClick={()=>setMode("url")} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px",color:"rgba(255,255,255,.7)",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>🔗 Paste Image URL</button><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/></div>}{mode==="url"&&<div><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com/image.jpg" style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"9px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:10,boxSizing:"border-box"}}/><div style={{display:"flex",gap:8}}><button onClick={()=>setMode("choose")} style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"9px",color:"rgba(255,255,255,.5)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Back</button><button onClick={handleUrl} disabled={!url.trim()||loading} style={{flex:2,background:url.trim()&&!loading?"linear-gradient(135deg,#38bdf8,#818cf8)":"rgba(128,128,128,.2)",border:"none",borderRadius:10,padding:"9px",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{loading?"Loading…":"✅ Use Image"}</button></div></div>}</div>;
}
function MedicinePanel(){
  const [meds,setMeds]=useState(["",""]);const [res,setRes]=useState(null);const [load,setLoad]=useState(false);
  const check=async()=>{const valid=meds.filter(m=>m.trim());if(valid.length<2)return;setLoad(true);setRes(null);try{const r=await fetch(AI_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:600,system:getMedSys(),messages:[{role:"user",content:"Check: "+valid.join(", ")}]})});const data=await r.json();const txt=data.content?.[0]?.text||"";const m=txt.match(/\{[\s\S]*\}/);if(m)setRes(JSON.parse(m[0]));}catch(e){}finally{setLoad(false);}};
  return <div><p style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:12}}>Enter 2+ medicines to check for dangerous interactions.</p><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>{meds.map((m,i)=><div key={i} style={{display:"flex",gap:8}}><input value={m} onChange={e=>{const n=[...meds];n[i]=e.target.value;setMeds(n);}} placeholder={`Medicine ${i+1}`} style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"9px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none"}}/>{i>=2&&<button onClick={()=>setMeds(p=>p.filter((_,j)=>j!==i))} style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"0 12px",color:"#fca5a5",fontSize:13,cursor:"pointer"}}>✕</button>}</div>)}<button onClick={()=>setMeds(p=>[...p,""])} style={{background:"transparent",border:"1px dashed rgba(255,255,255,.15)",borderRadius:10,padding:"7px",color:"rgba(255,255,255,.35)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+ Add medicine</button></div><Btn onClick={check} disabled={meds.filter(m=>m.trim()).length<2||load} grad full style={{marginBottom:12}}>{load?"Checking…":"Check Interactions"}</Btn>{res&&<div><div style={{background:res.safe?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)",border:`1px solid ${res.safe?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`,borderRadius:13,padding:"11px 13px",marginBottom:10}}><p style={{color:res.safe?"#6ee7b7":"#fca5a5",fontWeight:700,fontSize:13}}>{res.safe?"✅ Generally Safe":"⚠️ Interactions Found"}</p><p style={{color:"rgba(255,255,255,.55)",fontSize:12,marginTop:3}}>{res.summary}</p></div>{(res.interactions||[]).map((it,i)=>{const s=SEV[it.severity]||SEV.mild;return<div key={i} style={{background:s.bg,border:`1px solid ${s.bd}`,borderRadius:11,padding:"9px 12px",marginBottom:7}}><p style={{color:s.tx,fontWeight:600,fontSize:12}}>{(it.medicines||[]).join(" + ")} · {it.severity}</p><p style={{color:"rgba(255,255,255,.6)",fontSize:12,marginTop:2}}>{it.effect}</p><p style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:2,fontStyle:"italic"}}>💡 {it.advice}</p></div>;})}</div>}</div>;
}
function RemindersPanel(){
  const [list,setList]=useState([]);const [med,setMed]=useState("");const [time,setTime]=useState("");const [freq,setFreq]=useState("daily");
  const add=()=>{if(!med.trim()||!time)return;setList(p=>[...p,{id:Date.now(),med:med.trim(),time,freq}]);setMed("");setTime("");};
  return <div><p style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:12}}>Set medication reminders.</p><div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:14,marginBottom:12}}><input value={med} onChange={e=>setMed(e.target.value)} placeholder="Medicine name" style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:10,padding:"9px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:9,boxSizing:"border-box"}}/><div style={{display:"flex",gap:9,marginBottom:10}}><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:10,padding:"9px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none"}}/><select value={freq} onChange={e=>setFreq(e.target.value)} style={{flex:1,background:"rgba(20,20,30,1)",border:"1px solid rgba(255,255,255,.09)",borderRadius:10,padding:"9px 12px",color:"white",fontSize:13,fontFamily:"inherit",outline:"none"}}><option value="once">Once</option><option value="daily">Daily</option><option value="twice">Twice daily</option><option value="thrice">Thrice daily</option></select></div><Btn onClick={add} disabled={!med.trim()||!time} grad full>+ Set Reminder</Btn></div>{list.length===0?<p style={{textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:13,padding:"18px 0"}}>No reminders yet.</p>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{list.map(r=><div key={r.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,padding:"11px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><p style={{color:"white",fontWeight:600,fontSize:13}}>💊 {r.med}</p><p style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:2}}>🕐 {r.time} · {r.freq}</p></div><button onClick={()=>setList(p=>p.filter(x=>x.id!==r.id))} style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"5px 10px",color:"#fca5a5",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Remove</button></div>)}</div>}</div>;
}
function DashboardPanel({history}){
  const counts={mild:0,moderate:0,severe:0,emergency:0};
  history.forEach(h=>{const sv=(h.result?.conditions||[])[0]?.severity||"mild";counts[sv]=(counts[sv]||0)+1;});
  if(!history.length)return<div style={{textAlign:"center",padding:"46px 0",color:"rgba(255,255,255,.3)",fontSize:13}}>Analyze symptoms to see your dashboard.</div>;
  return <div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:18}}>{[["📊","Total",history.length,"rgba(56,189,248,.1)","rgba(56,189,248,.3)","#7dd3fc"],["🚨","Emergencies",history.filter(h=>h.result?.isEmergency).length,"rgba(239,68,68,.1)","rgba(239,68,68,.3)","#fca5a5"],["🟢","Mild",counts.mild,"rgba(16,185,129,.1)","rgba(16,185,129,.3)","#6ee7b7"],["🟡","Moderate+",counts.moderate+counts.severe+counts.emergency,"rgba(245,158,11,.1)","rgba(245,158,11,.3)","#fcd34d"]].map(([ic,lb,vl,bg,bd,cl],i)=><div key={i} style={{background:bg,border:`1px solid ${bd}`,borderRadius:13,padding:"13px 15px"}}><span style={{fontSize:20}}>{ic}</span><p style={{fontSize:26,fontWeight:800,color:cl,margin:"4px 0 2px"}}>{vl}</p><p style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{lb}</p></div>)}</div><p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:10}}>Recent Sessions</p><div style={{display:"flex",flexDirection:"column",gap:7}}>{history.slice(0,8).map((h,i)=>{const s=SEV[(h.result?.conditions||[])[0]?.severity]||SEV.mild;return<div key={i} style={{display:"flex",alignItems:"center",gap:9,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:11,padding:"9px 12px"}}><div style={{width:6,height:6,borderRadius:"50%",background:s.dt,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><p style={{color:"rgba(255,255,255,.7)",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.symptoms}</p><p style={{color:s.tx,fontSize:10,marginTop:2}}>{(h.result?.conditions||[])[0]?.name||"Unknown"}</p></div><p style={{color:"rgba(255,255,255,.25)",fontSize:10}}>{new Date(h.timestamp).toLocaleDateString()}</p></div>; })}</div></div>;
}

// ════════════════════════════════════════════════════════════
//  ROOT ROUTER
// ════════════════════════════════════════════════════════════
export default function Root() {
  const [page, setPage] = useState("hero");
  const [user, setUser] = useState(null);

  if (page==="hero")       return <HeroPage onLogin={()=>setPage("login")} onSignup={()=>setPage("signup")} onAdmin={()=>setPage("adminlogin")}/>;
  if (page==="login")      return <AuthPage mode="login"  onSuccess={u=>{setUser(u);setPage("app");}}  onSwitch={()=>setPage("signup")}   onBack={()=>setPage("hero")}/>;
  if (page==="signup")     return <AuthPage mode="signup" onSuccess={u=>{setUser(u);setPage("app");}}  onSwitch={()=>setPage("login")}    onBack={()=>setPage("hero")}/>;
  if (page==="adminlogin") return <AdminLoginPage onSuccess={()=>setPage("admin")} onBack={()=>setPage("hero")}/>;
  if (page==="admin")      return <AdminPanel onLogout={()=>setPage("hero")}/>;
  if (page==="app"&&user)  return <AppShell user={user} onLogout={()=>{setUser(null);setPage("hero");}}/>;
  return null;
}
