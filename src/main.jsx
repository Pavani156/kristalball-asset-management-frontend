import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  PanelLeftClose,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:9090/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {}
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

const get = (path) => api(path);
const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body) });
const put = (path, body) => api(path, { method: "PUT", body: JSON.stringify(body) });
const remove = (path) => api(path, { method: "DELETE" });

const ROLE_LABELS = {
  ADMIN: "Administrator",
  BASE_COMMANDER: "Base Commander",
  LOGISTICS_OFFICER: "Logistics Officer",
};

const PAGE_META = {
  dashboard: ["Command center", "Operational inventory and movement overview", LayoutDashboard],
  purchases: ["Purchases", "Record and review incoming equipment", ShoppingCart],
  transfers: ["Transfers", "Move assets between bases with traceable history", ArrowLeftRight],
  assignments: ["Assignments", "Track assets assigned to personnel", UserCheck],
  expenditures: ["Expenditures", "Record and audit consumed assets", ReceiptIcon],
  audit: ["Audit trail", "Every operational transaction in one place", Activity],
};

function ReceiptIcon(props) {
  return <FileText {...props} />;
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  if (!user) return <Login onLogin={setUser} />;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return <Shell user={user} logout={logout} />;
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await post("/auth/login", { username, password });
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result));
      onLogin(result);
    } catch (e) {
      setError("Unable to sign in. Check the credentials and backend URL.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-orbit orbit-one" />
      <div className="login-orbit orbit-two" />
      <div className="login-grid" />
      <div className="login-layout">
        <section className="login-story">
          <div className="eyebrow"><ShieldCheck size={14} /> SECURE LOGISTICS PLATFORM</div>
          <div className="login-mark"><span>KB</span><i>•</i></div>
          <h1>Kristalball <strong>Asset Command</strong></h1>
          <p>One control surface for inventory, movement, assignments and accountability across every base.</p>
          <div className="story-pills">
            <span><Database size={15} /> MySQL</span>
            <span><ShieldCheck size={15} /> JWT + RBAC</span>
            <span><Activity size={15} /> Audit ready</span>
          </div>
        </section>
        <section className="login-card glass-card">
          <div className="login-card-head">
            <div>
              <span className="kicker">Welcome back</span>
              <h2>Sign in to command center</h2>
            </div>
            <div className="status-dot"><span /> Online</div>
          </div>
          <form onSubmit={submit} className="auth-form">
            <Field label="Username">
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            {error && <div className="alert error">{error}</div>}
            <button className="primary full hero-button" disabled={busy} type="submit">
              {busy ? <Spinner /> : <ShieldCheck size={18} />}
              {busy ? "Authenticating…" : "Enter command center"}
            </button>
          </form>
          <div className="demo-credentials">
            <div className="demo-title"><Sparkles size={14} /> Demo access</div>
            <button onClick={() => { setUsername("admin"); setPassword("admin123"); }}>Admin <span>admin / admin123</span></button>
            <button onClick={() => { setUsername("commander"); setPassword("commander123"); }}>Commander <span>commander / commander123</span></button>
            <button onClick={() => { setUsername("logistics"); setPassword("logistics123"); }}>Logistics <span>logistics / logistics123</span></button>
          </div>
        </section>
      </div>
      <div className="login-footer">Kristalball Take-Home Project <span>•</span> Role-aware operational inventory</div>
    </div>
  );
}

