var OverviewPage=({txns,liveEvents,addAudit})=>{
  var [tab,setTab]=useState('Volume');
  var chartData={Volume:useMemo(()=>Array.from({length:30},()=>Math.floor(Math.random()*80000+20000)),[]),Tokens:useMemo(()=>Array.from({length:30},()=>Math.floor(Math.random()*5000+1000)),[]),Contracts:useMemo(()=>Array.from({length:30},()=>Math.floor(Math.random()*50+5)),[])};
  var colors={Volume:'#7c3aed',Tokens:'#0d9488',Contracts:'#e11d48'};
  var statTiles=[{label:'Avg Block Time',val:'2.1s',icon:'⏱'},{label:'Active Nodes',val:'12',icon:'🌐'},{label:'Pending Txns',val:String(txns.filter(t=>t.status==='PENDING').length),icon:'⏳'},{label:'Chain Uptime',val:'99.98%',icon:'✅'}];
  return(
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Total Transactions" value={12847} delta={12.4} icon="⚡" glow="glow-p" bdr="rgba(124,58,237,.4)" sparkData={SPARK_P} sparkColor="#7c3aed"/>
        <MetricCard title="CampusCoin Supply" value={485200} pre="₹" delta={8.1} icon="🪙" glow="glow-t" bdr="rgba(13,148,136,.4)" sparkData={SPARK_T} sparkColor="#0d9488"/>
        <MetricCard title="Smart Contracts" value={1284} delta={-3.2} icon="📝" glow="glow-r" bdr="rgba(225,29,72,.4)" sparkData={SPARK_R} sparkColor="#e11d48"/>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Transaction Activity</h3>
            <div className="flex gap-1">{['Volume','Tokens','Contracts'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${tab===t?'text-white':'text-gray-500'}`} style={tab===t?{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}:{}}>{t}</button>)}</div>
          </div>
          <LineChart data={chartData[tab]} color={colors[tab]}/>
        </div>
        <div className="glass rounded-2xl p-4 flex flex-col" style={{maxHeight:280}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Live Chain Feed</h3>
            <span className="w-2 h-2 bg-green-400 rounded-full" style={{boxShadow:'0 0 6px #4ade80'}}/>
          </div>
          <div className="flex-1 space-y-2 scroll">
            {liveEvents.slice(-8).reverse().map((e,i)=>(
              <div key={i} className="text-xs space-y-0.5 pb-2 border-b border-white/5">
                <div className="flex items-center justify-between"><Badge type={e.type} text={e.type}/><span className="text-gray-600">#{e.block}</span></div>
                <div className="text-gray-400">{e.desc}</div>
                <div className="text-gray-600">{e.ts}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {statTiles.map((s,i)=>(
          <div key={i} className="glass rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-lg font-bold text-white font-mono">{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Services by Volume</h3>
          <BarChart items={[{label:'Tuition',v:450000},{label:'Canteen',v:85000},{label:'Hostel',v:220000},{label:'Events',v:65000},{label:'Library',v:32000}]}/>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="scroll" style={{maxHeight:220}}>
            <table className="w-full text-sm"><thead><tr>{['Tx Hash','Type','Student','Amount','Status'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>{txns.slice(0,6).map(t=>(<tr key={t.id} className="border-t border-white/5 tr"><Td><span className="font-mono text-purple-400 text-xs">{t.hash}</span></Td><Td><Badge type={t.type} text={t.type}/></Td><Td>{t.sname}</Td><Td><span className="font-mono">{fmtINR(t.amount)}</span></Td><Td><Badge type={t.status} text={t.status}/></Td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );};

var FeePortalPage=({fees,setFees,users,addAudit,addTxn,toast})=>{
  var [tab,setTab]=useState('Pending');
  var [modal,setModal]=useState(null);
  var [reminderText,setReminderText]=useState('');
  var pending=fees.filter(f=>f.status==='Pending');
  var confirmed=fees.filter(f=>f.status==='Confirmed');
  var markPaid=f=>{
    var hash=genHash();
    setFees(prev=>prev.map(x=>x.id===f.id?{...x,status:'Confirmed',txHash:hash,paidAt:fmtNow()}:x));
    addAudit('FEE_CONFIRMED','Dr. Meera Joshi',`Marked ${f.sname} ${f.cat} fee as paid`);
    addTxn({type:'FEE_PAYMENT',sname:f.sname,amount:f.amount,service:f.cat,status:'CONFIRMED'});
    toast('success','Fee Confirmed',`${f.sname} — ${f.cat} marked as paid`);
  };
  var sendReminder=f=>{setReminderText(rnd(AI_REMIND)+` [Student: ${f.sname}, Amount: ${fmtINR(f.amount)}, Due: ${f.due}]`);setModal('reminder');};
  var catProgress={Tuition:[...fees].filter(f=>f.cat==='Tuition'),Hostel:[...fees].filter(f=>f.cat==='Hostel'),Library:[...fees].filter(f=>f.cat==='Library'),Events:[...fees].filter(f=>f.cat==='Events')};
  return(
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(catProgress).map(([cat,items])=>{
          var conf=items.filter(x=>x.status==='Confirmed').length,total=items.length||1;
          return(<div key={cat} className="glass rounded-xl p-4"><div className="flex justify-between text-xs mb-2"><span className="text-gray-400">{cat}</span><span className="text-white font-medium">{conf}/{total}</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${(conf/total)*100}%`,background:'linear-gradient(90deg,#7c3aed,#2563eb)'}}/></div></div>);
        })}
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Fee Portal</h2>
          <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,.05)'}}>
            {['Pending','Confirmed'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'text-white':'text-gray-500'}`} style={tab===t?{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}:{}}>{t} {tab===t?`(${t==='Pending'?pending.length:confirmed.length})`:''}</button>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(tab==='Pending'?pending:confirmed).map(f=>(
            <div key={f.id} className="rounded-xl p-4 space-y-3" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}>
              <div className="flex items-start justify-between">
                <div><div className="font-medium text-white">{f.sname}</div><div className="text-xs text-gray-500">{f.cat} · Due: {f.due}</div></div>
                <Badge type={f.status} text={f.status}/>
              </div>
              <div className="text-xl font-bold font-mono text-white">{fmtINR(f.amount)}</div>
              {f.status==='Pending'&&(
                <div className="flex gap-2">
                  <BtnP onClick={()=>markPaid(f)} cls="flex-1 text-center">✅ Mark as Paid</BtnP>
                  <BtnS onClick={()=>sendReminder(f)} cls="flex-1 text-center">📨 AI Reminder</BtnS>
                </div>
              )}
              {f.status==='Confirmed'&&<div className="text-xs font-mono text-green-400">Tx: {f.txHash}</div>}
            </div>
          ))}
        </div>
      </div>
      <Modal open={modal==='reminder'} onClose={()=>setModal(null)} title="🤖 AI-Generated Reminder">
        <div className="glass rounded-xl p-4 text-sm text-gray-300 leading-relaxed mb-4">{reminderText}</div>
        <div className="flex gap-2"><BtnP onClick={()=>{toast('success','Reminder Sent!','AI reminder dispatched via campus portal');setModal(null);}}>📤 Send Reminder</BtnP><BtnS onClick={()=>setModal(null)}>Cancel</BtnS></div>
      </Modal>
    </div>
  );};

var EventTicketsPage=({events,setEvents,users,nfts,setNfts,addAudit,addTxn,toast})=>{
  var [modal,setModal]=useState(null);
  var [curEvent,setCurEvent]=useState(null);
  var [form,setForm]=useState({name:'',date:'',venue:'',price:'',cap:''});
  var [mintForm,setMintForm]=useState({sid:'',seat:''});
  var students=users.filter(u=>u.role==='Student');
  var createEvent=()=>{
    if(!form.name||!form.date)return;
    var desc=rnd(AI_EVENT_DESC);
    var ne={id:nextId(events),name:form.name,date:form.date,venue:form.venue,price:Number(form.price)||0,cap:Number(form.cap)||100,sold:0,status:'Active',desc};
    setEvents(prev=>[...prev,ne]);
    addAudit('EVENT_CREATED','Dr. Meera Joshi',`Created event: ${form.name}`);
    toast('success','Event Created!',form.name);
    setForm({name:'',date:'',venue:'',price:'',cap:''});setModal(null);
  };
  var deleteEvent=e=>{if(!window.confirm(`Delete "${e.name}"?`))return;setEvents(prev=>prev.filter(x=>x.id!==e.id));addAudit('EVENT_DELETED','Dr. Meera Joshi',`Deleted event: ${e.name}`);toast('info','Event Deleted',e.name);};
  var mintNFT=()=>{
    var ev=events.find(e=>e.id===curEvent);
    var st=students.find(s=>s.id===Number(mintForm.sid));
    if(!ev||!st||!mintForm.seat)return;
    var token='TKT-'+genHash().substr(2,6);
    setNfts(prev=>[...prev,{id:'NFT-'+nextId(nfts).toString().padStart(3,'0'),sid:st.id,sname:st.name,eid:ev.id,ename:ev.name,seat:mintForm.seat,ts:fmtNow(),token}]);
    setEvents(prev=>prev.map(e=>e.id===curEvent?{...e,sold:e.sold+1}:e));
    addAudit('NFT_MINTED','Dr. Meera Joshi',`Minted NFT for ${st.name} — ${ev.name} seat ${mintForm.seat}`);
    addTxn({type:'TOKEN_MINT',sname:st.name,amount:ev.price,service:'Event Ticket',status:'CONFIRMED'});
    toast('success','NFT Minted!',`Token: ${token}`);
    setMintForm({sid:'',seat:''});setModal(null);
  };
  var burnTicket=n=>{setNfts(prev=>prev.filter(x=>x.id!==n.id));addAudit('NFT_BURNED','Dr. Meera Joshi',`Burned ticket ${n.token}`);toast('info','Ticket Burned',n.token);};
  return(
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Event Tickets</h2>
        <BtnP onClick={()=>setModal('create')}>＋ Create Event</BtnP>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {events.map(ev=>(
          <div key={ev.id} className="glass rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div><div className="font-semibold text-white">{ev.name}</div><div className="text-xs text-gray-500">📅 {ev.date} · 📍 {ev.venue}</div></div>
              <Badge type={ev.status} text={ev.status}/>
            </div>
            <div className="text-sm text-gray-400">{ev.desc}</div>
            <div className="flex justify-between text-sm"><span className="text-white font-mono">{ev.price===0?'Free':fmtINR(ev.price)}</span><span className="text-gray-400">{ev.sold}/{ev.cap} sold</span></div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${Math.min((ev.sold/ev.cap)*100,100)}%`,background:'linear-gradient(90deg,#7c3aed,#2563eb)'}}/></div>
            <div className="flex gap-2">
              <BtnP onClick={()=>{setCurEvent(ev.id);setModal('mint');}} cls="flex-1 text-xs text-center">🪙 Mint NFT</BtnP>
              <BtnS onClick={()=>deleteEvent(ev)} cls="text-xs text-red-400">🗑 Delete</BtnS>
            </div>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">NFT Mint Log</h3>
        <table className="w-full"><thead><tr>{['Token ID','Student','Event','Seat','Minted At',''].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>{nfts.map(n=>(<tr key={n.id} className="border-t border-white/5 tr"><Td><span className="font-mono text-purple-400 text-xs">{n.token}</span></Td><Td>{n.sname}</Td><Td>{n.ename}</Td><Td>{n.seat}</Td><Td className="text-xs">{n.ts}</Td><Td><button onClick={()=>burnTicket(n)} className="text-xs text-red-400 hover:text-red-300">Burn</button></Td></tr>))}</tbody>
        </table>
      </div>
      <Modal open={modal==='create'} onClose={()=>setModal(null)} title="🎟 Create New Event">
        <div className="space-y-3">
          <div><Lbl>Event Name</Lbl><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Tech Summit 2026"/></div>
          <div className="grid grid-cols-2 gap-3"><div><Lbl>Date</Lbl><Inp type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div><div><Lbl>Venue</Lbl><Inp value={form.venue} onChange={e=>setForm(p=>({...p,venue:e.target.value}))} placeholder="Main Hall"/></div></div>
          <div className="grid grid-cols-2 gap-3"><div><Lbl>Price (₹)</Lbl><Inp type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} placeholder="500"/></div><div><Lbl>Capacity</Lbl><Inp type="number" value={form.cap} onChange={e=>setForm(p=>({...p,cap:e.target.value}))} placeholder="200"/></div></div>
          <div className="flex gap-2 pt-2"><BtnP onClick={createEvent}>Create Event</BtnP><BtnS onClick={()=>setModal(null)}>Cancel</BtnS></div>
        </div>
      </Modal>
      <Modal open={modal==='mint'} onClose={()=>setModal(null)} title="🪙 Mint NFT Ticket">
        <div className="space-y-3">
          <div><Lbl>Select Student</Lbl><Sel value={mintForm.sid} onChange={e=>setMintForm(p=>({...p,sid:e.target.value}))}><option value="">-- Select --</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel></div>
          <div><Lbl>Seat Number</Lbl><Inp value={mintForm.seat} onChange={e=>setMintForm(p=>({...p,seat:e.target.value}))} placeholder="A-01"/></div>
          <div className="flex gap-2 pt-2"><BtnP onClick={mintNFT}>🪙 Mint Ticket</BtnP><BtnS onClick={()=>setModal(null)}>Cancel</BtnS></div>
        </div>
      </Modal>
    </div>
  );};

