import { useState, useEffect, useRef } from "react";

const ACCOUNTS = [
  { id: "admin",      name: "Administration",       sector: "all",           password: "admin2024",  isAdmin: true,  emoji: "🗝️" },
  { id: "nice",       name: "Équipe Nice",           sector: "Nice",          password: "nice2024",   isAdmin: false, emoji: "🌴" },
  { id: "cannes",     name: "Équipe Cannes-Antibes", sector: "Cannes-Antibes",password: "cannes2024", isAdmin: false, emoji: "🎬" },
  { id: "villeneuve", name: "Équipe Villeneuve",     sector: "Villeneuve",    password: "villa2024",  isAdmin: false, emoji: "☀️" },
];

const SECTOR_COLORS = { Nice: "#3B82F6", "Cannes-Antibes": "#F59E0B", Villeneuve: "#10B981", all: "#C8A84B" };

const STATUS = {
  "À nettoyer": { c: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
  "En cours":   { c: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
  "Terminé":    { c: "#065F46", bg: "#F0FDF4", border: "#A7F3D0" },
  "Vérifié":    { c: "#4C1D95", bg: "#FAF5FF", border: "#DDD6FE" },
};

const CHECKLIST = [
  { cat: "Chambres",      items: ["Literie changée", "Oreillers replacés", "Couvertures pliées", "Placards vérifiés", "Poussière essuyée"] },
  { cat: "Salle de bain", items: ["WC désinfecté", "Douche/baignoire nettoyée", "Serviettes propres", "Produits d'accueil", "Miroir nettoyé"] },
  { cat: "Cuisine",       items: ["Plan de travail nettoyé", "Vaisselle rangée", "Réfrigérateur vérifié", "Poubelles vidées", "Sol propre"] },
  { cat: "Salon",         items: ["Aspirateur passé", "Poussière essuyée", "Coussins remis", "Vitres propres"] },
  { cat: "Général",       items: ["Équipements vérifiés", "Fenêtres fermées", "Rapport complété"] },
];

const DEMO = [
  { id: "r1", logement: "Villa Azur",         secteur: "Nice",           guest: "M. Dupont",      arrival: "2026-05-12", departure: "2026-05-16", status: "À nettoyer", notes: "" },
  { id: "r2", logement: "Apt. Promenade",     secteur: "Nice",           guest: "Famille Martin", arrival: "2026-05-10", departure: "2026-05-14", status: "En cours",   notes: "" },
  { id: "r3", logement: "Mas des Oliviers",   secteur: "Cannes-Antibes", guest: "Mme Laurent",    arrival: "2026-05-11", departure: "2026-05-15", status: "Terminé",    notes: "" },
  { id: "r4", logement: "Villa Mimosa",       secteur: "Cannes-Antibes", guest: "M. Bernard",     arrival: "2026-05-14", departure: "2026-05-18", status: "À nettoyer", notes: "" },
  { id: "r5", logement: "Les Cyprès",         secteur: "Villeneuve",     guest: "Famille Petit",  arrival: "2026-05-09", departure: "2026-05-12", status: "Vérifié",    notes: "" },
  { id: "r6", logement: "Bastide Provençale", secteur: "Villeneuve",     guest: "M. Roux",        arrival: "2026-05-13", departure: "2026-05-17", status: "À nettoyer", notes: "" },
];

// ── Storage (localStorage pour prod) ──────────────────
const db = {
  get(k)    { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const uid    = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const toB64  = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
const diffDays = (dateStr) => { const d = new Date(dateStr); d.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return Math.round((d - t) / 86400000); };
const fmtDate  = (d) => { if (!d) return "–"; return new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }); };

const C    = { navy: "#0C1A35", gold: "#C8A84B", cream: "#F7F5F0", white: "#fff", g100: "#F3F4F6", g200: "#E5E7EB", g400: "#9CA3AF", g600: "#6B7280", g800: "#1F2937" };
const card = { background: "white", borderRadius: "14px", boxShadow: "0 2px 16px rgba(12,26,53,0.07)", border: `1px solid ${C.g200}` };
const inp  = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${C.g200}`, fontSize: "14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const lbl  = { fontSize: "12px", fontWeight: "600", color: C.g600, display: "block", marginBottom: "5px" };

function useFonts() {
  useEffect(() => {
    if (document.getElementById("cfaz")) return;
    const l = document.createElement("link");
    l.id = "cfaz"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
}

export default function App() {
  useFonts();
  const [user,  setUser]  = useState(null);
  const [tab,   setTab]   = useState("planning");
  const [res,   setRes]   = useState([]);
  const [sig,   setSig]   = useState([]);
  const [ckl,   setCkl]   = useState({});
  const [msgs,  setMsgs]  = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRes(db.get("res_v1") || DEMO);
    setSig(db.get("sig_v1") || []);
    setCkl(db.get("ckl_v1") || {});
    setMsgs(db.get("msg_v1") || []);
    setReady(true);
  }, []);

  useEffect(() => { if (ready) db.set("res_v1", res);  }, [res,  ready]);
  useEffect(() => { if (ready) db.set("sig_v1", sig);  }, [sig,  ready]);
  useEffect(() => { if (ready) db.set("ckl_v1", ckl);  }, [ckl,  ready]);
  useEffect(() => { if (ready) db.set("msg_v1", msgs); }, [msgs, ready]);

  if (!user)  return <Login onLogin={(u) => { setUser(u); setTab("planning"); }} />;
  if (!ready) return <Loader />;

  const myRes = user.sector === "all" ? res : res.filter((r) => r.secteur === user.sector);
  const mySig = user.sector === "all" ? sig : sig.filter((s) => s.secteur === user.sector);

  return (
    <Shell user={user} tab={tab} setTab={setTab} onLogout={() => setUser(null)} msgCount={msgs.length}>
      {tab === "planning"     && <Planning res={myRes} user={user} onUpdate={(u) => setRes((p) => p.map((r) => r.id === u.id ? u : r))} onAdd={(n) => setRes((p) => [...p, { ...n, id: uid() }])} onDelete={(id) => setRes((p) => p.filter((r) => r.id !== id))} />}
      {tab === "signalements" && <Signalements items={mySig} res={myRes} user={user} onAdd={(s) => setSig((p) => [...p, { ...s, id: uid(), date: new Date().toISOString() }])} onDelete={(id) => setSig((p) => p.filter((s) => s.id !== id))} />}
      {tab === "checklist"    && <Checklist res={myRes} ckl={ckl} onUpdate={(rid, c) => setCkl((p) => ({ ...p, [rid]: c }))} />}
      {tab === "messages"     && <Messages msgs={msgs} user={user} onSend={(m) => setMsgs((p) => [...p, { ...m, id: uid(), date: new Date().toISOString() }])} />}
    </Shell>
  );
}

function Loader() {
  return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"DM Sans,sans-serif", color:"white", background:C.navy }}>Chargement…</div>;
}

function Login({ onLogin }) {
  const [sel, setSel] = useState(null);
  const [pw,  setPw]  = useState("");
  const [err, setErr] = useState("");
  const submit = () => pw === sel.password ? onLogin(sel) : setErr("Mot de passe incorrect");

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(145deg,${C.navy} 0%,#1a3464 55%,#0d2447 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"DM Sans,sans-serif", padding:"24px", position:"relative", overflow:"hidden" }}>
      {[600,400,250].map((s,i) => (
        <div key={i} style={{ position:"absolute", width:s, height:s, borderRadius:"50%", border:`1px solid rgba(200,168,75,${0.05+i*0.03})`, top:`${[-120,-40,40][i]}px`, right:`${[-120,-20,60][i]}px`, pointerEvents:"none" }} />
      ))}
      <div style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(24px)", border:"1px solid rgba(200,168,75,0.2)", borderRadius:"22px", padding:"44px 40px", width:"100%", maxWidth:"400px" }}>
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ fontFamily:"Playfair Display,serif", fontSize:"20px", color:C.gold, letterSpacing:"2px", fontWeight:"700" }}>CC COZY HOST</div>
          <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"10px", letterSpacing:"5px", marginTop:"4px" }}>CONCIERGERIE</div>
          <div style={{ width:"40px", height:"1px", background:`linear-gradient(90deg,transparent,${C.gold},transparent)`, margin:"18px auto 0" }} />
        </div>
        {!sel ? (
          <>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:"13px", textAlign:"center", marginBottom:"20px" }}>Choisissez votre profil</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {ACCOUNTS.map((a) => (
                <button key={a.id} onClick={() => { setSel(a); setErr(""); setPw(""); }}
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", padding:"15px 18px", color:"white", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px", fontFamily:"DM Sans,sans-serif", transition:"all 0.2s", width:"100%" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background="rgba(200,168,75,0.12)"; e.currentTarget.style.borderColor="rgba(200,168,75,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}>
                  <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:a.isAdmin?"rgba(200,168,75,0.2)":"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{a.emoji}</div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:"14px", fontWeight:"600" }}>{a.name}</div>
                    {!a.isAdmin && <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", marginTop:"2px" }}>{a.sector}</div>}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setSel(null); setErr(""); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"13px", marginBottom:"20px", display:"flex", alignItems:"center", gap:"6px", fontFamily:"inherit", padding:0 }}>← Retour</button>
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"24px" }}>
              <span style={{ fontSize:"22px" }}>{sel.emoji}</span>
              <span style={{ color:"white", fontSize:"16px", fontWeight:"600" }}>{sel.name}</span>
            </div>
            <input type="password" placeholder="Mot de passe" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} onKeyDown={(e) => e.key==="Enter" && submit()} autoFocus
              style={{ ...inp, background:"rgba(255,255,255,0.08)", color:"white", border:`1px solid ${err?"#FCA5A5":"rgba(255,255,255,0.15)"}`, marginBottom:"8px" }} />
            {err && <p style={{ color:"#FCA5A5", fontSize:"13px", marginBottom:"10px" }}>{err}</p>}
            <button onClick={submit} style={{ width:"100%", padding:"14px", background:C.gold, color:C.navy, border:"none", borderRadius:"10px", fontWeight:"700", fontSize:"15px", cursor:"pointer", fontFamily:"inherit", marginTop:"8px" }}>
              Se connecter
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Shell({ children, user, tab, setTab, onLogout, msgCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sc  = SECTOR_COLORS[user.sector] || C.gold;
  const nav = [
    { id:"planning",     label:"Planning",     icon:"📅" },
    { id:"signalements", label:"Signalements", icon:"📷" },
    { id:"checklist",    label:"Checklist",    icon:"✅" },
    { id:"messages",     label:"Messages",     icon:"💬" },
  ];

  const isMobile = window.innerWidth < 768;

  // Mobile bottom nav
  if (isMobile) {
    return (
      <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"DM Sans,sans-serif", background:C.cream }}>
        {/* Header mobile */}
        <div style={{ background:C.navy, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div>
            <div style={{ fontFamily:"Playfair Display,serif", color:C.gold, fontSize:"13px", fontWeight:"700", letterSpacing:"1px" }}>CC COZY HOST</div>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.4)", marginTop:"1px" }}>CONCIERGERIE · {user.name}</div>
          </div>
          <button onClick={onLogout} style={{ background:"none", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"12px", fontFamily:"inherit", padding:"6px 12px" }}>
            🚪 Sortir
          </button>
        </div>
        {/* Contenu */}
        <main style={{ flex:1, padding:"20px 16px", overflow:"auto", paddingBottom:"80px" }}>{children}</main>
        {/* Bottom nav */}
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.navy, borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", zIndex:100 }}>
          {nav.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ flex:1, padding:"10px 0 12px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", color:tab===n.id?C.gold:"rgba(255,255,255,0.35)", fontFamily:"inherit", position:"relative" }}>
              <span style={{ fontSize:"20px" }}>{n.icon}</span>
              <span style={{ fontSize:"10px", fontWeight:tab===n.id?"700":"400" }}>{n.label}</span>
              {n.id==="messages" && msgCount>0 && <span style={{ position:"absolute", top:"6px", right:"18px", background:"#EF4444", color:"white", borderRadius:"10px", padding:"1px 5px", fontSize:"9px", fontWeight:"700" }}>{msgCount}</span>}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"DM Sans,sans-serif", background:C.cream }}>
      <aside style={{ width:"228px", minWidth:"228px", background:C.navy, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh" }}>
        <div style={{ padding:"26px 22px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily:"Playfair Display,serif", color:C.gold, fontSize:"13px", fontWeight:"700", letterSpacing:"1px" }}>CC COZY HOST</div>
          <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.22)", letterSpacing:"3px", marginTop:"2px" }}>CONCIERGERIE</div>
        </div>
        <div style={{ padding:"14px 22px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:sc, flexShrink:0 }} />
          <div>
            <div style={{ color:"white", fontSize:"12px", fontWeight:"600" }}>{user.name}</div>
            <div style={{ color:"rgba(255,255,255,0.28)", fontSize:"10px", marginTop:"1px" }}>{user.sector==="all"?"Tous les secteurs":user.sector}</div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"14px 10px" }}>
          {nav.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ width:"100%", padding:"11px 14px", borderRadius:"10px", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"11px", marginBottom:"3px", background:tab===n.id?"rgba(200,168,75,0.14)":"transparent", color:tab===n.id?C.gold:"rgba(255,255,255,0.48)", fontFamily:"DM Sans,sans-serif", fontSize:"14px", fontWeight:tab===n.id?"600":"400", transition:"all 0.15s", textAlign:"left", borderLeft:tab===n.id?`3px solid ${C.gold}`:"3px solid transparent" }}>
              <span style={{ fontSize:"16px" }}>{n.icon}</span>
              <span style={{ flex:1 }}>{n.label}</span>
              {n.id==="messages" && msgCount>0 && <span style={{ background:"#EF4444", color:"white", borderRadius:"10px", padding:"1px 7px", fontSize:"10px", fontWeight:"700" }}>{msgCount}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"16px 22px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onLogout} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:"13px", fontFamily:"inherit", display:"flex", alignItems:"center", gap:"8px", padding:0 }}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>
      <main style={{ flex:1, padding:"32px 36px", overflow:"auto" }}>{children}</main>
    </div>
  );
}

function Planning({ res, user, onUpdate, onAdd, onDelete }) {
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showDone,   setShowDone]   = useState(false);
  const blank = { logement:"", secteur:"Nice", guest:"", arrival:"", departure:"", status:"À nettoyer", notes:"" };
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const categorize = (r) => {
    const diff = diffDays(r.departure);
    const done = r.status === "Terminé" || r.status === "Vérifié";
    if (done && diff < 0) return "done";
    if (diff < 0)   return "retard";
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    if (diff <= 7)  return "week";
    return "later";
  };

  const sorted   = [...res].sort((a, b) => a.departure.localeCompare(b.departure) || a.arrival.localeCompare(b.arrival));
  const retard   = sorted.filter((r) => categorize(r) === "retard");
  const today_   = sorted.filter((r) => categorize(r) === "today");
  const tomorrow = sorted.filter((r) => categorize(r) === "tomorrow");
  const week     = sorted.filter((r) => categorize(r) === "week");
  const later    = sorted.filter((r) => categorize(r) === "later");
  const done     = sorted.filter((r) => categorize(r) === "done");

  const urgentCount  = retard.length + today_.filter(r => r.status !== "Terminé" && r.status !== "Vérifié").length;
  const enCoursCount = res.filter((r) => r.status === "En cours").length;
  const termineCount = res.filter((r) => r.status === "Terminé" || r.status === "Vérifié").length;

  const openAdd  = () => { setForm(blank); setEditing(null); setShowForm(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditing(r.id); setShowForm(true); };
  const save = () => {
    if (!form.logement || !form.arrival || !form.departure) return;
    editing ? onUpdate({ ...form, id: editing }) : onAdd(form);
    setShowForm(false);
  };

  const Section = ({ label, items, urgency }) => {
    if (!items.length) return null;
    const colors = {
      retard:   { bg:"#FEF2F2", border:"#FECACA", dot:"#EF4444", text:"#991B1B" },
      today:    { bg:"#FFF7ED", border:"#FED7AA", dot:"#F97316", text:"#9A3412" },
      tomorrow: { bg:"#FEFCE8", border:"#FEF08A", dot:"#EAB308", text:"#713F12" },
      week:     { bg:"#EFF6FF", border:"#BFDBFE", dot:"#3B82F6", text:"#1E40AF" },
      later:    { bg:"#F9FAFB", border:"#E5E7EB", dot:"#9CA3AF", text:"#6B7280" },
      done:     { bg:"#F0FDF4", border:"#BBF7D0", dot:"#10B981", text:"#065F46" },
    };
    const col = colors[urgency] || colors.later;
    return (
      <div style={{ marginBottom:"24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
          <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:col.dot, flexShrink:0 }} />
          <span style={{ fontSize:"13px", fontWeight:"700", color:col.text, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</span>
          <span style={{ fontSize:"12px", color:col.text, background:col.bg, border:`1px solid ${col.border}`, borderRadius:"12px", padding:"1px 9px", fontWeight:"700" }}>{items.length}</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {items.map((r) => <ReservationCard key={r.id} r={r} urgency={urgency} onUpdate={onUpdate} user={user} onEdit={openEdit} onDelete={(id) => setConfirmDel(id)} />)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px" }}>
        <div>
          <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:"26px", color:C.navy, margin:"0 0 4px", fontWeight:"700" }}>Planning des ménages</h1>
          <p style={{ color:C.g400, fontSize:"13px", margin:0 }}>{new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
        </div>
        {user.isAdmin && <button onClick={openAdd} style={{ background:C.gold, color:C.navy, border:"none", borderRadius:"10px", padding:"11px 20px", fontWeight:"700", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>+ Réservation</button>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"28px" }}>
        {[
          { label:"⚠️ Urgent",   val:urgentCount,  bg:"#FEF2F2", c:"#991B1B", border:"#FECACA" },
          { label:"🔄 En cours", val:enCoursCount,  bg:"#EFF6FF", c:"#1E40AF", border:"#BFDBFE" },
          { label:"✅ Terminés", val:termineCount,  bg:"#F0FDF4", c:"#065F46", border:"#A7F3D0" },
        ].map((s) => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:"12px", padding:"14px 16px" }}>
            <div style={{ fontSize:"12px", color:s.c, fontWeight:"600", marginBottom:"4px" }}>{s.label}</div>
            <div style={{ fontSize:"26px", fontWeight:"700", color:s.c }}>{s.val}</div>
          </div>
        ))}
      </div>

      {retard.length > 0  && <Section label="🚨 En retard — urgence" items={retard}   urgency="retard"   />}
      {today_.length > 0  && <Section label="📅 Aujourd'hui"          items={today_}   urgency="today"    />}
      {tomorrow.length> 0 && <Section label="⏰ Demain"               items={tomorrow} urgency="tomorrow" />}
      {week.length > 0    && <Section label="📆 Cette semaine"        items={week}     urgency="week"     />}
      {later.length > 0   && <Section label="🗓️ Plus tard"            items={later}    urgency="later"    />}

      {res.length === 0 && (
        <div style={{ ...card, padding:"60px", textAlign:"center", color:C.g400 }}>
          Aucune réservation.<br />
          {user.isAdmin && <span style={{ color:C.gold, cursor:"pointer", fontWeight:"600" }} onClick={openAdd}>+ Ajouter une réservation</span>}
        </div>
      )}

      {done.length > 0 && (
        <div style={{ marginTop:"8px" }}>
          <button onClick={() => setShowDone((p)=>!p)} style={{ background:"none", border:`1px solid ${C.g200}`, borderRadius:"8px", padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", color:C.g600, display:"flex", alignItems:"center", gap:"8px" }}>
            {showDone ? "▲" : "▼"} {done.length} réservation{done.length>1?"s":""} terminée{done.length>1?"s":""}
          </button>
          {showDone && <div style={{ marginTop:"12px" }}><Section label="Terminées" items={done} urgency="done" /></div>}
        </div>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)}>
          <h2 style={{ fontFamily:"Playfair Display,serif", color:C.navy, fontSize:"20px", margin:"0 0 12px" }}>Supprimer ?</h2>
          <p style={{ color:C.g600, fontSize:"14px", marginBottom:"24px" }}>Cette réservation sera supprimée définitivement.</p>
          <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
            <button onClick={() => setConfirmDel(null)} style={{ padding:"10px 20px", background:C.g100, border:"none", borderRadius:"8px", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={() => { onDelete(confirmDel); setConfirmDel(null); }} style={{ padding:"10px 20px", background:"#EF4444", color:"white", border:"none", borderRadius:"8px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>Supprimer</button>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} wide>
          <h2 style={{ fontFamily:"Playfair Display,serif", color:C.navy, fontSize:"20px", margin:"0 0 24px", fontWeight:"700" }}>{editing ? "Modifier" : "Nouvelle réservation"}</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Nom du logement *</label>
              <input value={form.logement} onChange={(e)=>f("logement",e.target.value)} placeholder="Ex: Villa Azur" style={inp} />
            </div>
            <div>
              <label style={lbl}>Secteur</label>
              <select value={form.secteur} onChange={(e)=>f("secteur",e.target.value)} style={inp}>
                {["Nice","Cannes-Antibes","Villeneuve"].map((s)=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Statut</label>
              <select value={form.status} onChange={(e)=>f("status",e.target.value)} style={inp}>
                {Object.keys(STATUS).map((s)=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Nom du client</label>
              <input value={form.guest} onChange={(e)=>f("guest",e.target.value)} placeholder="M. / Mme..." style={inp} />
            </div>
            <div>
              <label style={lbl}>Date d'arrivée *</label>
              <input type="date" value={form.arrival} onChange={(e)=>f("arrival",e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Date de départ *</label>
              <input type="date" value={form.departure} onChange={(e)=>f("departure",e.target.value)} style={inp} />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Notes</label>
              <textarea value={form.notes} onChange={(e)=>f("notes",e.target.value)} rows={3} style={{ ...inp, resize:"vertical" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:"10px", marginTop:"24px", justifyContent:"flex-end" }}>
            <button onClick={()=>setShowForm(false)} style={{ padding:"10px 20px", background:C.g100, border:"none", borderRadius:"8px", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={save} style={{ padding:"10px 24px", background:C.gold, color:C.navy, border:"none", borderRadius:"8px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{editing?"Enregistrer":"Ajouter"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReservationCard({ r, urgency, onUpdate, user, onEdit, onDelete }) {
  const st     = STATUS[r.status];
  const sc     = SECTOR_COLORS[r.secteur];
  const dep    = diffDays(r.departure);
  const nights = Math.max(0, Math.round((new Date(r.departure) - new Date(r.arrival)) / 86400000));

  const windowLabel = () => {
    if (dep < 0)   return { text:`Départ il y a ${Math.abs(dep)} j`, color:"#EF4444" };
    if (dep === 0) return { text:"Départ aujourd'hui !", color:"#F97316" };
    if (dep === 1) return { text:"Départ demain", color:"#EAB308" };
    return { text:`Départ dans ${dep} jours`, color:C.g600 };
  };
  const win = windowLabel();
  const urgentBorder = urgency === "retard" ? "3px solid #EF4444" : urgency === "today" ? "3px solid #F97316" : `1px solid ${C.g200}`;

  return (
    <div style={{ background:"white", borderRadius:"14px", boxShadow:"0 2px 16px rgba(12,26,53,0.06)", border:urgentBorder, padding:"16px 18px", display:"flex", gap:"14px", alignItems:"stretch" }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px", flexWrap:"wrap" }}>
          <span style={{ fontWeight:"700", fontSize:"16px", color:C.navy }}>{r.logement}</span>
          {user.sector === "all" && <span style={{ fontSize:"11px", background:sc+"18", color:sc, padding:"2px 9px", borderRadius:"20px", fontWeight:"600" }}>{r.secteur}</span>}
          {urgency === "retard" && <span style={{ fontSize:"11px", background:"#FEF2F2", color:"#EF4444", padding:"2px 9px", borderRadius:"20px", fontWeight:"700", border:"1px solid #FECACA" }}>⚠️ RETARD</span>}
        </div>
        <div style={{ fontSize:"13px", color:C.g600, marginBottom:"8px" }}>👤 {r.guest || "—"}</div>
        <div style={{ display:"flex", alignItems:"center", background:C.g100, borderRadius:"10px", overflow:"hidden", fontSize:"13px", marginBottom:"8px" }}>
          <div style={{ padding:"8px 12px", flex:1 }}>
            <div style={{ fontSize:"10px", fontWeight:"700", color:C.g400, textTransform:"uppercase", marginBottom:"1px" }}>Arrivée</div>
            <div style={{ fontWeight:"600", color:C.navy }}>{fmtDate(r.arrival)}</div>
          </div>
          <div style={{ padding:"0 8px", color:C.g400, fontSize:"16px" }}>→</div>
          <div style={{ padding:"8px 12px", flex:1 }}>
            <div style={{ fontSize:"10px", fontWeight:"700", color:dep<=0?"#F97316":C.g400, textTransform:"uppercase", marginBottom:"1px" }}>Départ</div>
            <div style={{ fontWeight:"600", color:dep<=0?"#F97316":C.navy }}>{fmtDate(r.departure)}</div>
          </div>
          <div style={{ padding:"8px 12px", borderLeft:`1px solid ${C.g200}` }}>
            <div style={{ fontSize:"10px", fontWeight:"700", color:C.g400, textTransform:"uppercase", marginBottom:"1px" }}>Durée</div>
            <div style={{ fontWeight:"600", color:C.navy }}>{nights}n</div>
          </div>
        </div>
        <div style={{ fontSize:"12px", color:win.color, fontWeight:"600" }}>🧹 {win.text}</div>
        {r.notes && <div style={{ fontSize:"12px", color:C.g400, marginTop:"4px", fontStyle:"italic" }}>💬 {r.notes}</div>}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px", flexShrink:0 }}>
        <select value={r.status} onChange={(e) => onUpdate({ ...r, status:e.target.value })}
          style={{ padding:"7px 10px", borderRadius:"10px", border:`1.5px solid ${st.border}`, background:st.bg, color:st.c, fontSize:"12px", fontWeight:"700", cursor:"pointer", outline:"none", fontFamily:"inherit", minWidth:"120px" }}>
          {Object.keys(STATUS).map((s) => <option key={s}>{s}</option>)}
        </select>
        {user.isAdmin && (
          <div style={{ display:"flex", gap:"6px" }}>
            <button onClick={() => onEdit(r)} style={{ background:C.g100, border:"none", borderRadius:"7px", padding:"6px 10px", cursor:"pointer", fontSize:"13px" }}>✏️</button>
            <button onClick={() => onDelete(r.id)} style={{ background:"#FEF2F2", border:"none", borderRadius:"7px", padding:"6px 10px", cursor:"pointer", fontSize:"13px" }}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Signalements({ items, res, user, onAdd, onDelete }) {
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ resId:"", description:"", photos:[] });
  const [uploading,  setUploading]  = useState(false);
  const [lightbox,   setLightbox]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const fileRef = useRef();

  const handleFiles = async (e) => {
    setUploading(true);
    const files = Array.from(e.target.files).slice(0, 5 - form.photos.length);
    const b64s  = await Promise.all(files.map(toB64));
    setForm((p) => ({ ...p, photos:[...p.photos,...b64s].slice(0,5) }));
    setUploading(false);
    e.target.value = "";
  };

  const submit = () => {
    if (!form.resId || !form.description.trim()) return;
    const r = res.find((r) => r.id === form.resId);
    onAdd({ resId:form.resId, logement:r?.logement||"—", secteur:r?.secteur||"", description:form.description, photos:form.photos, reportedBy:user.name });
    setForm({ resId:"", description:"", photos:[] });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"22px" }}>
        <div>
          <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:"26px", color:C.navy, margin:0, fontWeight:"700" }}>Signalements</h1>
          <p style={{ color:C.g400, fontSize:"13px", margin:"4px 0 0" }}>{items.length} signalement{items.length!==1?"s":""}</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background:C.gold, color:C.navy, border:"none", borderRadius:"10px", padding:"11px 16px", fontWeight:"700", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>+ Signaler</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {items.length===0 && <div style={{ ...card, padding:"50px", textAlign:"center", color:C.g400 }}>Aucun signalement 🌟</div>}
        {[...items].reverse().map((s) => {
          const sc = SECTOR_COLORS[s.secteur];
          return (
            <div key={s.id} style={{ ...card, padding:"18px 20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                <div>
                  <div style={{ fontWeight:"700", fontSize:"16px", color:C.navy }}>{s.logement}</div>
                  <div style={{ fontSize:"12px", color:C.g400, marginTop:"3px" }}>👤 {s.reportedBy} · {new Date(s.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  <span style={{ fontSize:"11px", background:sc+"18", color:sc, padding:"3px 10px", borderRadius:"20px", fontWeight:"600" }}>{s.secteur}</span>
                  {(user.isAdmin || s.reportedBy===user.name) && (
                    <button onClick={() => setConfirmDel(s.id)} style={{ background:"#FEE2E2", border:"none", borderRadius:"6px", padding:"5px 8px", cursor:"pointer", fontSize:"13px" }}>🗑️</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize:"14px", color:C.g800, margin:"0 0 10px", lineHeight:"1.65" }}>{s.description}</p>
              {s.photos?.length>0 && (
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {s.photos.map((p,i) => (
                    <img key={i} src={p} onClick={() => setLightbox(p)} alt="" style={{ width:"72px", height:"72px", objectFit:"cover", borderRadius:"8px", cursor:"zoom-in", border:`1px solid ${C.g200}` }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)}>
          <h2 style={{ fontFamily:"Playfair Display,serif", color:C.navy, fontSize:"20px", margin:"0 0 12px" }}>Supprimer ?</h2>
          <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"20px" }}>
            <button onClick={() => setConfirmDel(null)} style={{ padding:"10px 20px", background:C.g100, border:"none", borderRadius:"8px", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={() => { onDelete(confirmDel); setConfirmDel(null); }} style={{ padding:"10px 20px", background:"#EF4444", color:"white", border:"none", borderRadius:"8px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>Supprimer</button>
          </div>
        </Modal>
      )}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} wide>
          <h2 style={{ fontFamily:"Playfair Display,serif", color:C.navy, fontSize:"20px", margin:"0 0 24px", fontWeight:"700" }}>Nouveau signalement</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            <div>
              <label style={lbl}>Logement *</label>
              <select value={form.resId} onChange={(e) => setForm((p)=>({...p,resId:e.target.value}))} style={inp}>
                <option value="">— Choisir —</option>
                {res.map((r) => <option key={r.id} value={r.id}>{r.logement} · {r.secteur}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Description *</label>
              <textarea value={form.description} onChange={(e) => setForm((p)=>({...p,description:e.target.value}))} rows={4} style={{ ...inp, resize:"vertical" }} />
            </div>
            <div>
              <label style={lbl}>Photos ({form.photos.length}/5)</label>
              <div onClick={() => fileRef.current.click()} style={{ border:`2px dashed ${C.g200}`, borderRadius:"10px", padding:"20px", textAlign:"center", cursor:"pointer", color:C.g400, fontSize:"14px" }}>
                {uploading ? "⏳ Chargement..." : "📷 Ajouter des photos"}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handleFiles} />
              </div>
              {form.photos.length>0 && (
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginTop:"10px" }}>
                  {form.photos.map((p,i) => (
                    <div key={i} style={{ position:"relative" }}>
                      <img src={p} style={{ width:"70px", height:"70px", objectFit:"cover", borderRadius:"8px" }} alt="" />
                      <button onClick={() => setForm((f)=>({...f,photos:f.photos.filter((_,j)=>j!==i)}))} style={{ position:"absolute", top:"-7px", right:"-7px", background:"#EF4444", color:"white", border:"none", borderRadius:"50%", width:"20px", height:"20px", cursor:"pointer", fontSize:"13px", lineHeight:"20px", padding:0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:"10px", marginTop:"24px", justifyContent:"flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{ padding:"10px 20px", background:C.g100, border:"none", borderRadius:"8px", cursor:"pointer", fontFamily:"inherit" }}>Annuler</button>
            <button onClick={submit} style={{ padding:"10px 24px", background:C.gold, color:C.navy, border:"none", borderRadius:"8px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>Envoyer</button>
          </div>
        </Modal>
      )}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, cursor:"zoom-out" }}>
          <img src={lightbox} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:"12px", objectFit:"contain" }} />
        </div>
      )}
    </div>
  );
}

function Checklist({ res, ckl, onUpdate }) {
  const [selId, setSelId] = useState("");
  const selected = res.find((r) => r.id === selId);
  const myckl    = ckl[selId] || {};
  const total    = CHECKLIST.reduce((s, cat) => s + cat.items.length, 0);
  const done     = Object.values(myckl).filter(Boolean).length;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
  const toggle   = (cat, item) => { const key = `${cat}__${item}`; onUpdate(selId, { ...myckl, [key]: !myckl[key] }); };

  return (
    <div>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:"26px", color:C.navy, margin:"0 0 4px", fontWeight:"700" }}>Checklist ménage</h1>
        <p style={{ color:C.g400, fontSize:"13px", margin:0 }}>Suivez l'avancement du nettoyage</p>
      </div>
      <select value={selId} onChange={(e) => setSelId(e.target.value)}
        style={{ width:"100%", padding:"12px 16px", borderRadius:"10px", border:`1px solid ${C.g200}`, fontSize:"15px", fontFamily:"inherit", outline:"none", marginBottom:"24px", background:"white", color:selId?C.navy:C.g400 }}>
        <option value="">— Choisir un logement —</option>
        {res.map((r) => <option key={r.id} value={r.id}>{r.logement} · {fmtDate(r.arrival)} → {fmtDate(r.departure)}</option>)}
      </select>
      {selId && (
        <>
          <div style={{ ...card, padding:"22px 26px", marginBottom:"18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div>
                <div style={{ fontWeight:"700", color:C.navy, fontSize:"16px" }}>{selected?.logement}</div>
                <div style={{ fontSize:"13px", color:C.g400, marginTop:"2px" }}>{done}/{total} tâches</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:"700", fontSize:"28px", color:pct===100?"#059669":C.gold }}>{pct}%</div>
                {pct===100 && <div style={{ fontSize:"12px", color:"#059669" }}>✅ Terminé !</div>}
              </div>
            </div>
            <div style={{ background:C.g200, borderRadius:"6px", height:"8px", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:"6px", background:pct===100?"#10B981":C.gold, width:`${pct}%`, transition:"width 0.4s ease" }} />
            </div>
            {done>0 && <button onClick={() => onUpdate(selId,{})} style={{ marginTop:"12px", background:"none", border:"none", color:C.g400, fontSize:"12px", cursor:"pointer", fontFamily:"inherit", padding:0 }}>↺ Réinitialiser</button>}
          </div>
          {CHECKLIST.map((cat) => {
            const catDone = cat.items.filter((item) => myckl[`${cat.cat}__${item}`]).length;
            return (
              <div key={cat.cat} style={{ ...card, padding:"18px 22px", marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                  <div style={{ fontWeight:"700", color:C.navy, fontSize:"15px" }}>{cat.cat}</div>
                  <span style={{ fontSize:"12px", color:catDone===cat.items.length?"#059669":C.g400, fontWeight:"600" }}>{catDone}/{cat.items.length}</span>
                </div>
                {cat.items.map((item) => {
                  const key = `${cat.cat}__${item}`;
                  const checked = !!myckl[key];
                  return (
                    <div key={item} onClick={() => toggle(cat.cat, item)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom:`1px solid ${C.g100}`, cursor:"pointer" }}>
                      <div style={{ width:"22px", height:"22px", borderRadius:"6px", border:`2px solid ${checked?"#10B981":C.g200}`, background:checked?"#10B981":"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                        {checked && <span style={{ color:"white", fontSize:"13px", fontWeight:"bold" }}>✓</span>}
                      </div>
                      <span style={{ fontSize:"14px", color:checked?C.g400:C.g800, textDecoration:checked?"line-through":"none" }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function Messages({ msgs, user, onSend }) {
  const [text, setText] = useState("");
  const [to,   setTo]   = useState("all");
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = () => {
    if (!text.trim()) return;
    onSend({ text:text.trim(), to, senderId:user.id, senderName:user.name, sectorColor:SECTOR_COLORS[user.sector]||C.gold });
    setText("");
  };

  const visible = user.isAdmin ? msgs : msgs.filter((m) => m.to==="all" || m.to===user.sector || m.senderId===user.id);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 130px)" }}>
      <div style={{ marginBottom:"16px" }}>
        <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:"26px", color:C.navy, margin:"0 0 4px", fontWeight:"700" }}>Messages</h1>
        <p style={{ color:C.g400, fontSize:"13px", margin:0 }}>Échanges entre équipes</p>
      </div>
      <div style={{ ...card, flex:1, overflow:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:"10px", marginBottom:"12px" }}>
        {visible.length===0 && <div style={{ textAlign:"center", color:C.g400, marginTop:"60px", fontSize:"14px" }}>Aucun message 👋</div>}
        {visible.map((m) => {
          const isMe = m.senderId===user.id;
          return (
            <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems:isMe?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"72%" }}>
                {!isMe && <div style={{ fontSize:"11px", color:m.sectorColor||C.g400, fontWeight:"700", marginBottom:"3px" }}>{m.senderName}</div>}
                <div style={{ background:isMe?C.navy:"white", color:isMe?"white":C.g800, border:isMe?"none":`1px solid ${C.g200}`, borderRadius:isMe?"16px 16px 4px 16px":"4px 16px 16px 16px", padding:"10px 14px", fontSize:"14px", lineHeight:"1.5" }}>
                  {m.to!=="all" && <div style={{ fontSize:"10px", opacity:0.5, marginBottom:"3px" }}>→ {m.to}</div>}
                  {m.text}
                </div>
                <div style={{ fontSize:"10px", color:C.g400, marginTop:"3px", textAlign:isMe?"right":"left" }}>
                  {new Date(m.date).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ ...card, padding:"10px 14px", display:"flex", gap:"8px", alignItems:"flex-end" }}>
        <select value={to} onChange={(e) => setTo(e.target.value)} style={{ padding:"9px 10px", borderRadius:"8px", border:`1px solid ${C.g200}`, fontSize:"12px", fontFamily:"inherit", outline:"none", flexShrink:0, color:C.navy }}>
          <option value="all">📢 Tous</option>
          {["Nice","Cannes-Antibes","Villeneuve"].map((s)=><option key={s} value={s}>{s}</option>)}
        </select>
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }} placeholder="Message…" rows={2}
          style={{ flex:1, padding:"9px 12px", borderRadius:"8px", border:`1px solid ${C.g200}`, fontSize:"14px", fontFamily:"inherit", outline:"none", resize:"none" }} />
        <button onClick={send} style={{ background:C.gold, color:C.navy, border:"none", borderRadius:"8px", padding:"10px 16px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>→</button>
      </div>
    </div>
  );
}

function Modal({ children, onClose, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(12,26,53,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"24px" }}
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"white", borderRadius:"18px", padding:"28px", width:"100%", maxWidth:wide?"540px":"400px", maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(12,26,53,0.2)" }}>
        {children}
      </div>
    </div>
  );
}
