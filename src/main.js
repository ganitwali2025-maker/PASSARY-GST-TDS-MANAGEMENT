import { createIcons, LayoutDashboard, House, BarChart3, CalendarDays, Users, WalletCards, UserCog, Settings, LogOut, ArrowLeft, Menu } from 'lucide';

/* ============================================================
   STATE
   ============================================================ */
const STORAGE_KEY = 'passary-refractories-tax-state-v2';

const GST_MODULES = [
 {id:'gstr1', name:'GSTR-1 Working', desc:'Outward supply return preparation, invoice-level working.', icon:'📤', color:'blue'},
 {id:'gstr3b', name:'GSTR-3B Working', desc:'Summary return: tax liability and ITC set-off working.', icon:'📥', color:'emerald'},
 {id:'recon2b', name:'Books vs GSTR-2B Reconciliation', desc:'Match purchase register against downloaded 2B data.', icon:'🔄', color:'purple'},
 {id:'current2b', name:'Current Month GSTR-2B', desc:'The current period auto-drafted ITC statement.', icon:'📅', color:'teal'},
 {id:'all2b', name:'All Months GSTR-2B Repository', desc:'Archive of every downloaded 2B statement.', icon:'🗄️', color:'orange'},
 {id:'unclaimedItc', name:'Unclaimed ITC Register', desc:'Eligible credit not yet claimed in returns.', icon:'📌', color:'blue'},
 {id:'oldItc', name:'Old ITC Register', desc:'Legacy credit carried forward from earlier periods.', icon:'📦', color:'purple'},
 {id:'rcm', name:'Reverse Charge Mechanism (RCM)', desc:'Tax payable by recipient under reverse charge.', icon:'🔁', color:'emerald'},
 {id:'finalItc', name:'Final ITC Claim Dashboard', desc:'Consolidated credit approved for claim.', icon:'✅', color:'teal'},
 {id:'notes', name:'GST Notes / Working Papers', desc:'Free-form notes and supporting workings.', icon:'📝', color:'orange'}
];
const TDS_MODULES = [
 {id:'rent', name:'Rent (Section 194-I)', desc:'TDS on rent payments to landlords.', icon:'🏢', color:'blue', section:'194-I'},
 {id:'purchase', name:'Purchase (Applicable TDS)', desc:'TDS on purchase of goods, incl. 194Q.', icon:'🛒', color:'emerald', section:'194Q'},
 {id:'contractor', name:'Contractors (194C)', desc:'TDS on payments to contractors / sub-contractors.', icon:'👷', color:'purple', section:'194C'},
 {id:'professional', name:'Professional Fees (194J)', desc:'TDS on professional and technical fees.', icon:'💼', color:'teal', section:'194J'},
 {id:'commission', name:'Commission & Brokerage', desc:'TDS under section 194H.', icon:'🤝', color:'orange', section:'194H'},
 {id:'salary', name:'Salary TDS', desc:'TDS on salary under section 192.', icon:'🧑‍💼', color:'blue', section:'192'},
 {id:'tcs', name:'TCS Working', desc:'Tax collected at source on applicable sales.', icon:'🧾', color:'purple', section:'206C'},
 {id:'returnChallan', name:'TDS Return & Challan Dashboard', desc:'Challan payments and quarterly return status.', icon:'📮', color:'emerald', section:'—'}
];

const NAV_ITEMS = [
  {id:'dashboard', icon:'layout-dashboard', label:'Dashboard'},
  {id:'home', icon:'house', label:'Home'},
  {id:'reports', icon:'bar-chart-3', label:'Reports'},
  {id:'calendar', icon:'calendar-days', label:'Compliance Calendar'},
  {id:'team', icon:'users', label:'Account Team'},
  {id:'approval', icon:'wallet-cards', label:'Approval Payment'},
  {id:'users', icon:'user-cog', label:'User Management'},
  {id:'settings', icon:'settings', label:'Settings'}
];

let state = null;
let view = { screen:'home', companyId:null, moduleId:null, category:null };

const MODULE_ACCENTS = {
  blue: 'linear-gradient(135deg,#2563EB,#6D8BFF)',
  emerald: 'linear-gradient(135deg,#10B981,#6EE7B7)',
  purple: 'linear-gradient(135deg,#8B5CF6,#C4B5FD)',
  teal: 'linear-gradient(135deg,#14B8A6,#5EEAD4)',
  orange: 'linear-gradient(135deg,#F97316,#FDBA74)'
};
const COMPANY_SEED = [
  {shortName:'PMMPL', fullName:'Passary Minerals Madhya Private Limited', icon:'🏭', accent:'linear-gradient(135deg,#2563EB,#6D8BFF)'},
  {shortName:'RMIPL', fullName:'Refrasynth Minerals India Private Limited', icon:'🔥', accent:'linear-gradient(135deg,#F97316,#FDBA74)'},
  {shortName:'PMPL', fullName:'Passary Minerals Private Limited', icon:'📦', accent:'linear-gradient(135deg,#8B5CF6,#C4B5FD)'},
  {shortName:'PURABH', fullName:'Passary Minerals Purabh Private Limited', icon:'☀️', accent:'linear-gradient(135deg,#F59E0B,#FDE68A)'},
  {shortName:'APPLICATION', fullName:'Refratech Application Services Private Limited', icon:'⚙️', accent:'linear-gradient(135deg,#14B8A6,#5EEAD4)'},
  {shortName:'PASMIN', fullName:'Pasmin Engineering LLP', icon:'🏢', accent:'linear-gradient(135deg,#10B981,#6EE7B7)'}
];
function seedCompanies(){
  return COMPANY_SEED.map((s,i)=>({
    id:'co'+(i+1),
    shortName:s.shortName,
    fullName:s.fullName,
    icon:s.icon,
    accent:s.accent,
    gstin:'',
    pan:'',
    status:'Active',
    fy:'2026-27',
    lastUpdated:new Date().toISOString().slice(0,10),
    gst:{}, tds:{}
  }));
}
function defaultState(){
  return { activeCompanyId:null, companies:seedCompanies(), users:[
    {id:'u1', name:'Finance Team', role:'Admin', email:'admin@company.com'}
  ], settings:{ gstnConnected:false, tracesConnected:false, autoReminders:true } };
}
async function loadState(){
  try{
    const res = await fetch('/api/storage/'+encodeURIComponent(STORAGE_KEY));
    if(res.status===404){ state = defaultState(); return; }
    if(!res.ok) throw new Error('load failed');
    const data = await res.json();
    state = data && data.value ? JSON.parse(data.value) : defaultState();
  }catch(e){ console.error('load failed, using defaults', e); state = defaultState(); }
}
async function saveState(){
  try{
    await fetch('/api/storage/'+encodeURIComponent(STORAGE_KEY), {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ value: JSON.stringify(state) })
    });
  }catch(e){ console.error('save failed', e); }
}