var UsersRolesPage=({users,setUsers,addAudit,toast})=>{
  var [modal,setModal]=useState(null);
  var [editUser,setEditUser]=useState(null);
  var [form,setForm]=useState({name:'',email:'',role:'Student',balance:''});
  var RBAC={Student:['View Wallet','Pay Fees','Buy Tickets','P2P Transfer'],Faculty:['View Wallet','Pay Fees','Buy Tickets','P2P Transfer','View Reports'],Admin:['View Wallet','Pay Fees','Buy Tickets','P2P Transfer','View Reports','Manage Users','Policy Config','Audit Trail'],SuperAdmin:['All Permissions','System Config','Contract Deploy']};
  var openAdd=()=>{setEditUser(null);setForm({name:'',email:'',role:'Student',balance:''});setModal('form');};
  var openEdit=u=>{setEditUser(u);setForm({name:u.name,email:u.email,role:u.role,balance:String(u.balance)});setModal('form');};
  var save=()=>{
    if(!form.name||!form.email)return;
    if(editUser){setUsers(prev=>prev.map(u=>u.id===editUser.id?{...u,...form,balance:Number(form.balance)}:u));addAudit('USER_UPDATED','Dr. Meera Joshi',`Updated user: ${form.name}`);toast('success','User Updated',form.name);}
    else{var nu={id:nextId(users),name:form.name,email:form.email,role:form.role,balance:Number(form.balance)||0,status:'Active',wallet:'0x'+genFullHash().substr(2,40),dept:'General'};setUsers(prev=>[...prev,nu]);addAudit('USER_CREATED','Dr. Meera Joshi',`Created user: ${form.name}`);toast('success','User Created',form.name);}
    setModal(null);
  };
  var toggleSuspend=u=>{
    var ns=u.status==='Active'?'Suspended':'Active';
    setUsers(prev=>prev.map(x=>x.id===u.id?{...x,status:ns}:x));
    addAudit(ns==='Suspended'?'USER_SUSPENDED':'USER_REACTIVATED','Dr. Meera Joshi',`${ns} user: ${u.name}`);
    toast(ns==='Suspended'?'warning':'success',`User ${ns}`,u.name);
  };
  return(
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Users & Roles</h2>
        <BtnP onClick={openAdd}>＋ Add User</BtnP>
      </div>
      <div className="glass rounded-2xl p-5">
        <table className="w-full">
          <thead><tr>{['User','Role','Wallet','Balance','Status','Actions'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id} className="border-t border-white/5 tr">
                <Td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}}>{u.name[0]}</div><div><div className="text-white text-sm font-medium">{u.name}</div><div className="text-xs text-gray-500">{u.email}</div></div></div></Td>
                <Td><Badge type={u.role} text={u.role}/></Td>
                <Td><span className="font-mono text-xs text-gray-400">{u.wallet.substr(0,18)}…</span></Td>
                <Td><span className="font-mono">{fmtINR(u.balance)}</span></Td>
                <Td><Badge type={u.status} text={u.status}/></Td>
                <Td><div className="flex gap-2"><button onClick={()=>openEdit(u)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Edit</button><button onClick={()=>toggleSuspend(u)} className={`text-xs transition-colors ${u.status==='Active'?'text-red-400 hover:text-red-300':'text-green-400 hover:text-green-300'}`}>{u.status==='Active'?'Suspend':'Reactivate'}</button></div></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">RBAC Permission Matrix</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(RBAC).map(([role,perms])=>(
            <div key={role} className="rounded-xl p-3" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}>
              <Badge type={role} text={role}/><div className="mt-2 space-y-1">{perms.map(p=><div key={p} className="flex items-center gap-1.5 text-xs text-gray-400"><span className="text-green-400">✓</span>{p}</div>)}</div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={modal==='form'} onClose={()=>setModal(null)} title={editUser?'✏️ Edit User':'➕ Add User'}>
        <div className="space-y-3">
          <div><Lbl>Name</Lbl><Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full Name"/></div>
          <div><Lbl>Email</Lbl><Inp type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="user@mitadt.edu"/></div>
          <div><Lbl>Role</Lbl><Sel value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>{['Student','Faculty','Admin'].map(r=><option key={r}>{r}</option>)}</Sel></div>
          <div><Lbl>Initial Balance (₹)</Lbl><Inp type="number" value={form.balance} onChange={e=>setForm(p=>({...p,balance:e.target.value}))} placeholder="0"/></div>
          <div className="flex gap-2 pt-2"><BtnP onClick={save}>{editUser?'Save Changes':'Create User'}</BtnP><BtnS onClick={()=>setModal(null)}>Cancel</BtnS></div>
        </div>
      </Modal>
    </div>
  );};

