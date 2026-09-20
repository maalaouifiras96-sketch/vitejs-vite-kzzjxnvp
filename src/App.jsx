// src/App.jsx
// Tabib Hub — version connectée à Supabase (stockage réel des PDF)

import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { FileText, Bell, Download, Send, CheckCircle, AlertCircle, Upload, X, Paperclip, Loader2, Globe } from "lucide-react";

const C = {
  navy: "#0F2247", navyMid: "#1B3A6B", teal: "#00B4A6", tealBg: "#E0F7F5",
  amber: "#F59E0B", green: "#10B981", greenBg: "#D1FAE5",
  red: "#EF4444", redBg: "#FEE2E2",
  surface: "#F8FAFC", white: "#fff", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", light: "#94A3B8",
};

const YEARS = [
  { id: 1, label: "PCEM1", sub: "Basic Sciences", color: "#4361EE", bg: "#EEF0FF",
    courses: [
      { code: "ANAT101", name: "General Anatomy", files: 4, updated: "Jun 10" },
      { code: "HIST101", name: "Histology & Cytology", files: 2, updated: "Jun 5" },
      { code: "BIOC101", name: "Biochemistry", files: 5, updated: "Jun 8" },
      { code: "PHYS101", name: "Human Physiology I", files: 3, updated: "May 28" },
      { code: "BPHY101", name: "Biophysics", files: 1, updated: "May 20" },
      { code: "EMBR101", name: "Embryology", files: 2, updated: "Jun 1" },
      { code: "MENG101", name: "Medical English", files: 3, updated: "Jun 12" },
    ]},
  { id: 2, label: "PCEM2", sub: "Fundamental Sciences", color: "#3B82F6", bg: "#EFF6FF",
    courses: [
      { code: "ANAT201", name: "Regional Anatomy", files: 6, updated: "Jun 11" },
      { code: "PHYS201", name: "Human Physiology II", files: 4, updated: "Jun 9" },
      { code: "PHAR201", name: "General Pharmacology", files: 5, updated: "Jun 7" },
      { code: "MICR201", name: "Microbiology & Virology", files: 3, updated: "Jun 3" },
      { code: "IMMU201", name: "Immunology", files: 2, updated: "May 25" },
      { code: "PATH201", name: "General Pathology", files: 4, updated: "Jun 1" },
    ]},
  { id: 3, label: "DCEM1", sub: "Clinical Introduction", color: "#06B6D4", bg: "#ECFEFF",
    courses: [
      { code: "SEMI301", name: "Clinical Semiology", files: 5, updated: "Jun 12" },
      { code: "PATH301", name: "Special Pathology", files: 4, updated: "Jun 8" },
      { code: "PHAR301", name: "Clinical Pharmacology", files: 3, updated: "Jun 5" },
      { code: "RADI301", name: "Radiology Basics", files: 2, updated: "May 30" },
      { code: "EPID301", name: "Epidemiology", files: 2, updated: "May 22" },
      { code: "ETH301", name: "Medical Ethics & Law", files: 1, updated: "May 18" },
    ]},
  { id: 4, label: "DCEM2", sub: "Clinical Rotations", color: "#10B981", bg: "#ECFDF5",
    courses: [
      { code: "INTM401", name: "Internal Medicine", files: 7, updated: "Jun 14" },
      { code: "SURG401", name: "General Surgery", files: 6, updated: "Jun 13" },
      { code: "PEDI401", name: "Pediatrics", files: 5, updated: "Jun 10" },
      { code: "GYNE401", name: "Gynecology & Obstetrics", files: 4, updated: "Jun 8" },
      { code: "EMER401", name: "Emergency Medicine", files: 3, updated: "Jun 5" },
      { code: "PSYC401", name: "Psychiatry", files: 3, updated: "Jun 2" },
    ]},
  { id: 5, label: "DCEM3", sub: "Advanced Clinical", color: "#059669", bg: "#D1FAE5",
    courses: [
      { code: "CARD501", name: "Cardiology", files: 6, updated: "Jun 15" },
      { code: "NEUR501", name: "Neurology", files: 5, updated: "Jun 12" },
      { code: "DERM501", name: "Dermatology", files: 3, updated: "Jun 8" },
      { code: "ORTH501", name: "Orthopedics", files: 4, updated: "Jun 6" },
      { code: "ONCO501", name: "Oncology", files: 3, updated: "Jun 3" },
      { code: "OPHT501", name: "Ophthalmology", files: 2, updated: "May 28" },
    ]},
];

const NOTICES = [
  { id: 1, text: "New Anatomy materials uploaded for Year 1", date: "Jun 15", urgent: false },
  { id: 2, text: "URGENT: Year 2 exam schedule released — July 2025", date: "Jun 10", urgent: true },
  { id: 3, text: "Student feedback deadline extended to June 30", date: "Jun 5", urgent: true },
  { id: 4, text: "Welcome to the Tabib Hub portal!", date: "Jun 1", urgent: false },
];

