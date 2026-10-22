"use strict";
(() => {
  const STORAGE_KEY = "gabarita_license_v190";
  const DEVICE_KEY = "gabarita_device_v190";
  const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

  const $ = (id) => document.getElementById(id);
  const getDeviceId = () => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID?.() || `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  };
  const read = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } };
  const write = (v) => localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  const clear = () => localStorage.removeItem(STORAGE_KEY);
  const normalizeEmail = (v) => String(v || "").trim().toLowerCase();
  const setStatus = (text, type = "") => {
    const el = $("licenseMessage"); if (!el) return;
    el.textContent = text; el.className = `license-message${type ? ` ${type}` : ""}`;
  };
  const showGate = () => { document.body.classList.add("license-locked"); $("licenseGate")?.classList.remove("hidden"); };
  const hideGate = () => { document.body.classList.remove("license-locked"); $("licenseGate")?.classList.add("hidden"); };
  const setBusy = (busy) => {
    const b = $("activateLicenseBtn"); if (!b) return;
    b.disabled = busy; b.textContent = busy ? "Verificando…" : "Ativar Gabarita";
  };
  async function api(path, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      const res = await fetch(path, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body), signal:controller.signal});
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw Object.assign(new Error(data.message || "Não foi possível validar a licença."), {code:data.code || "LICENSE_ERROR"});
      return data;
    } finally { clearTimeout(timeout); }
  }
  function offlineAllowed(record) {
    return !!(record?.installToken && record?.lastValidatedAt && Date.now() - new Date(record.lastValidatedAt).getTime() <= OFFLINE_GRACE_MS);
  }
  async function activate() {
    const email = normalizeEmail($("licenseEmail")?.value);
    const key = String($("licenseKey")?.value || "").trim().toUpperCase();
    if (!email || !email.includes("@")) return setStatus("Digite o e-mail usado na licença.", "error");
    if (key.length < 12) return setStatus("Digite uma chave de licença válida.", "error");
    setBusy(true); setStatus("Validando licença…");
    try {
      const data = await api("/api/license/activate", {email, key, deviceId:getDeviceId()});
      write({email, installToken:data.installToken, deviceId:getDeviceId(), lastValidatedAt:new Date().toISOString(), status:data.license?.status || "ACTIVE"});
      setStatus("Licença ativada.", "ok");
      hideGate();
      window.dispatchEvent(new CustomEvent("gabarita:licensed", {detail:data.license || {email}}));
    } catch (e) {
      const map = {INVALID_LICENSE:"E-mail ou chave incorretos.", BLOCKED:"Esta licença está bloqueada.", REVOKED:"Esta licença foi revogada.", EXPIRED:"Esta licença expirou.", DEVICE_LIMIT:"Esta chave já está ativada em outra instalação. Peça ao administrador para liberar o dispositivo."};
      setStatus(map[e.code] || e.message || "Não foi possível ativar.", "error");
    } finally { setBusy(false); }
  }
  async function checkExisting() {
    const record = read();
    if (!record?.installToken) { showGate(); return false; }
    if (!navigator.onLine) {
      if (offlineAllowed(record)) { hideGate(); return true; }
      showGate(); setStatus("Conecte-se à internet para renovar a validação da licença.", "warn"); return false;
    }
    try {
      const data = await api("/api/license/check", {email:record.email, installToken:record.installToken, deviceId:getDeviceId()});
      write({...record, lastValidatedAt:new Date().toISOString(), status:data.license?.status || "ACTIVE"});
      hideGate(); return true;
    } catch (e) {
      if ((e.name === "AbortError" || e.code === "LICENSE_ERROR") && offlineAllowed(record)) { hideGate(); return true; }
      if (["BLOCKED","REVOKED","EXPIRED","INVALID_LICENSE","DEVICE_LIMIT"].includes(e.code)) clear();
      showGate();
      const map = {BLOCKED:"Esta licença está bloqueada.", REVOKED:"Esta licença foi revogada.", EXPIRED:"Esta licença expirou.", DEVICE_LIMIT:"Esta licença foi vinculada a outro dispositivo."};
      setStatus(map[e.code] || "Não consegui validar a licença. Verifique sua internet.", "error");
      return false;
    }
  }
  async function requireValid() {
    $("activateLicenseBtn")?.addEventListener("click", activate);
    $("licenseKey")?.addEventListener("keydown", e => { if (e.key === "Enter") activate(); });
    return checkExisting();
  }
  window.GabaritaLicense = {requireValid, clear, read};
})();