function getCompany(id){ return state.companies.find(c=>c.id===id); }
function getModState(company, category, moduleId){
  if(!company[category][moduleId]){
    company[category][moduleId] = { entries:[], remarks:'', approval:'Draft', history:[] };
  }
  return company[category][moduleId];
}
function addHistory(modState, text){
  modState.history.unshift({ts:new Date().toLocaleString('en-IN'), text});
  if(modState.history.length>50) modState.history.pop();
}
function uid(){ return 'x'+Math.random().toString(36).slice(2,10); }
function esc(s){ const d=document.createElement('div'); d.innerText = s==null?'':s; return d.innerHTML; }
function fmt(n){ if(isNaN(n)) n=0; return '₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2, maximumFractionDigits:2}); }

function getFY(dateStr){
  if(!dateStr) return null;
  const d = new Date(dateStr);
  const y = d.getFullYear(), m = d.getMonth()+1;
  const startY = m>=4 ? y : y-1;
  return startY+'-'+String((startY+1)%100).padStart(2,'0');
}
function getQuarter(dateStr){
  if(!dateStr) return null;
  const m = new Date(dateStr).getMonth()+1;
  if(m>=4 && m<=6) return 'Q1'; if(m>=7 && m<=9) return 'Q2';
  if(m>=10 && m<=12) return 'Q3'; return 'Q4';
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ============================================================
   RENDER: SHELL
   ============================================================ */
function render(){
  renderNav();
  renderBadge();
  renderBreadcrumb();
  renderTopbarRight();
  const main = document.getElementById('main');
  main.innerHTML = '';
  if(view.screen==='home') renderHome(main);
  else if(view.screen==='workspace') renderWorkspace(main);
  else if(view.screen==='gstModules') renderModuleGrid(main,'gst');
  else if(view.screen==='tdsModules') renderModuleGrid(main,'tds');
  else if(view.screen==='detail') renderDetail(main, view.category);
  else if(view.screen==='reports') renderReports(main);
  else if(view.screen==='calendar') renderCalendar(main);
  else if(view.screen==='users') renderUsers(main);
  else if(view.screen==='settings') renderSettings(main);
  else if(view.screen==='dashboard') renderDashboard(main);
  else if(view.screen==='team') renderAccountTeam(main);
  else if(view.screen==='approval') renderApprovalPayment(main);
  else if(view.screen==='loggedOut') renderLoggedOut(main);
}

function renderTopbarRight(){
  const box = document.getElementById('topbarRight');
  const insideCompany = view.companyId && ['workspace','gstModules','tdsModules','detail'].includes(view.screen);
  if(insideCompany){
    box.innerHTML = `<button class="topbar-back-btn" id="topbarBackBtn"><i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Back</button>`;
    document.getElementById('topbarBackBtn').onclick = ()=>{
      if(view.screen==='workspace'){ view={screen:'home',companyId:null,moduleId:null,category:null}; }
      else if(view.screen==='gstModules' || view.screen==='tdsModules'){ view={screen:'workspace', companyId:view.companyId, moduleId:null, category:null}; }
      else if(view.screen==='detail'){ view={screen: view.category==='gst'?'gstModules':'tdsModules', companyId:view.companyId, moduleId:null, category:view.category}; }
      render();
    };
  } else {
    box.innerHTML = `<div class="user-chip" id="logoutChip" title="Click to logout"><div class="av">FT</div><span>Finance Team</span></div>`;
    document.getElementById('logoutChip').onclick = ()=>{ view={screen:'loggedOut'}; render(); };
  }
}

function renderNav(){
  const nav = document.getElementById('mainNav');
  nav.innerHTML = '';
  NAV_ITEMS.forEach(item=>{
    const active = (item.id==='home' && view.screen==='home') ||
      (item.id==='gstEntry' && ['workspace','gstModules'].includes(view.screen)===false && view.screen==='detail' && view.category==='gst') ||
      (item.id==='gstEntry' && view.screen==='gstModules') ||
      (item.id==='tdsEntry' && view.screen==='tdsModules') ||
      (item.id==='tdsEntry' && view.screen==='detail' && view.category==='tds') ||
      (item.id===view.screen);
    const div = document.createElement('div');
    div.className = 'snav-item'+(active?' active':'');
    div.innerHTML = `<span class="ic"><i data-lucide="${item.icon}"></i></span><span>${item.label}</span>`;
    div.onclick = ()=>{
      if(item.id==='home' || item.id==='dashboard' || item.id==='team' || item.id==='approval'){ view = {screen:item.id,companyId:null,moduleId:null,category:null}; }
      else if(item.id==='gstEntry' || item.id==='tdsEntry'){
        const cid = state.activeCompanyId || state.companies[0].id;
        state.activeCompanyId = cid;
        view = {screen: item.id==='gstEntry'?'gstModules':'tdsModules', companyId:cid, moduleId:null, category:item.id==='gstEntry'?'gst':'tds'};
      } else { view = {screen:item.id, companyId:view.companyId, moduleId:null, category:null}; }
      render();
    };
    nav.appendChild(div);
  });
  nav.insertAdjacentHTML('beforeend', `
    <div class="snav-divider"></div>
    <div class="snav-item" id="logoutNav"><span class="ic"><i data-lucide="log-out"></i></span><span>Logout</span></div>
  `);
  document.getElementById('logoutNav').onclick = ()=>{ view={screen:'loggedOut'}; render(); };

  createIcons({
    icons: { LayoutDashboard, House, BarChart3, CalendarDays, Users, WalletCards, UserCog, Settings, LogOut, ArrowLeft, Menu }
  });
}

function renderBadge(){
  const box = document.getElementById('acBadge');
  const c = state.activeCompanyId ? getCompany(state.activeCompanyId) : null;
  if(!c){ box.innerHTML=''; return; }
  box.innerHTML = `
    <div class="lbl">Active Company</div>
    <div class="acb-card" id="acbCard">
      <div class="acb-avatar" style="background:${c.accent||'var(--blue-soft)'}; color:#fff; font-size:15px;">${c.icon||esc(c.shortName.slice(0,2))}</div>
      <div class="t"><div class="n">${esc(c.fullName)}</div><div class="s">${esc(c.fy)}</div></div>
    </div>`;
  document.getElementById('acbCard').onclick = ()=>{ view={screen:'workspace', companyId:c.id, moduleId:null, category:null}; render(); };
}

function renderBreadcrumb(){
  const bc = document.getElementById('breadcrumb');
  const parts = [];
  parts.push(`<span class="seg home crumbtn" data-go="home">Home</span>`);
  const sep = `<span class="sep">›</span>`;
  if(view.companyId){
    const c = getCompany(view.companyId);
    const isCompanyPage = view.screen === 'workspace';
    parts.push(`${sep}<span class="seg crumbtn ${isCompanyPage?'company-title':'current'}" data-go="workspace">${esc(c ? c.fullName : '')}</span>`);
  }
  if(view.screen==='gstModules' || (view.screen==='detail' && view.category==='gst')){
    parts.push(`${sep}<span class="seg crumbtn current" data-go="gstModules">GST Working</span>`);
  }
  if(view.screen==='tdsModules' || (view.screen==='detail' && view.category==='tds')){
    parts.push(`${sep}<span class="seg crumbtn current" data-go="tdsModules">TDS Working</span>`);
  }
  if(view.screen==='detail'){
    const mods = view.category==='gst'?GST_MODULES:TDS_MODULES;
    const m = mods.find(x=>x.id===view.moduleId);
    parts.push(`${sep}<span class="current">${esc(m?m.name:'')}</span>`);
  }
  if(['reports','calendar','users','settings','dashboard','team','approval'].includes(view.screen)){
    const labels = {reports:'Reports', calendar:'Compliance Calendar', users:'User Management', settings:'Settings', dashboard:'Dashboard', team:'Account Team', approval:'Approval Payment'};
    parts.push(`${sep}<span class="current">${labels[view.screen]}</span>`);
  }
  if(view.screen==='loggedOut'){ parts.push(`${sep}<span class="current">Signed out</span>`); }
  bc.innerHTML = parts.join('');
  bc.querySelectorAll('[data-go]').forEach(el=>{
    el.onclick = ()=>{
      const go = el.dataset.go;
      if(go==='home') view={screen:'home',companyId:null,moduleId:null,category:null};
      if(go==='workspace') view={screen:'workspace',companyId:view.companyId,moduleId:null,category:null};
      if(go==='gstModules') view={screen:'gstModules',companyId:view.companyId,moduleId:null,category:'gst'};
      if(go==='tdsModules') view={screen:'tdsModules',companyId:view.companyId,moduleId:null,category:'tds'};
      render();
    };
  });
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome(main){
  let cards = '';
  state.companies.forEach(c=>{
    cards += `
      <div class="co-card" data-cid="${c.id}" style="--accent:${c.accent||'linear-gradient(135deg, var(--blue), var(--purple))'}">
        <div class="co-card-body">
          <div class="co-top">
            <div class="co-avatar">${c.icon||esc(c.shortName.slice(0,2))}</div>
          </div>
          <h3>${esc(c.shortName)}</h3>
          <p class="full">${esc(c.fullName)}</p>
          <div class="co-meta">
            <div><div class="m-lbl">GSTIN</div><div class="m-val mono">${esc(c.gstin)||'—'}</div></div>
            <div><div class="m-lbl">PAN</div><div class="m-val mono">${esc(c.pan)||'—'}</div></div>
            <div><div class="m-lbl">Financial Year</div><div class="m-val">${esc(c.fy)}</div></div>
            <div><div class="m-lbl">Status</div><div class="m-val">${esc(c.status)}</div></div>
          </div>
          <div class="co-foot">
            <span class="upd">Updated ${esc(c.lastUpdated)}</span>
            <button class="access-btn" data-access="${c.id}">Access →</button>
          </div>
        </div>
      </div>`;
  });
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Six-company workspace</div>
      <h2>Good day, Finance Team</h2>
      <p>Select a company to open its GST and TDS working.</p>
    </div>
    <div class="company-grid">${cards}</div>
  `;
  main.querySelectorAll('[data-access]').forEach(b=> b.onclick = ()=>openWorkspace(b.dataset.access));
  main.querySelectorAll('.co-card').forEach(card=> card.addEventListener('click', ()=> openWorkspace(card.dataset.cid)));
}

function renderDashboard(main){
  main.innerHTML = `<div class="page-head"><h2>Dashboard</h2><p>Overview and key metrics.</p></div><div class="empty-state">Nothing here yet...</div>`;
}

function renderAccountTeam(main){
  main.innerHTML = `<div class="page-head"><h2>Account Team</h2><p>Manage your team.</p></div><div class="empty-state">Nothing here yet...</div>`;
}

function renderApprovalPayment(main){
  main.innerHTML = `<div class="page-head"><h2>Approval Payment</h2><p>Pending approvals and transactions.</p></div><div class="empty-state">Nothing here yet...</div>`;
}
function openWorkspace(cid){ state.activeCompanyId = cid; view = {screen:'workspace', companyId:cid, moduleId:null, category:null}; saveState(); render(); }

function openCompanyEditModal(cid){
  const c = getCompany(cid);
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" id="ovl">
      <div class="modal-box">
        <h3>Edit Company</h3>
        <div class="field"><label>Short Name</label><input id="m_short" value="${esc(c.shortName)}"></div>
        <div class="field"><label>Full Name</label><input id="m_full" value="${esc(c.fullName)}"></div>
        <div class="field"><label>GSTIN</label><input id="m_gstin" value="${esc(c.gstin)}" placeholder="22AAAAA0000A1Z5"></div>
        <div class="field"><label>PAN</label><input id="m_pan" value="${esc(c.pan)}" placeholder="AAAAA0000A"></div>
        <div class="field"><label>Financial Year</label><input id="m_fy" value="${esc(c.fy)}" placeholder="2026-27"></div>
        <div class="field"><label>Status</label>
          <select id="m_status">
            <option ${c.status==='Active'?'selected':''}>Active</option>
            <option ${c.status==='Inactive'?'selected':''}>Inactive</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn" id="m_cancel">Cancel</button>
          <button class="btn primary" id="m_save">Save changes</button>
        </div>
      </div>
    </div>`;
  document.getElementById('ovl').onclick = (e)=>{ if(e.target.id==='ovl') root.innerHTML=''; };
  document.getElementById('m_cancel').onclick = ()=> root.innerHTML='';
  document.getElementById('m_save').onclick = ()=>{
    c.shortName = document.getElementById('m_short').value.trim() || c.shortName;
    c.fullName = document.getElementById('m_full').value.trim() || c.fullName;
    c.gstin = document.getElementById('m_gstin').value.trim().toUpperCase();
    c.pan = document.getElementById('m_pan').value.trim().toUpperCase();
    c.fy = document.getElementById('m_fy').value.trim() || c.fy;
    c.status = document.getElementById('m_status').value;
    c.lastUpdated = new Date().toISOString().slice(0,10);
    root.innerHTML=''; saveState(); render();
  };
}

/* ============================================================
   WORKSPACE (2 big cards)
   ============================================================ */
function renderWorkspace(main){
  const c = getCompany(view.companyId);
  main.innerHTML = `
    <button class="back-btn" id="backBtn">← Back</button>
    <div class="page-head">
      <div class="eyebrow">${esc(c.shortName)} workspace</div>
      <h2>${esc(c.fullName)}</h2>
      <p>Choose GST Working or TDS Working to continue. <span id="editDetailsLink" style="color:var(--blue); font-weight:600; cursor:pointer;">Edit company details</span></p>
    </div>
    <div class="workspace-grid">
      <div class="big-module-card gst" id="goGst"><div class="glow"></div>
        <span class="ic">🧾</span>
        <h3>GST Working</h3>
        <p>Returns, reconciliations, ITC registers and RCM working for ${esc(c.shortName)}.</p>
        <span class="go">Open GST modules →</span>
      </div>
      <div class="big-module-card tds" id="goTds"><div class="glow"></div>
        <span class="ic">📑</span>
        <h3>TDS Working</h3>
        <p>Section-wise TDS vouchers, challans and return tracking for ${esc(c.shortName)}.</p>
        <span class="go">Open TDS modules →</span>
      </div>
    </div>
  `;
  document.getElementById('backBtn').onclick = ()=>{ view={screen:'home',companyId:null,moduleId:null,category:null}; render(); };
  document.getElementById('editDetailsLink').onclick = ()=> openCompanyEditModal(c.id);
  document.getElementById('goGst').onclick = ()=>{ view={screen:'gstModules', companyId:c.id, moduleId:null, category:'gst'}; render(); };
  document.getElementById('goTds').onclick = ()=>{ view={screen:'tdsModules', companyId:c.id, moduleId:null, category:'tds'}; render(); };
}

/* ============================================================
   MODULE GRID
   ============================================================ */
function renderModuleGrid(main, category){
  const c = getCompany(view.companyId);
  const mods = category==='gst'?GST_MODULES:TDS_MODULES;
  let cards='';
  mods.forEach(m=>{
    const ms = getModState(c, category, m.id);
    const pending = m.id==='notes' ? 0 : ms.entries.filter(e=>{
      const st = category==='gst' ? e.status : e.returnStatus;
      return st && st!=='Filed' && st!=='Completed';
    }).length;
    cards += `
      <div class="mod-card" data-mid="${m.id}" style="--accent:${MODULE_ACCENTS[m.color]||MODULE_ACCENTS.blue}">
        <div class="mc-glow"></div>
        <div class="top-row">
          <div class="mod-ic">${m.icon}</div>
          <span class="pending-badge ${pending===0?'zero':''}">${m.id==='notes' ? ms.entries.length+' notes' : pending+' pending'}</span>
        </div>
        <h4>${esc(m.name)}</h4>
        <p>${esc(m.desc)}</p>
        <div class="mod-foot">
          <span class="status-tag">${ms.approval}</span>
          <span class="open-link">Open module →</span>
        </div>
      </div>`;
  });
  main.innerHTML = `
    <button class="back-btn" id="backBtn">← Back</button>
    <div class="page-head">
      <div class="eyebrow">${esc(c.shortName)} · ${category==='gst'?'GST Working':'TDS Working'}</div>
      <h2>${category==='gst' ? 'GST Working Modules' : 'TDS Working Modules'}</h2>
      <p>${category==='gst' ? '10 working areas covering returns, reconciliation and ITC.' : '8 section-wise TDS working areas.'}</p>
    </div>
    <div class="mod-grid">${cards}</div>
  `;
  document.getElementById('backBtn').onclick = ()=>{ view={screen:'workspace', companyId:c.id, moduleId:null, category:null}; render(); };
  main.querySelectorAll('.mod-card').forEach(card=>{
    card.onclick = ()=>{ view = {screen:'detail', companyId:c.id, moduleId:card.dataset.mid, category}; render(); };
  });
}

/* ============================================================
   MODULE DETAIL
   ============================================================ */
function renderDetail(main, category){
  const c = getCompany(view.companyId);
  const mods = category==='gst'?GST_MODULES:TDS_MODULES;
  const mod = mods.find(m=>m.id===view.moduleId);
  const ms = getModState(c, category, mod.id);
  if(!ms.filters) ms.filters = { fy:'All', quarter:'All', month:'All', search:'', status:'All' };

  main.innerHTML = `
    <button class="back-btn" id="backBtn">← Back</button>
    <div class="page-head">
      <div class="eyebrow">${esc(c.shortName)} · ${category==='gst'?'GST Working':'TDS Working'}</div>
      <h2>${mod.icon} ${esc(mod.name)}</h2>
      <p>${esc(mod.desc)}</p>
    </div>
    <div id="detailBody"></div>
  `;
  document.getElementById('backBtn').onclick = ()=>{ view={screen: category==='gst'?'gstModules':'tdsModules', companyId:c.id, moduleId:null, category}; render(); };
  if(mod.id==='notes') renderNotesModule(document.getElementById('detailBody'), c, ms, mod);
  else renderVoucherModule(document.getElementById('detailBody'), c, ms, mod, category);
}

function filteredEntries(ms, dateField){
  return ms.entries.filter(e=>{
    if(ms.filters.fy!=='All' && getFY(e[dateField])!==ms.filters.fy) return false;
    if(ms.filters.quarter!=='All' && getQuarter(e[dateField])!==ms.filters.quarter) return false;
    if(ms.filters.month!=='All' && (new Date(e[dateField]).getMonth()+1)!==Number(ms.filters.month)) return false;
    if(ms.filters.search && !(e.party||'').toLowerCase().includes(ms.filters.search.toLowerCase())) return false;
    if(ms.filters.status!=='All'){
      const st = e.status || e.returnStatus;
      if(st!==ms.filters.status) return false;
    }
    return true;
  });
}

function toolbarHtml(ms, statusOptions){
  const fyList = ['All','2024-25','2025-26','2026-27','2027-28'];
  return `
    <div class="detail-toolbar">
      <div class="tb-field"><label>Financial Year</label>
        <select id="f_fy">${fyList.map(f=>`<option ${ms.filters.fy===f?'selected':''}>${f}</option>`).join('')}</select>
      </div>
      <div class="tb-field"><label>Quarter</label>
        <select id="f_q">${['All','Q1','Q2','Q3','Q4'].map(q=>`<option ${ms.filters.quarter===q?'selected':''}>${q}</option>`).join('')}</select>
      </div>
      <div class="tb-field"><label>Month</label>
        <select id="f_m"><option value="All" ${ms.filters.month==='All'?'selected':''}>All</option>
        ${MONTH_NAMES.map((n,i)=>`<option value="${i+1}" ${String(ms.filters.month)===String(i+1)?'selected':''}>${n}</option>`).join('')}</select>
      </div>
      <div class="tb-field"><label>Search party</label><input id="f_search" placeholder="Type a name…" value="${esc(ms.filters.search)}"></div>
      <div class="tb-field"><label>Status</label>
        <select id="f_status"><option ${ms.filters.status==='All'?'selected':''}>All</option>
        ${statusOptions.map(s=>`<option ${ms.filters.status===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
      <div class="tb-spacer"></div>
      <div class="tb-actions">
        <button class="btn" id="btnUpload">⬆ Upload Excel</button>
        <input type="file" id="fileUpload" accept=".xlsx,.xls,.csv">
        <button class="btn" id="btnSync">🔗 Government Sync</button>
        <button class="btn" id="btnExportExcel">⬇ Export Excel</button>
        <button class="btn ghost-purple" id="btnExportPdf">⬇ Export PDF</button>
      </div>
    </div>`;
}

function bindToolbar(ms, rerender){
  document.getElementById('f_fy').onchange = e=>{ ms.filters.fy=e.target.value; rerender(); };
  document.getElementById('f_q').onchange = e=>{ ms.filters.quarter=e.target.value; rerender(); };
  document.getElementById('f_m').onchange = e=>{ ms.filters.month=e.target.value; rerender(); };
  document.getElementById('f_status').onchange = e=>{ ms.filters.status=e.target.value; rerender(); };
  document.getElementById('f_search').oninput = e=>{ ms.filters.search=e.target.value; rerender(); };
  document.getElementById('btnExportPdf').onclick = ()=> window.print();
  document.getElementById('btnSync').onclick = ()=> showSyncModal();
}

function showSyncModal(){
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" id="ovl2">
      <div class="modal-box">
        <h3>Connect Government Portal</h3>
        <p style="font-size:13px; color:var(--muted); line-height:1.6;">
          Live sync pulls data directly from the GSTN / TRACES portal using your API credentials.
          This workspace isn't connected yet — add your credentials in <b>Settings</b> to enable
          one-click sync. Until then, use <b>Upload Excel</b> to bring in data you've downloaded manually.
        </p>
        <div class="modal-actions">
          <button class="btn" id="ovl2close">Close</button>
          <button class="btn primary" id="goSettings">Go to Settings</button>
        </div>
      </div>
    </div>`;
  document.getElementById('ovl2').onclick = (e)=>{ if(e.target.id==='ovl2') root.innerHTML=''; };
  document.getElementById('ovl2close').onclick = ()=> root.innerHTML='';
  document.getElementById('goSettings').onclick = ()=>{ root.innerHTML=''; view={screen:'settings'}; render(); };
}

/* -------- GST / TDS voucher module -------- */
function renderVoucherModule(container, c, ms, mod, category){
  const dateField = 'date';
  const rows = filteredEntries(ms, dateField);
  const statusOptions = category==='gst' ? ['Pending','In Review','Filed'] : ['Pending','Filed'];

  let totals;
  if(category==='gst'){
    totals = rows.reduce((a,r)=>{ a.taxable+=r.taxable; a.cgst+=r.cgst; a.sgst+=r.sgst; a.igst+=r.igst; a.total+=r.total; return a; },{taxable:0,cgst:0,sgst:0,igst:0,total:0});
  } else {
    totals = rows.reduce((a,r)=>{ a.amount+=r.amount; a.tds+=r.tdsAmt; a.interest+=(r.interest||0); a.lateFee+=(r.lateFee||0); return a; },{amount:0,tds:0,interest:0,lateFee:0});
    totals.net = totals.amount-totals.tds;
  }

  const summaryHtml = category==='gst' ? `
    <div class="summary-strip">
      <div class="sum-chip"><div class="l">Entries</div><div class="v mono">${rows.length}</div></div>
      <div class="sum-chip"><div class="l">Taxable Value</div><div class="v mono">${fmt(totals.taxable)}</div></div>
      <div class="sum-chip"><div class="l">CGST</div><div class="v mono">${fmt(totals.cgst)}</div></div>
      <div class="sum-chip"><div class="l">SGST</div><div class="v mono">${fmt(totals.sgst)}</div></div>
      <div class="sum-chip"><div class="l">IGST</div><div class="v mono">${fmt(totals.igst)}</div></div>
      <div class="sum-chip"><div class="l">Total Tax</div><div class="v mono">${fmt(totals.cgst+totals.sgst+totals.igst)}</div></div>
    </div>` : `
    <div class="summary-strip">
      <div class="sum-chip"><div class="l">Entries</div><div class="v mono">${rows.length}</div></div>
      <div class="sum-chip"><div class="l">Amount Paid/Credited</div><div class="v mono">${fmt(totals.amount)}</div></div>
      <div class="sum-chip"><div class="l">TDS Deducted</div><div class="v mono">${fmt(totals.tds)}</div></div>
      <div class="sum-chip"><div class="l">Interest + Late Fee</div><div class="v mono">${fmt(totals.interest+totals.lateFee)}</div></div>
      <div class="sum-chip"><div class="l">Net Payable</div><div class="v mono">${fmt(totals.net)}</div></div>
    </div>`;

  let tableHtml;
  if(category==='gst'){
    tableHtml = rows.length ? `
      <table>
        <thead><tr><th>Date</th><th>Invoice</th><th>Party</th><th>GSTIN</th><th>Taxable</th><th>Rate</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th><th>ITC Eligible</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map(r=>`
          <tr>
            <td>${esc(r.date)||'—'}</td><td>${esc(r.invoice)||'—'}</td><td>${esc(r.party)||'—'}</td><td class="mono">${esc(r.gstin)||'—'}</td>
            <td class="num-cell mono">${fmt(r.taxable)}</td><td class="num-cell">${r.rate}%</td>
            <td class="num-cell mono">${fmt(r.cgst)}</td><td class="num-cell mono">${fmt(r.sgst)}</td><td class="num-cell mono">${fmt(r.igst)}</td>
            <td class="num-cell mono">${fmt(r.total)}</td><td>${esc(r.itcEligible)}</td>
            <td><span class="pill ${r.status==='Filed'?'done':r.status==='In Review'?'review':'pending'}">${esc(r.status)}</span></td>
            <td><button class="del-btn" data-del="${r.id}">✕</button></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="empty-state"><div class="em-ic">📭</div>No entries match the current filters.</div>`;
  } else {
    tableHtml = rows.length ? `
      <table>
        <thead><tr><th>Date</th><th>Party</th><th>PAN</th><th>GST</th><th>Section</th><th>Invoice</th><th>Amount</th><th>Rate</th><th>TDS</th><th>Payment Date</th><th>Challan</th><th>Return</th><th>Interest</th><th>Late Fee</th><th>Approval</th><th></th></tr></thead>
        <tbody>${rows.map(r=>`
          <tr>
            <td>${esc(r.date)||'—'}</td><td>${esc(r.party)||'—'}</td><td class="mono">${esc(r.pan)||'—'}</td><td class="mono">${esc(r.gst)||'—'}</td>
            <td>${esc(r.section)}</td><td>${esc(r.invoice)||'—'}</td>
            <td class="num-cell mono">${fmt(r.amount)}</td><td class="num-cell">${r.rate}%</td><td class="num-cell mono">${fmt(r.tdsAmt)}</td>
            <td>${esc(r.paymentDate)||'—'}</td><td class="mono">${esc(r.challan)||'—'}</td>
            <td><span class="pill ${r.returnStatus==='Filed'?'done':'pending'}">${esc(r.returnStatus)}</span></td>
            <td class="num-cell mono">${fmt(r.interest)}</td><td class="num-cell mono">${fmt(r.lateFee)}</td>
            <td><span class="pill ${r.approval==='Approved'?'approved':'pending'}">${esc(r.approval)}</span></td>
            <td><button class="del-btn" data-del="${r.id}">✕</button></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="empty-state"><div class="em-ic">📭</div>No entries match the current filters.</div>`;
  }

  const formHtml = category==='gst' ? `
    <div class="entry-form-grid">
      <div class="field"><label>Date</label><input type="date" id="e_date"></div>
      <div class="field"><label>Invoice No.</label><input id="e_invoice" placeholder="INV-001"></div>
      <div class="field"><label>Party Name</label><input id="e_party" placeholder="Party / vendor"></div>
      <div class="field"><label>GSTIN</label><input id="e_gstin" placeholder="22AAAAA0000A1Z5"></div>
      <div class="field"><label>Taxable Value (₹)</label><input type="number" id="e_taxable" step="0.01" placeholder="0.00"></div>
      <div class="field"><label>Supply Type</label>
        <select id="e_supply"><option value="intra">Intra-state</option><option value="inter">Inter-state</option></select>
      </div>
      <div class="field"><label>GST Rate</label>
        <select id="e_rate">${[0,5,12,18,28].map(r=>`<option value="${r}">${r}%</option>`).join('')}</select>
      </div>
      <div class="field"><label>ITC Eligible</label>
        <select id="e_itc"><option>Yes</option><option>No</option><option>Blocked</option></select>
      </div>
      <div class="field"><label>Status</label>
        <select id="e_status">${statusOptions.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
    </div>
    <button class="btn primary" id="addEntryBtn" style="margin-top:14px;">+ Add entry</button>
  ` : `
    <div class="entry-form-grid">
      <div class="field"><label>Date</label><input type="date" id="e_date"></div>
      <div class="field"><label>Party Name</label><input id="e_party" placeholder="Vendor / payee"></div>
      <div class="field"><label>PAN</label><input id="e_pan" placeholder="AAAAA0000A"></div>
      <div class="field"><label>GSTIN</label><input id="e_gst" placeholder="22AAAAA0000A1Z5"></div>
      <div class="field"><label>Section</label><input id="e_section" value="${mod.section||''}"></div>
      <div class="field"><label>Invoice / Ref No.</label><input id="e_invoice" placeholder="INV-001"></div>
      <div class="field"><label>Amount Paid (₹)</label><input type="number" id="e_amount" step="0.01" placeholder="0.00"></div>
      <div class="field"><label>TDS Rate (%)</label><input type="number" id="e_rate" step="0.01" placeholder="e.g. 10"></div>
      <div class="field"><label>Payment Date</label><input type="date" id="e_paydate"></div>
      <div class="field"><label>Challan No.</label><input id="e_challan" placeholder="CHN-000"></div>
      <div class="field"><label>Return Status</label><select id="e_return">${['Pending','Filed'].map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div class="field"><label>Interest (₹)</label><input type="number" id="e_interest" step="0.01" placeholder="0.00"></div>
      <div class="field"><label>Late Fee (₹)</label><input type="number" id="e_latefee" step="0.01" placeholder="0.00"></div>
      <div class="field"><label>Approval</label><select id="e_approval">${['Pending','Approved'].map(s=>`<option>${s}</option>`).join('')}</select></div>
    </div>
    <button class="btn primary" id="addEntryBtn" style="margin-top:14px;">+ Add entry</button>
  `;

  container.innerHTML = `
    ${toolbarHtml(ms, statusOptions)}
    ${summaryHtml}
    <div class="panel">
      <div class="panel-head"><h3>Add ${category==='gst'?'invoice':'voucher'} entry</h3></div>
      <div class="panel-body">${formHtml}</div>
    </div>
    <div class="panel">
      <div class="panel-head">
        <h3>Working register (${rows.length}${rows.length!==ms.entries.length ? ' of '+ms.entries.length : ''})</h3>
        <div style="font-size:11.5px; color:var(--muted);">Section ${mod.section||''}</div>
      </div>
      <div class="table-scroll">${tableHtml}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Remarks, Approval &amp; Activity Log</h3></div>
      <div class="panel-body">
        <div class="remarks-approval">
          <div>
            <label style="font-size:10.5px; color:var(--muted); text-transform:uppercase; letter-spacing:.4px; font-weight:600;">Working notes / remarks</label>
            <textarea id="remarksBox" placeholder="Add remarks for this module…">${esc(ms.remarks)}</textarea>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
              <div>
                <label style="font-size:10.5px; color:var(--muted); text-transform:uppercase; letter-spacing:.4px; font-weight:600; display:block; margin-bottom:6px;">Approval status</label>
                <select class="approval-select" id="approvalSelect" style="width:220px;">
                  ${['Draft','Under Review','Approved'].map(s=>`<option ${ms.approval===s?'selected':''}>${s}</option>`).join('')}
                </select>
              </div>
              <button class="btn primary sm" id="saveRemarksBtn">Save</button>
            </div>
          </div>
          <div>
            <label style="font-size:10.5px; color:var(--muted); text-transform:uppercase; letter-spacing:.4px; font-weight:600; display:block; margin-bottom:8px;">Activity &amp; audit log</label>
            <div class="history-feed">
              ${ms.history.length ? ms.history.map(h=>`<div class="hist-item"><div class="hist-dot"></div><div class="txt"><b>${esc(h.text)}</b><div class="ts">${esc(h.ts)}</div></div></div>`).join('') : '<div class="empty-state" style="padding:20px 0;">No activity yet.</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const rerender = ()=> renderVoucherModule(container, c, ms, mod, category);
  bindToolbar(ms, rerender);

  container.querySelectorAll('[data-del]').forEach(b=>{
    b.onclick = ()=>{
      ms.entries = ms.entries.filter(r=>r.id!==b.dataset.del);
      addHistory(ms,'Deleted an entry'); saveState(); rerender();
    };
  });

  document.getElementById('addEntryBtn').onclick = ()=>{
    if(category==='gst'){
      const taxable = parseFloat(document.getElementById('e_taxable').value)||0;
      if(taxable<=0){ alert('Enter a taxable value greater than 0'); return; }
      const rate = parseFloat(document.getElementById('e_rate').value)||0;
      const supply = document.getElementById('e_supply').value;
      let cgst=0,sgst=0,igst=0;
      if(supply==='intra'){ cgst=taxable*rate/200; sgst=taxable*rate/200; } else { igst=taxable*rate/100; }
      ms.entries.push({
        id:uid(), date:document.getElementById('e_date').value, invoice:document.getElementById('e_invoice').value,
        party:document.getElementById('e_party').value, gstin:document.getElementById('e_gstin').value.toUpperCase(),
        taxable, rate, supply, cgst, sgst, igst, total:taxable+cgst+sgst+igst,
        itcEligible:document.getElementById('e_itc').value, status:document.getElementById('e_status').value
      });
      addHistory(ms, 'Added invoice entry'+(document.getElementById('e_party').value?' for '+document.getElementById('e_party').value:''));
    } else {
      const amount = parseFloat(document.getElementById('e_amount').value)||0;
      if(amount<=0){ alert('Enter an amount greater than 0'); return; }
      const rate = parseFloat(document.getElementById('e_rate').value)||0;
      ms.entries.push({
        id:uid(), date:document.getElementById('e_date').value, party:document.getElementById('e_party').value,
        pan:document.getElementById('e_pan').value.toUpperCase(), gst:document.getElementById('e_gst').value.toUpperCase(),
        section:document.getElementById('e_section').value, invoice:document.getElementById('e_invoice').value,
        amount, rate, tdsAmt:amount*rate/100, paymentDate:document.getElementById('e_paydate').value,
        challan:document.getElementById('e_challan').value, returnStatus:document.getElementById('e_return').value,
        interest:parseFloat(document.getElementById('e_interest').value)||0, lateFee:parseFloat(document.getElementById('e_latefee').value)||0,
        approval:document.getElementById('e_approval').value
      });
      addHistory(ms, 'Added TDS voucher'+(document.getElementById('e_party').value?' for '+document.getElementById('e_party').value:''));
    }
    saveState(); rerender();
  };

  document.getElementById('saveRemarksBtn').onclick = ()=>{
    const oldApproval = ms.approval;
    ms.remarks = document.getElementById('remarksBox').value;
    ms.approval = document.getElementById('approvalSelect').value;
    if(oldApproval!==ms.approval) addHistory(ms, 'Approval status changed to '+ms.approval);
    else addHistory(ms, 'Remarks updated');
    saveState(); rerender();
  };

  document.getElementById('btnExportExcel').onclick = ()=>{
    const headers = category==='gst'
      ? ['Date','Invoice','Party','GSTIN','Taxable','Rate%','CGST','SGST','IGST','Total','ITC Eligible','Status']
      : ['Date','Party','PAN','GST','Section','Invoice','Amount','Rate%','TDS','Payment Date','Challan','Return Status','Interest','Late Fee','Approval'];
    const data = category==='gst'
      ? rows.map(r=>[r.date,r.invoice,r.party,r.gstin,r.taxable,r.rate,r.cgst.toFixed(2),r.sgst.toFixed(2),r.igst.toFixed(2),r.total.toFixed(2),r.itcEligible,r.status])
      : rows.map(r=>[r.date,r.party,r.pan,r.gst,r.section,r.invoice,r.amount,r.rate,r.tdsAmt.toFixed(2),r.paymentDate,r.challan,r.returnStatus,r.interest,r.lateFee,r.approval]);
    exportXlsx(headers, data, `${c.shortName}_${mod.name.replace(/ +/g,'_')}.xlsx`);
  };

  document.getElementById('btnUpload').onclick = ()=> document.getElementById('fileUpload').click();
  document.getElementById('fileUpload').onchange = (e)=> handleUpload(e, ms, category, rerender);
}

/* -------- Notes module -------- */
function renderNotesModule(container, c, ms, mod){
  container.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>Add a note / working paper</h3></div>
      <div class="panel-body">
        <div class="entry-form-grid" style="grid-template-columns:1fr 1fr;">
          <div class="field"><label>Title</label><input id="n_title" placeholder="e.g. September ITC working"></div>
          <div class="field"><label>Date</label><input type="date" id="n_date"></div>
        </div>
        <div class="field" style="margin-top:12px;">
          <label>Note content</label>
          <textarea id="n_content" style="min-height:110px;" placeholder="Write the working / note here…"></textarea>
        </div>
        <button class="btn primary" id="addNoteBtn" style="margin-top:12px;">+ Add note</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Notes (${ms.entries.length})</h3></div>
      <div class="panel-body">
        <div class="notes-list">
          ${ms.entries.length ? ms.entries.map(n=>`
            <div class="note-card">
              <h4>${esc(n.title)}</h4>
              <div class="nd">${esc(n.date)||'—'}</div>
              <p>${esc(n.content)}</p>
              <div style="text-align:right; margin-top:8px;"><button class="del-btn" data-delnote="${n.id}">✕ Remove</button></div>
            </div>`).join('') : `<div class="empty-state"><div class="em-ic">🗒️</div>No notes yet — add the first one above.</div>`}
        </div>
      </div>
    </div>
  `;
  const rerender = ()=> renderNotesModule(container, c, ms, mod);
  document.getElementById('addNoteBtn').onclick = ()=>{
    const title = document.getElementById('n_title').value.trim();
    if(!title){ alert('Give the note a title'); return; }
    ms.entries.unshift({id:uid(), title, date:document.getElementById('n_date').value, content:document.getElementById('n_content').value});
    addHistory(ms, 'Added note: '+title);
    saveState(); rerender();
  };
  container.querySelectorAll('[data-delnote]').forEach(b=>{
    b.onclick = ()=>{ ms.entries = ms.entries.filter(n=>n.id!==b.dataset.delnote); addHistory(ms,'Removed a note'); saveState(); rerender(); };
  });
}

/* -------- Excel export / import -------- */
function exportXlsx(headers, rows, filename){
  try{
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Working');
    XLSX.writeFile(wb, filename);
  }catch(e){
    const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))].join(String.fromCharCode(10));
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download=filename.replace('.xlsx','.csv'); a.click(); URL.revokeObjectURL(url);
  }
}
function handleUpload(e, ms, category, rerender){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (evt)=>{
    try{
      const wb = XLSX.read(evt.target.result, {type:'array'});
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, {defval:''});
      let count = 0;
      json.forEach(row=>{
        const norm = {};
        Object.keys(row).forEach(k=> norm[k.trim().toLowerCase()] = row[k]);
        if(category==='gst'){
          const taxable = parseFloat(norm['taxable']||norm['taxable value']||0)||0;
          if(taxable<=0) return;
          const rate = parseFloat(norm['rate']||norm['rate%']||0)||0;
          const supply = (norm['supply']||'intra').toString().toLowerCase().includes('inter') ? 'inter':'intra';
          let cgst=0,sgst=0,igst=0;
          if(supply==='intra'){ cgst=taxable*rate/200; sgst=taxable*rate/200; } else { igst=taxable*rate/100; }
          ms.entries.push({id:uid(), date:norm['date']||'', invoice:norm['invoice']||'', party:norm['party']||'',
            gstin:(norm['gstin']||'').toString().toUpperCase(), taxable, rate, supply, cgst, sgst, igst, total:taxable+cgst+sgst+igst,
            itcEligible:norm['itc eligible']||'Yes', status:norm['status']||'Pending'});
        } else {
          const amount = parseFloat(norm['amount']||0)||0;
          if(amount<=0) return;
          const rate = parseFloat(norm['rate']||norm['rate%']||0)||0;
          ms.entries.push({id:uid(), date:norm['date']||'', party:norm['party']||'', pan:(norm['pan']||'').toString().toUpperCase(),
            gst:(norm['gst']||'').toString().toUpperCase(), section:norm['section']||'', invoice:norm['invoice']||'',
            amount, rate, tdsAmt:amount*rate/100, paymentDate:norm['payment date']||'', challan:norm['challan']||'',
            returnStatus:norm['return status']||'Pending', interest:parseFloat(norm['interest'])||0, lateFee:parseFloat(norm['late fee'])||0,
            approval:norm['approval']||'Pending'});
        }
        count++;
      });
      addHistory(ms, `Imported ${count} row(s) from ${file.name}`);
      saveState(); rerender();
      alert(count+' row(s) imported successfully.');
    }catch(err){ alert('Could not read that file. Please upload a valid Excel or CSV export.'); }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = '';
}

/* ============================================================
   REPORTS / CALENDAR / USERS / SETTINGS / LOGOUT
   ============================================================ */
function renderReports(main){
  let rows = state.companies.map(c=>{
    let gstTotal=0, tdsTotal=0;
    GST_MODULES.forEach(m=>{ const ms=c.gst[m.id]; if(ms) ms.entries.forEach(e=> gstTotal += (e.cgst||0)+(e.sgst||0)+(e.igst||0)); });
    TDS_MODULES.forEach(m=>{ const ms=c.tds[m.id]; if(ms) ms.entries.forEach(e=> tdsTotal += (e.tdsAmt||0)); });
    return {c, gstTotal, tdsTotal};
  });
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Cross-company view</div>
      <h2>Reports</h2>
      <p>Consolidated GST and TDS totals across all six companies.</p>
    </div>
    <div class="panel">
      <div class="panel-body">
        <div class="table-scroll">
          <table style="min-width:600px;">
            <thead><tr><th>Company</th><th>Financial Year</th><th>Status</th><th>Total GST</th><th>Total TDS</th></tr></thead>
            <tbody>
              ${rows.map(r=>`<tr>
                <td><b>${esc(r.c.shortName)}</b> — ${esc(r.c.fullName)}</td>
                <td>${esc(r.c.fy)}</td>
                <td><span class="pill ${r.c.status==='Active'?'done':'pending'}">${esc(r.c.status)}</span></td>
                <td class="num-cell mono">${fmt(r.gstTotal)}</td>
                <td class="num-cell mono">${fmt(r.tdsTotal)}</td>
              </tr>`).join('')}
            </tbody>
            <tfoot><tr>
              <td colspan="3">Totals</td>
              <td class="num-cell mono">${fmt(rows.reduce((a,r)=>a+r.gstTotal,0))}</td>
              <td class="num-cell mono">${fmt(rows.reduce((a,r)=>a+r.tdsTotal,0))}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderCalendar(main){
  const items = [
    {d:'11', m:'Every Month', t:'GSTR-1 Filing', s:'Outward supply return due for the previous month.'},
    {d:'13', m:'Every Month', t:'GSTR-1 (QRMP, quarterly)', s:'For taxpayers under the QRMP scheme.'},
    {d:'20', m:'Every Month', t:'GSTR-3B Filing', s:'Summary return and tax payment due date.'},
    {d:'07', m:'Every Month', t:'TDS Payment (Challan)', s:'Deposit of TDS deducted in the previous month.'},
    {d:'31', m:'Quarter End Month', t:'TDS Return Filing (24Q/26Q/27Q)', s:'Quarterly TDS return due date.'},
    {d:'30', m:'May', t:'TDS Return for Q4', s:'Due date for the last quarter of the financial year.'},
  ];
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Stay ahead of due dates</div>
      <h2>Compliance Calendar</h2>
      <p>Standard recurring GST and TDS due dates. Confirm against current CBIC / CBDT notifications before filing.</p>
    </div>
    <div class="simple-list">
      ${items.map(i=>`
        <div class="list-row">
          <div style="display:flex; align-items:center;">
            <div class="cal-date"><div class="d">${i.d}</div><div class="m">${i.m}</div></div>
            <div><div class="l-main">${i.t}</div><div class="l-sub">${i.s}</div></div>
          </div>
        </div>`).join('')}
    </div>
  `;
}

function renderUsers(main){
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Team access</div>
      <h2>User Management</h2>
      <p>People with access to this workspace.</p>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Add team member</h3></div>
      <div class="panel-body">
        <div class="entry-form-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="field"><label>Name</label><input id="u_name" placeholder="Full name"></div>
          <div class="field"><label>Email</label><input id="u_email" placeholder="name@company.com"></div>
          <div class="field"><label>Role</label><select id="u_role"><option>Admin</option><option>Reviewer</option><option>Preparer</option><option>Viewer</option></select></div>
        </div>
        <button class="btn primary" id="addUserBtn" style="margin-top:12px;">+ Add member</button>
      </div>
    </div>
    <div class="simple-list" id="userList"></div>
  `;
  function renderList(){
    document.getElementById('userList').innerHTML = state.users.map(u=>`
      <div class="list-row">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="acb-avatar" style="background:var(--blue-soft); color:var(--blue);">${esc(u.name.slice(0,2).toUpperCase())}</div>
          <div><div class="l-main">${esc(u.name)}</div><div class="l-sub">${esc(u.email)} · ${esc(u.role)}</div></div>
        </div>
        <button class="del-btn" data-deluser="${u.id}">✕</button>
      </div>`).join('');
    document.querySelectorAll('[data-deluser]').forEach(b=> b.onclick = ()=>{
      state.users = state.users.filter(u=>u.id!==b.dataset.deluser); saveState(); renderList();
    });
  }
  renderList();
  document.getElementById('addUserBtn').onclick = ()=>{
    const name = document.getElementById('u_name').value.trim();
    const email = document.getElementById('u_email').value.trim();
    if(!name || !email){ alert('Enter both name and email'); return; }
    state.users.push({id:uid(), name, email, role:document.getElementById('u_role').value});
    saveState(); renderList();
    document.getElementById('u_name').value=''; document.getElementById('u_email').value='';
  };
}

function renderSettings(main){
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Workspace configuration</div>
      <h2>Settings</h2>
      <p>Connect portals and set preferences. These are workspace-level toggles for this app.</p>
    </div>
    <div class="settings-grid">
      <div class="panel"><div class="panel-body">
        <h3 style="font-size:14.5px; margin:0 0 10px;">Government portal connections</h3>
        <div class="toggle-row"><div><div class="l-main" style="font-size:13px;">GSTN API</div><div class="l-sub">Enables live GSTR-2B sync</div></div><div class="switch" id="sw_gstn"></div></div>
        <div class="toggle-row"><div><div class="l-main" style="font-size:13px;">TRACES API</div><div class="l-sub">Enables live TDS challan/return status</div></div><div class="switch" id="sw_traces"></div></div>
      </div></div>
      <div class="panel"><div class="panel-body">
        <h3 style="font-size:14.5px; margin:0 0 10px;">Preferences</h3>
        <div class="toggle-row"><div><div class="l-main" style="font-size:13px;">Due-date reminders</div><div class="l-sub">Show compliance calendar alerts</div></div><div class="switch" id="sw_rem"></div></div>
      </div></div>
    </div>
  `;
  function sync(){
    document.getElementById('sw_gstn').className = 'switch'+(state.settings.gstnConnected?' on':'');
    document.getElementById('sw_traces').className = 'switch'+(state.settings.tracesConnected?' on':'');
    document.getElementById('sw_rem').className = 'switch'+(state.settings.autoReminders?' on':'');
  }
  sync();
  document.getElementById('sw_gstn').onclick = ()=>{ state.settings.gstnConnected=!state.settings.gstnConnected; saveState(); sync(); };
  document.getElementById('sw_traces').onclick = ()=>{ state.settings.tracesConnected=!state.settings.tracesConnected; saveState(); sync(); };
  document.getElementById('sw_rem').onclick = ()=>{ state.settings.autoReminders=!state.settings.autoReminders; saveState(); sync(); };
}

function renderLoggedOut(main){
  main.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; min-height:60vh;">
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:12px;">🔒</div>
        <h2 style="margin:0 0 8px;">You've been signed out</h2>
        <p style="color:var(--muted); margin:0 0 20px;">Your data is saved. Sign back in to continue.</p>
        <button class="btn primary" id="loginAgain">Sign back in</button>
      </div>
    </div>`;
  document.getElementById('loginAgain').onclick = ()=>{ view={screen:'home',companyId:null,moduleId:null,category:null}; render(); };
}

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/sw.js').catch(e=>console.warn('SW registration failed', e));
  });
}

/* ============================================================
   INIT
   ============================================================ */
(async function init(){
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('hidden');
  });
  document.getElementById('main').innerHTML = '<div class="empty-state">Loading your workspace…</div>';
  await loadState();
  render();
})();