const CATEGORIES = ["Missing course", "Exam schedule", "Translation issue", "Resource request", "Other"];
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB per PDF (adjust as needed)
const BUCKET = "course-pdfs";

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
const isPdf = (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Supabase helpers ──
async function listCourseFiles(courseCode) {
  const { data, error } = await supabase
    .from("course_files")
    .select("*")
    .eq("course_code", courseCode)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function uploadCourseFile(courseCode, file) {
  const path = `${courseCode}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: "application/pdf" });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("course_files")
    .insert({ course_code: courseCode, name: file.name, size: file.size, path })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCourseFile(id, path) {
  await supabase.storage.from(BUCKET).remove([path]);
  const { error } = await supabase.from("course_files").delete().eq("id", id);
  if (error) throw error;
}

function getFileUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function App() {
  const [activeYear, setActiveYear] = useState(1);
  const [form, setForm] = useState({ name: "", year: "", subject: "", message: "", category: "" });
  const [submitted, setSubmitted] = useState(false);
  const [navActive, setNavActive] = useState("home");

  const [uploads, setUploads] = useState({});
  const [loadedYears, setLoadedYears] = useState({});
  const [loadingYear, setLoadingYear] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [savingFor, setSavingFor] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const attachInputRef = useRef(null);

  const year = YEARS.find(y => y.id === activeYear);
  const nav = (id) => { scrollTo(id); setNavActive(id); };
  const flash = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loadedYears[activeYear]) return;
      setLoadingYear(true);
      const y = YEARS.find(yy => yy.id === activeYear);
      const results = await Promise.all(
        y.courses.map(c => listCourseFiles(c.code).catch(() => []))
      );
      if (cancelled) return;
      setUploads(prev => {
        const next = { ...prev };
        y.courses.forEach((c, i) => { next[c.code] = results[i]; });
        return next;
      });
      setLoadedYears(prev => ({ ...prev, [activeYear]: true }));
      setLoadingYear(false);
    })();
    return () => { cancelled = true; };
  }, [activeYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerCourseUpload = (code) => { setUploadingFor(code); fileInputRef.current.click(); };

  const onCourseFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const code = uploadingFor;
    if (!isPdf(file)) return flash("error", "PDF uniquement.");
    if (file.size > MAX_FILE_BYTES) return flash("error", `Fichier trop lourd — ${formatSize(MAX_FILE_BYTES)} max.`);

    setSavingFor(code);
    try {
      const entry = await uploadCourseFile(code, file);
      setUploads(prev => ({ ...prev, [code]: [entry, ...(prev[code] || [])] }));
      flash("success", `"${file.name}" ajouté à ${code}.`);
    } catch (err) {
      flash("error", "Échec de l'upload — réessaie.");
    } finally {
      setSavingFor(null);
    }
  };

  const removeUpload = async (code, id, path) => {
    setRemovingId(id);
    try {
      await deleteCourseFile(id, path);
      setUploads(prev => ({ ...prev, [code]: (prev[code] || []).filter(f => f.id !== id) }));
    } catch {
      flash("error", "Suppression impossible — réessaie.");
    } finally {
      setRemovingId(null);
    }
  };

  const onAttachChange = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!isPdf(file)) return flash("error", "PDF uniquement.");
    setAttachment({ name: file.name, size: file.size });
  };

  const handleSubmit = () => {
    if (!form.message.trim()) return;
    setSubmitted(true);
    setForm({ name: "", year: "", subject: "", message: "", category: "" });
    setAttachment(null);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: C.surface, minHeight: "100vh", color: C.text }}>
      <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={onCourseFileChange} />
      <input ref={attachInputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={onAttachChange} />

      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 100,
          background: toast.type === "success" ? C.greenBg : C.redBg,
          color: toast.type === "success" ? "#065F46" : "#991B1B",
          border: `1px solid ${toast.type === "success" ? C.green : C.red}`,
          borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 7, maxWidth: "88vw",
        }}>
          {toast.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>{toast.text}</span>
        </div>
      )}

      <nav style={{ background: C.navy, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: C.teal, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>⚕</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Tabib Hub</div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[["home","Home"],["courses","Courses"],["feedback","Feedback"]].map(([id,label]) => (
              <button key={id} onClick={() => nav(id)} style={{
                background: navActive === id ? "rgba(0,180,166,0.14)" : "none",
                border: "none", color: navActive === id ? C.teal : "#CBD5E1",
                cursor: "pointer", padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
              }}>{label}</button>
            ))}
          </div>
        </div>
      </nav>

      <div id="home" style={{ background: `linear-gradient(140deg, ${C.navy}, ${C.navyMid} 60%, #0E6D8A)`, padding: "60px 24px 40px", textAlign: "center" }}>
        <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 10px" }}>Tabib Hub</h1>
        <p style={{ color: C.light, fontSize: 14 }}>Faculty of Medicine of Sousse — English Program</p>
      </div>

      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 12, alignItems: "center", overflowX: "auto" }}>
          <Bell size={13} color={C.amber} />
          {NOTICES.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 7, background: a.urgent ? "#FFFBEB" : C.surface, borderRadius: 7, padding: "6px 13px", border: `1px solid ${a.urgent ? "#FDE68A" : C.border}`, flexShrink: 0 }}>
              <span style={{ fontSize: 13 }}>{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="courses" style={{ padding: "50px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.navy, marginBottom: 14 }}>Browse by Year</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, background: C.tealBg, borderRadius: 8, padding: "8px 13px", width: "fit-content" }}>
            <Globe size={13} color="#0E7A6E" />
            <span style={{ fontSize: 12, color: "#0E7A6E" }}>Fichiers réellement stockés — visibles par tout le monde.</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
            {YEARS.map(y => (
              <button key={y.id} onClick={() => setActiveYear(y.id)} style={{
                flex: "1 1 140px", padding: "12px 14px", borderRadius: 11,
                border: `2px solid ${activeYear === y.id ? y.color : C.border}`,
                background: activeYear === y.id ? y.color : C.white,
                color: activeYear === y.id ? "#fff" : C.muted, cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{y.label}</div>
              </button>
            ))}
          </div>

          {year && (
            <>
              {loadingYear && <div style={{ fontSize: 12, color: C.light, marginBottom: 12 }}>Chargement…</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 13 }}>
                {year.courses.map(c => {
                  const extra = uploads[c.code] || [];
                  const isSaving = savingFor === c.code;
                  return (
                    <div key={c.code} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: year.color, fontWeight: 700 }}>{c.code}</div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        </div>
                        <div style={{ background: year.bg, borderRadius: 7, padding: "5px 9px", display: "flex", alignItems: "center", gap: 4 }}>
                          <FileText size={12} color={year.color} />
                          <span style={{ fontSize: 12, color: year.color, fontWeight: 600 }}>{c.files + extra.length}</span>
                        </div>
                      </div>

                      {extra.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                          {extra.map(f => (
                            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 9px" }}>
                              <a href={getFileUrl(f.path)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text, textDecoration: "none", overflow: "hidden" }}>
                                <FileText size={12} color={year.color} />
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                                <span style={{ color: C.light }}>· {formatSize(f.size)}</span>
                              </a>
                              <button onClick={() => removeUpload(c.code, f.id, f.path)} disabled={removingId === f.id} style={{ background: "none", border: "none", cursor: "pointer", color: C.light }}>
                                {removingId === f.id ? <Loader2 size={13} /> : <X size={13} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => triggerCourseUpload(c.code)} disabled={isSaving} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", color: C.navy, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        {isSaving ? <Loader2 size={12} /> : <Upload size={12} />} {isSaving ? "Envoi…" : "Upload"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div id="feedback" style={{ background: C.white, padding: "50px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.navy, marginBottom: 16 }}>Submit Feedback</h2>
          {submitted && (
            <div style={{ background: C.greenBg, borderRadius: 11, padding: "13px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={17} color={C.green} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#065F46" }}>Envoyé !</span>
            </div>
          )}
          <div style={{ background: C.surface, borderRadius: 14, padding: 22 }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setForm(p => ({ ...p, category: cat }))} style={{
                  padding: "6px 13px", borderRadius: 18, border: `1px solid ${form.category === cat ? C.teal : C.border}`,
                  background: form.category === cat ? C.tealBg : C.white, color: form.category === cat ? C.teal : C.muted, fontSize: 12, cursor: "pointer",
                }}>{cat}</button>
              ))}
            </div>
            <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Ton message…"
              style={{ width: "100%", padding: "9px 13px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, marginBottom: 14, boxSizing: "border-box" }} />
            {attachment ? (
              <div style={{ display: "flex", justifyContent: "space-between", background: C.white, borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                <span style={{ fontSize: 13 }}><Paperclip size={12} /> {attachment.name}</span>
                <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none" }}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => attachInputRef.current.click()} style={{ display: "flex", alignItems: "center", gap: 7, background: C.white, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "9px 13px", width: "100%", marginBottom: 14, cursor: "pointer" }}>
                <Upload size={14} /> Joindre un PDF (optionnel)
              </button>
            )}
            <button onClick={handleSubmit} style={{ width: "100%", background: C.navy, color: "#fff", border: "none", padding: "13px", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", gap: 8 }}>
              <Send size={16} /> Submit
            </button>
          </div>
        </div>
      </div>

      <footer style={{ background: C.navy, padding: "24px", textAlign: "center", color: C.light, fontSize: 12 }}>
        Tabib Hub — Faculty of Medicine of Sousse © 2025
      </footer>
    </div>
  );
}