function Shell({ user, logout }) {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = user.role;

  const items = [
    ["dashboard", "Dashboard", LayoutDashboard, true],
    ["purchases", "Purchases", ShoppingCart, true],
    ["transfers", "Transfers", ArrowLeftRight, true],
    ["assignments", "Assignments", UserCheck, role === "ADMIN" || role === "BASE_COMMANDER"],
    ["expenditures", "Expenditures", FileText, role === "ADMIN" || role === "BASE_COMMANDER"],
    ["audit", "Audit Logs", Activity, role === "ADMIN"],
  ].filter((x) => x[3]);

  const meta = PAGE_META[page] || PAGE_META.dashboard;
  const Icon = meta[2];

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-lockup">
            <div className="brand-symbol">KB<span>•</span></div>
            <div><b>Kristalball</b><small>Asset Command</small></div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
        </div>
        <div className="nav-label">Workspace</div>
        <nav>
          {items.map(([id, label, NavIcon]) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => { setPage(id); setSidebarOpen(false); }}>
              <span className="nav-icon"><NavIcon size={18} /></span>
              <span>{label}</span>
              {page === id && <ChevronRight className="nav-arrow" size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="security-card">
          <div className="security-icon"><ShieldCheck size={17} /></div>
          <div><b>Access controlled</b><small>{ROLE_LABELS[role] || role}</small></div>
        </div>
        <button className="logout-button" onClick={logout}><LogOut size={17} /> Sign out</button>
        <div className="sidebar-version">KAM v1.0 • Secure workspace</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb">
            <span>Operations</span><ChevronRight size={14} /><strong>{meta[0]}</strong>
          </div>
          <div className="topbar-user">
            <div className="avatar">{(user.fullName || user.username || "U").slice(0, 1).toUpperCase()}</div>
            <div className="topbar-user-copy"><b>{user.fullName || user.username}</b><span>{ROLE_LABELS[role] || role}{user.baseName ? ` • ${user.baseName}` : ""}</span></div>
          </div>
        </header>
        <div className="page-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow muted"><Icon size={14} /> {meta[0]}</div>
              <h1>{meta[1]}</h1>
              <p>{meta[1] === "Command center" ? "A live view of balances, movement and accountability." : meta[1]}</p>
            </div>
            <div className="heading-status"><span className="pulse" /> Secure session</div>
          </div>

          {page === "dashboard" && <Dashboard user={user} />}
          {page === "purchases" && <TransactionPage title="Purchases" endpoint="purchases" type="purchase" user={user} />}
          {page === "transfers" && <TransactionPage title="Transfers" endpoint="transfers" type="transfer" user={user} />}
          {page === "assignments" && <TransactionPage title="Assignments" endpoint="assignments" type="assignment" user={user} />}
          {page === "expenditures" && <TransactionPage title="Expenditures" endpoint="expenditures" type="expenditure" user={user} />}
          {page === "audit" && <AuditLogs />}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ user }) {
  const { bases, categories } = useLookups();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    baseId: user.role === "BASE_COMMANDER" ? String(user.baseId || "") : "",
    categoryId: "",
  });
  const [data, setData] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const queryString = useMemo(() => buildQuery(filters), [filters]);

  async function load() {
    setLoading(true);
    setError("");
    try { setData(await get(`/dashboard${queryString ? `?${queryString}` : ""}`)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [queryString]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const maxMove = Math.max(data?.purchases || 0, data?.transferIn || 0, data?.transferOut || 0, 1);

  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <div className="hero-panel-copy">
          <span className="hero-tag"><Sparkles size={14} /> Live operational snapshot</span>
          <h2>Inventory under control.</h2>
          <p>Track opening and closing balances, net movement, assignments and expenditure with base-level access controls.</p>
        </div>
        <div className="hero-orbit"><Boxes size={34} /><span>Multi-base<br />inventory</span></div>
      </section>

      <section className="filter-panel">
        <div className="filter-title"><div><b>Dashboard filters</b><span>Choose the reporting window and equipment scope.</span></div><button className="ghost-button" onClick={() => setFilters({ startDate: "", endDate: "", baseId: user.role === "BASE_COMMANDER" ? String(user.baseId || "") : "", categoryId: "" })}><RefreshCw size={15} /> Reset</button></div>
        <div className="filter-grid">
          <Field label="From"><input type="date" value={filters.startDate} onChange={(e) => setFilter("startDate", e.target.value)} /></Field>
          <Field label="To"><input type="date" value={filters.endDate} onChange={(e) => setFilter("endDate", e.target.value)} /></Field>
          <Field label="Base"><select disabled={user.role === "BASE_COMMANDER"} value={filters.baseId} onChange={(e) => setFilter("baseId", e.target.value)}><option value="">All bases</option>{bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          <Field label="Equipment type"><select value={filters.categoryId} onChange={(e) => setFilter("categoryId", e.target.value)}><option value="">All equipment</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <button className="primary filter-apply" onClick={load} disabled={loading}>{loading ? <Spinner /> : <RefreshCw size={16} />} Apply filters</button>
        </div>
      </section>

      {error && <div className="alert error full-span">{error}</div>}

      {data && <>
        <section className="metric-grid full-span">
          <Metric label="Opening balance" value={data.openingBalance} icon={Boxes} tone="blue" />
          <Metric label="Closing balance" value={data.closingBalance} icon={CheckCircle2} tone="green" />
          <Metric label="Net movement" value={data.netMovement} icon={ArrowLeftRight} tone="purple" clickable onClick={() => setDetails(data.netMovementDetails)} hint="Open movement breakdown" />
          <Metric label="Assigned" value={data.assigned} icon={UserCheck} tone="amber" />
          <Metric label="Expended" value={data.expended} icon={ArrowUpFromLine} tone="red" />
        </section>

        <section className="panel movement-panel">
          <div className="panel-heading"><div><span className="kicker">Movement intelligence</span><h3>Net movement breakdown</h3></div><button className="text-button" onClick={() => setDetails(data.netMovementDetails)}>View details <ChevronRight size={15} /></button></div>
          <div className="movement-chart">
            <MovementBar label="Purchases" value={data.purchases} max={maxMove} icon={PackagePlus} tone="blue" />
            <MovementBar label="Transfer in" value={data.transferIn} max={maxMove} icon={ArrowDownToLine} tone="green" />
            <MovementBar label="Transfer out" value={data.transferOut} max={maxMove} icon={ArrowUpFromLine} tone="orange" negative />
          </div>
          <div className="formula"><span>Net movement</span><b>{data.purchases}</b><i>+</i><b>{data.transferIn}</b><i>−</i><b>{data.transferOut}</b><span>=</span><strong>{data.netMovement}</strong></div>
        </section>

        <section className="side-panel panel">
          <div className="panel-heading"><div><span className="kicker">Operational health</span><h3>Balance picture</h3></div></div>
          <div className="health-ring"><div><strong>{data.closingBalance}</strong><span>closing units</span></div></div>
          <div className="health-list"><div><span>Opening</span><b>{data.openingBalance}</b></div><div><span>Movement</span><b className={data.netMovement >= 0 ? "positive" : "negative"}>{data.netMovement >= 0 ? "+" : ""}{data.netMovement}</b></div><div><span>Assigned + expended</span><b>{(data.assigned || 0) + (data.expended || 0)}</b></div></div>
        </section>
      </>}
    </div>
  );
}

function TransactionPage({ title, endpoint, type, user }) {
  const { bases, categories, assets } = useLookups();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(defaultFilters(type, user));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const queryString = useMemo(() => buildQuery(filters), [filters]);

  async function load() {
    setLoading(true); setError("");
    try { setRows(await get(`/${endpoint}${queryString ? `?${queryString}` : ""}`)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [endpoint, queryString]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toast]);

  const visible = rows.filter((row) => rowSearch(row, type).includes(search.toLowerCase()));
  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  async function save(form, editing) {
    const body = toPayload(type, form, user);
    if (editing) await put(`/${endpoint}/${editing.id}`, body); else await post(`/${endpoint}`, body);
    setModal(null); setToast(editing ? `${title.slice(0, -1)} updated successfully.` : `${title.slice(0, -1)} created successfully.`); load();
  }

  async function deleteRow(row) {
    if (!window.confirm(`Delete this ${title.slice(0, -1).toLowerCase()} record?`)) return;
    try { await remove(`/${endpoint}/${row.id}`); setToast("Record deleted."); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="transaction-page">
      <section className="section-banner">
        <div><div className="banner-icon"><PageIcon type={type} /></div><div><span className="kicker">Operational records</span><h2>{title} ledger</h2><p>{transactionDescription(type)}</p></div></div>
        <button className="primary" onClick={() => setModal({ type: "create", row: null })}><Plus size={17} /> New {title.slice(0, -1)}</button>
      </section>
      <section className="toolbar-card">
        <div className="toolbar-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} /></div>
        <div className="toolbar-filters">
          {type === "purchase" && <><input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /><input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /><Select value={filters.baseId} onChange={(v) => setFilters({ ...filters, baseId: v })} options={bases} placeholder="All bases" disabled={user.role === "BASE_COMMANDER"} /><Select value={filters.categoryId} onChange={(v) => setFilters({ ...filters, categoryId: v })} options={categories} placeholder="All equipment" /></>}
          {type === "transfer" && <><Select value={filters.fromBaseId} onChange={(v) => setFilters({ ...filters, fromBaseId: v })} options={bases} placeholder="From any base" /><Select value={filters.toBaseId} onChange={(v) => setFilters({ ...filters, toBaseId: v })} options={bases} placeholder="To any base" /><Select value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={[{ id: "COMPLETED", name: "Completed" }, { id: "PENDING", name: "Pending" }]} placeholder="Any status" /></>}
          {(type === "assignment" || type === "expenditure") && <><Select value={filters.baseId} onChange={(v) => setFilters({ ...filters, baseId: v })} options={bases} placeholder="All bases" disabled={user.role === "BASE_COMMANDER"} />{type === "assignment" && <Select value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={[{ id: "ACTIVE", name: "Active" }, { id: "RETURNED", name: "Returned" }]} placeholder="Any status" />}</>}
          <button className="icon-button" title="Refresh" onClick={load}><RefreshCw size={16} className={loading ? "spin" : ""} /></button>
        </div>
      </section>
      {error && <div className="alert error">{error}</div>}
      <section className="table-card">
        <div className="table-top"><div><b>{visible.length} records</b><span>Showing records visible to your role</span></div><div className="role-chip"><ShieldCheck size={14} /> {ROLE_LABELS[user.role]}</div></div>
        <div className="table-scroll"><table><thead><tr>{tableHeaders(type).map((h) => <th key={h}>{h}</th>)}<th>Actions</th></tr></thead><tbody>
          {visible.map((row) => <tr key={row.id}>{renderCells(type, row)}<td><div className="row-actions"><button className="table-action" onClick={() => setModal({ type: "edit", row })}><FileText size={15} /> Edit</button><button className="table-action danger" onClick={() => deleteRow(row)}><Trash2 size={15} /></button></div></td></tr>)}
          {!loading && !visible.length && <tr><td colSpan={tableHeaders(type).length + 1}><EmptyState title={`No ${title.toLowerCase()} found`} text="Try clearing filters or create the first record." /></td></tr>}
          {loading && <tr><td colSpan={tableHeaders(type).length + 1}><LoadingRows /></td></tr>}
        </tbody></table></div>
      </section>
      {modal && <TransactionModal type={type} user={user} bases={bases} categories={categories} assets={assets} initial={modal.row} onClose={() => setModal(null)} onSave={save} />}
      {toast && <div className="toast"><CheckCircle2 size={18} /> {toast}</div>}
    </div>
  );
}

function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { get("/audit-logs").then(setRows).catch((e) => setError(e.message)); }, []);
  const visible = rows.filter((r) => `${r.action} ${r.entityType} ${r.username} ${r.details}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="transaction-page">
    <section className="section-banner"><div><div className="banner-icon audit"><Activity size={23} /></div><div><span className="kicker">Accountability</span><h2>Audit trail</h2><p>Timestamped records of purchase, transfer, assignment and expenditure activity.</p></div></div></section>
    <section className="toolbar-card"><div className="toolbar-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audit events…" /></div><div className="audit-count"><Clock3 size={15} /> {visible.length} events</div></section>
    {error && <div className="alert error">{error}</div>}
    <section className="table-card"><div className="table-scroll"><table><thead><tr><th>Timestamp</th><th>Action</th><th>Entity</th><th>User</th><th>Details</th></tr></thead><tbody>{visible.map((r) => <tr key={r.id}><td>{formatDateTime(r.timestamp)}</td><td><span className={`event-badge ${String(r.action || "").toLowerCase()}`}>{r.action}</span></td><td>{r.entityType} <span className="muted-text">#{r.entityId}</span></td><td><b>{r.username}</b></td><td className="details-cell">{r.details || "—"}</td></tr>)}{!visible.length && <tr><td colSpan="5"><EmptyState title="No audit events" text="Transactions will appear here after activity is recorded." /></td></tr>}</tbody></table></div></section>
  </div>;
}

function TransactionModal({ type, user, bases, categories, assets, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => initialForm(type, initial, user));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const edit = Boolean(initial);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const availableAssets = useMemo(() => {
    if (!form.baseId) return assets;
    return assets.filter((a) => String(a.base?.id) === String(form.baseId));
  }, [assets, form.baseId]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { await onSave(form, initial); } catch (err) { setError(err.message || "Unable to save record."); } finally { setBusy(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-card large-modal">
      <div className="modal-head"><div><span className="kicker">{edit ? "Update record" : "New transaction"}</span><h3>{edit ? "Edit " : "Create "}{titleForType(type)}</h3></div><button className="close-button" onClick={onClose}><X size={18} /></button></div>
      <form onSubmit={submit} className="modal-form">
        {type === "purchase" && <>
          <Field label="Purchase date" required><input required type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} /></Field>
          <Field label="Equipment type" required><Select value={form.categoryId} onChange={(v) => set("categoryId", v)} options={categories} placeholder="Select equipment" required /></Field>
          <Field label="Base" required><Select value={form.baseId} onChange={(v) => set("baseId", v)} options={bases} placeholder="Select base" required disabled={user.role === "BASE_COMMANDER"} /></Field>
          <Field label="Quantity" required><input required min="1" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
          <Field label="Supplier"><input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Optional supplier" /></Field>
        </>}
        {type === "transfer" && <>
          <Field label="Asset / equipment record" required><Select value={form.assetId} onChange={(v) => { set("assetId", v); const a = assets.find((x) => String(x.id) === String(v)); if (a) set("fromBaseId", String(a.base?.id || "")); }} options={assets} optionLabel={(a) => `${a.name} • ${a.serialNumber || "No serial"} • ${a.base?.name || "Unassigned"}`} placeholder="Select asset" required /></Field>
          <Field label="Source base" required><Select value={form.fromBaseId} onChange={(v) => set("fromBaseId", v)} options={bases} placeholder="Source base" required disabled={user.role === "BASE_COMMANDER"} /></Field>
          <Field label="Destination base" required><Select value={form.toBaseId} onChange={(v) => set("toBaseId", v)} options={bases.filter((b) => String(b.id) !== String(form.fromBaseId))} placeholder="Destination base" required /></Field>
          <Field label="Transfer timestamp"><input type="datetime-local" value={form.transferDate} onChange={(e) => set("transferDate", e.target.value)} /></Field>
          <Field label="Quantity" required><input required min="1" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)}><option>COMPLETED</option><option>PENDING</option></select></Field>
        </>}
        {type === "assignment" && <>
          <Field label="Base" required><Select value={form.baseId} onChange={(v) => set("baseId", v)} options={bases} placeholder="Select base" required disabled={user.role === "BASE_COMMANDER"} /></Field>
          <Field label="Asset" required><Select value={form.assetId} onChange={(v) => set("assetId", v)} options={availableAssets} optionLabel={(a) => `${a.name} • ${a.serialNumber || "No serial"}`} placeholder="Select asset" required /></Field>
          <Field label="Personnel name" required><input required value={form.personnelName} onChange={(e) => set("personnelName", e.target.value)} placeholder="e.g. Captain Arun" /></Field>
          <Field label="Quantity" required><input required min="1" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
          <Field label="Assigned date"><input type="datetime-local" value={form.assignedDate} onChange={(e) => set("assignedDate", e.target.value)} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)}><option>ACTIVE</option><option>RETURNED</option></select></Field>
        </>}
        {type === "expenditure" && <>
          <Field label="Base" required><Select value={form.baseId} onChange={(v) => set("baseId", v)} options={bases} placeholder="Select base" required disabled={user.role === "BASE_COMMANDER"} /></Field>
          <Field label="Asset" required><Select value={form.assetId} onChange={(v) => { set("assetId", v); const a = assets.find((x) => String(x.id) === String(v)); if (a) { set("baseId", String(a.base?.id || form.baseId)); set("categoryId", String(a.category?.id || "")); } }} options={availableAssets} optionLabel={(a) => `${a.name} • ${a.serialNumber || "No serial"}`} placeholder="Select asset" required /></Field>
          <Field label="Equipment type" required><Select value={form.categoryId} onChange={(v) => set("categoryId", v)} options={categories} placeholder="Equipment type" required /></Field>
          <Field label="Quantity" required><input required min="1" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
          <Field label="Expenditure date" required><input required type="date" value={form.expenditureDate} onChange={(e) => set("expenditureDate", e.target.value)} /></Field>
          <Field label="Expended timestamp"><input type="datetime-local" value={form.expendedDate} onChange={(e) => set("expendedDate", e.target.value)} /></Field>
          <Field label="Reason"><input value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Reason for expenditure" /></Field>
          <Field label="Description"><textarea rows="3" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional notes" /></Field>
        </>}
        {error && <div className="alert error">{error}</div>}
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? <Spinner /> : <CheckCircle2 size={17} />}{busy ? "Saving…" : edit ? "Save changes" : "Create record"}</button></div>
      </form>
    </div>
  </div>;
}

function Field({ label, required, children }) { return <label className="field"><span>{label}{required && <i> *</i>}</span>{children}</label>; }
function Select({ value, onChange, options, placeholder, disabled, required, optionLabel }) { return <select value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={required}><option value="">{placeholder || "Select…"}</option>{options.map((o) => <option key={o.id} value={o.id}>{optionLabel ? optionLabel(o) : o.name}</option>)}</select>; }
function Spinner() { return <span className="spinner" />; }

function Metric({ label, value, icon: Icon, tone, clickable, onClick, hint }) {
  return <button className={`metric-card ${tone} ${clickable ? "clickable" : ""}`} onClick={onClick} disabled={!clickable}>
    <div className="metric-icon"><Icon size={19} /></div><span>{label}</span><strong>{value ?? 0}</strong>{hint && <small>{hint} <ChevronRight size={12} /></small>}
  </button>;
}
function MovementBar({ label, value, max, icon: Icon, tone, negative }) { const width = Math.max(4, Math.round((value / max) * 100)); return <div className="movement-row"><div className="movement-label"><span className={`mini-icon ${tone}`}><Icon size={15} /></span><b>{label}</b><strong>{negative ? "−" : ""}{value}</strong></div><div className="bar-track"><span className={`bar-fill ${tone}`} style={{ width: `${width}%` }} /></div></div>; }
function EmptyState({ title, text }) { return <div className="empty-state"><div><Boxes size={22} /></div><b>{title}</b><span>{text}</span></div>; }
function LoadingRows() { return <div className="loading-state"><Spinner /> Loading records…</div>; }
function PageIcon({ type }) { const props = { size: 23 }; if (type === "purchase") return <ShoppingCart {...props} />; if (type === "transfer") return <Truck {...props} />; if (type === "assignment") return <UserCheck {...props} />; return <ArrowUpFromLine {...props} />; }

function useLookups() {
  const [data, setData] = useState({ bases: [], categories: [], assets: [] });
  useEffect(() => { Promise.all([get("/bases"), get("/categories"), get("/assets")]).then(([bases, categories, assets]) => setData({ bases, categories, assets })).catch(() => {}); }, []);
  return data;
}

function defaultFilters(type, user) {
  const base = user.role === "BASE_COMMANDER" ? String(user.baseId || "") : "";
  if (type === "purchase") return { startDate: "", endDate: "", baseId: base, categoryId: "" };
  if (type === "transfer") return { fromBaseId: "", toBaseId: "", status: "" };
  return { baseId: base, status: "" };
}
function initialForm(type, row, user) {
  const now = new Date(); const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); const today = local.slice(0, 10); const base = user.role === "BASE_COMMANDER" ? String(user.baseId || "") : "";
  if (!row) {
    if (type === "purchase") return { purchaseDate: today, quantity: 1, supplier: "", categoryId: "", baseId: base };
    if (type === "transfer") return { transferDate: local, quantity: 1, status: "COMPLETED", assetId: "", fromBaseId: base, toBaseId: "" };
    if (type === "assignment") return { personnelName: "", quantity: 1, assignedDate: local, status: "ACTIVE", assetId: "", baseId: base };
    return { quantity: 1, reason: "", expenditureDate: today, expendedDate: local, description: "", assetId: "", baseId: base, categoryId: "" };
  }
  if (type === "purchase") return { purchaseDate: row.purchaseDate || today, quantity: row.quantity || 1, supplier: row.supplier || "", categoryId: row.category?.id || "", baseId: row.base?.id || base };
  if (type === "transfer") return { transferDate: toInputDateTime(row.transferDate), quantity: row.quantity || 1, status: row.status || "COMPLETED", assetId: row.asset?.id || "", fromBaseId: row.fromBase?.id || base, toBaseId: row.toBase?.id || "" };
  if (type === "assignment") return { personnelName: row.personnelName || "", quantity: row.quantity || 1, assignedDate: toInputDateTime(row.assignedDate), status: row.status || "ACTIVE", assetId: row.asset?.id || "", baseId: row.base?.id || base };
  return { quantity: row.quantity || 1, reason: row.reason || "", expenditureDate: row.expenditureDate || today, expendedDate: toInputDateTime(row.expendedDate), description: row.description || "", assetId: row.asset?.id || "", baseId: row.base?.id || base, categoryId: row.category?.id || row.asset?.category?.id || "" };
}
function toPayload(type, form, user) {
  const body = { ...form };
  if (type === "purchase") { body.quantity = Number(form.quantity); body.category = { id: Number(form.categoryId) }; body.base = { id: Number(user.role === "BASE_COMMANDER" ? user.baseId : form.baseId) }; delete body.categoryId; delete body.baseId; }
  if (type === "transfer") { body.quantity = Number(form.quantity); body.asset = { id: Number(form.assetId) }; body.fromBase = { id: Number(user.role === "BASE_COMMANDER" ? user.baseId : form.fromBaseId) }; body.toBase = { id: Number(form.toBaseId) }; delete body.assetId; delete body.fromBaseId; delete body.toBaseId; }
  if (type === "assignment") { body.quantity = Number(form.quantity); body.asset = { id: Number(form.assetId) }; body.base = { id: Number(user.role === "BASE_COMMANDER" ? user.baseId : form.baseId) }; delete body.assetId; delete body.baseId; }
  if (type === "expenditure") { body.quantity = Number(form.quantity); body.asset = { id: Number(form.assetId) }; body.base = { id: Number(user.role === "BASE_COMMANDER" ? user.baseId : form.baseId) }; body.category = { id: Number(form.categoryId) }; delete body.assetId; delete body.baseId; delete body.categoryId; }
  return body;
}
function buildQuery(obj) { return Object.entries(obj).filter(([, v]) => v !== "" && v != null).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&"); }
function titleForType(type) { return type.charAt(0).toUpperCase() + type.slice(1); }
function transactionDescription(type) { return { purchase: "Capture purchased quantities by equipment type and base, with date-filterable history.", transfer: "Track completed and pending movements between bases with timestamped history.", assignment: "Assign assets to personnel and retain the operational record for accountability.", expenditure: "Record consumed assets, reason, date and supporting notes for traceability." }[type]; }
function tableHeaders(type) { return { purchase: ["Date", "Equipment", "Base", "Quantity", "Supplier"], transfer: ["Timestamp", "Asset", "From", "To", "Qty", "Status"], assignment: ["Assigned", "Personnel", "Asset", "Base", "Qty", "Status"], expenditure: ["Date", "Equipment", "Asset", "Base", "Qty", "Reason"] }[type]; }
function renderCells(type, r) {
  if (type === "purchase") return <><td>{r.purchaseDate || "—"}</td><td><strong>{r.category?.name || "—"}</strong></td><td>{r.base?.name || "—"}</td><td><span className="qty-badge">{r.quantity}</span></td><td>{r.supplier || "—"}</td></>;
  if (type === "transfer") return <><td>{formatDateTime(r.transferDate)}</td><td><strong>{r.asset?.name || "—"}</strong><span className="subcell">{r.asset?.serialNumber || ""}</span></td><td>{r.fromBase?.name || "—"}</td><td>{r.toBase?.name || "—"}</td><td><span className="qty-badge">{r.quantity}</span></td><td><span className={`status-badge ${String(r.status || "").toLowerCase()}`}>{r.status || "COMPLETED"}</span></td></>;
  if (type === "assignment") return <><td>{formatDateTime(r.assignedDate)}</td><td><strong>{r.personnelName || "—"}</strong></td><td>{r.asset?.name || "—"}<span className="subcell">{r.asset?.serialNumber || ""}</span></td><td>{r.base?.name || "—"}</td><td><span className="qty-badge">{r.quantity}</span></td><td><span className={`status-badge ${String(r.status || "").toLowerCase()}`}>{r.status || "ACTIVE"}</span></td></>;
  return <><td>{r.expenditureDate || "—"}</td><td>{r.category?.name || r.asset?.category?.name || "—"}</td><td><strong>{r.asset?.name || "—"}</strong><span className="subcell">{r.asset?.serialNumber || ""}</span></td><td>{r.base?.name || "—"}</td><td><span className="qty-badge">{r.quantity}</span></td><td>{r.reason || "—"}</td></>;
}
function rowSearch(r, type) { if (type === "purchase") return `${r.category?.name} ${r.base?.name} ${r.supplier} ${r.quantity}`.toLowerCase(); if (type === "transfer") return `${r.asset?.name} ${r.asset?.serialNumber} ${r.fromBase?.name} ${r.toBase?.name} ${r.status}`.toLowerCase(); if (type === "assignment") return `${r.personnelName} ${r.asset?.name} ${r.asset?.serialNumber} ${r.base?.name} ${r.status}`.toLowerCase(); return `${r.asset?.name} ${r.asset?.serialNumber} ${r.category?.name} ${r.base?.name} ${r.reason}`.toLowerCase(); }
function formatDateTime(value) { if (!value) return "—"; try { return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); } catch { return value; } }
function toInputDateTime(value) { if (!value) return ""; return String(value).slice(0, 16); }

createRoot(document.getElementById("root")).render(<App />);