var PolicyConfigPage=({policies,setPolicies,addAudit,toast})=>{
  var [vals,setVals]=useState(()=>Object.fromEntries(policies.map(p=>[p.id,p.val])));
  var toggle=p=>{
    setPolicies(prev=>prev.map(x=>x.id===p.id?{...x,enabled:!x.enabled}:x));
    addAudit('POLICY_UPDATE','Dr. Meera Joshi',`${p.enabled?'Disabled':'Enabled'} policy: ${p.name}`);
    toast('info','Policy Updated',`${p.name} ${p.enabled?'disabled':'enabled'}`);
  };
  var update=p=>{
    var nv=Number(vals[p.id]);
    setPolicies(prev=>prev.map(x=>x.id===p.id?{...x,val:nv}:x));
    addAudit('POLICY_UPDATE','Dr. Meera Joshi',`Updated ${p.name} to ${nv} ${p.unit}`);
    toast('success','Contract Updated',`${p.name} → ${nv} ${p.unit} (on-chain)`);
  };
  return(
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Smart Contract Policy Config</h2>
      <div className="grid grid-cols-2 gap-4">
        {policies.map(p=>(
          <div key={p.id} className="glass rounded-2xl p-5 space-y-3" style={{border:`1px solid ${p.enabled?'rgba(124,58,237,.3)':'rgba(255,255,255,.08)'}`}}>
            <div className="flex items-start justify-between">
              <div><div className="font-medium text-white">{p.name}</div><div className="text-xs text-gray-500 mt-0.5">{p.desc}</div></div>
              <label className="toggle-sw"><input type="checkbox" checked={p.enabled} onChange={()=>toggle(p)}/><span className="toggle-sl"/></label>
            </div>
            <Badge type={p.enabled?'Active':'Suspended'} text={p.enabled?'ENABLED':'DISABLED'}/>
            {p.unit!=='bool'&&(
              <div className="flex gap-2 items-center">
                <Inp type="number" value={vals[p.id]} onChange={e=>setVals(prev=>({...prev,[p.id]:e.target.value}))} className="flex-1"/>
                <span className="text-xs text-gray-400">{p.unit}</span>
              </div>
            )}
            <BtnP onClick={()=>update(p)} cls="w-full text-center text-xs">⛓ Update Contract</BtnP>
          </div>
        ))}
      </div>
    </div>
  );};

var AuditTrailPage=({auditLog})=>{
  var [filter,setFilter]=useState('All');
  var types=['All','FEE_CONFIRMED','POLICY_UPDATE','USER_SUSPENDED','USER_CREATED','NFT_MINTED','SMART_CTR','DISPUTE_RESOLVED'];
  var filtered=filter==='All'?auditLog:auditLog.filter(a=>a.action===filter);
  var exportCSV=()=>{
    var csv='Timestamp,Block,Action,Actor,Details,Hash\n'+auditLog.map(a=>`"${a.ts}",${a.block},"${a.action}","${a.actor}","${a.detail}","${a.hash}"`).join('\n');
    var b=new Blob([csv],{type:'text/csv'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='campuschain-audit.csv';a.click();
  };
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Audit Trail</h2>
        <div className="flex gap-3 items-center">
          <Sel value={filter} onChange={e=>setFilter(e.target.value)} style={{width:200}}>{types.map(t=><option key={t}>{t}</option>)}</Sel>
          <BtnS onClick={exportCSV}>📥 Export CSV</BtnS>
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <table className="w-full">
          <thead><tr>{['Timestamp','Block #','Action','Actor','Details','Hash'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>
            {[...filtered].reverse().map((a,i)=>(
              <tr key={i} className="border-t border-white/5 tr">
                <Td className="text-xs">{a.ts}</Td>
                <Td><span className="font-mono text-xs text-gray-400">#{a.block}</span></Td>
                <Td><Badge type={a.action} text={a.action}/></Td>
                <Td>{a.actor}</Td>
                <Td className="text-xs max-w-48">{a.detail}</Td>
                <Td><span className="font-mono text-xs text-purple-400">{a.hash}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );};

var DisputesPage=({disputes,setDisputes,addAudit,toast})=>{
  var [tab,setTab]=useState('Open');
  var open=disputes.filter(d=>d.status==='Open');
  var resolved=disputes.filter(d=>d.status==='Resolved');
  var resolve=d=>{
    setDisputes(prev=>prev.map(x=>x.id===d.id?{...x,status:'Resolved',resolvedAt:fmtNow()}:x));
    addAudit('DISPUTE_RESOLVED','Dr. Meera Joshi',`Resolved dispute: ${d.sname} — ${d.reason}`);
    toast('success','Dispute Resolved',d.sname);
  };
  var list=tab==='Open'?open:resolved;
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Disputes</h2>
        <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,.05)'}}>
          {['Open','Resolved'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'text-white':'text-gray-500'}`} style={tab===t?{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}:{}}>{t} ({t==='Open'?open.length:resolved.length})</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {list.map(d=>(
          <div key={d.id} className="glass rounded-2xl p-5 space-y-3" style={{borderColor:d.pri==='HIGH'?'rgba(225,29,72,.3)':d.pri==='MED'?'rgba(234,179,8,.3)':'rgba(34,197,94,.3)'}}>
            <div className="flex items-start justify-between">
              <div><div className="font-medium text-white">{d.sname}</div><div className="text-xs text-gray-500">Raised: {d.raised}</div></div>
              <Badge type={d.pri} text={d.pri}/>
            </div>
            <div className="text-sm text-gray-300">{d.reason}</div>
            {d.amount>0&&<div className="font-mono text-white">{fmtINR(d.amount)}</div>}
            {d.status==='Open'?<BtnP onClick={()=>resolve(d)} cls="w-full text-center">✅ Resolve Dispute</BtnP>:<div className="text-xs text-green-400">✓ Resolved: {d.resolvedAt}</div>}
          </div>
        ))}
      </div>
    </div>
  );};

var P2PAdminPage=({txns})=>{
  var p2p=txns.filter(t=>t.type==='P2P_XFER');
  return(
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">P2P Transactions</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{label:'Total P2P Volume',val:fmtINR(p2p.reduce((a,t)=>a+t.amount,0)),icon:'💸'},{label:'Total Transfers',val:String(p2p.length),icon:'🔄'},{label:'Avg Amount',val:fmtINR(p2p.length?Math.floor(p2p.reduce((a,t)=>a+t.amount,0)/p2p.length):0),icon:'📊'}].map((s,i)=>(
          <div key={i} className="glass rounded-xl p-4 text-center"><div className="text-2xl mb-1">{s.icon}</div><div className="text-xl font-bold text-white font-mono">{s.val}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5">
        <table className="w-full">
          <thead><tr>{['Tx Hash','From','Amount','Service','Status','Time'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
          <tbody>{txns.slice().reverse().map((t,i)=>(<tr key={i} className="border-t border-white/5 tr"><Td><span className="font-mono text-purple-400 text-xs">{t.hash}</span></Td><Td>{t.sname}</Td><Td><span className="font-mono">{fmtINR(t.amount)}</span></Td><Td>{t.service}</Td><Td><Badge type={t.status} text={t.status}/></Td><Td className="text-xs">{t.ts}</Td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );};
