var LoginScreen=({onLogin})=>{
  var [mode,setMode]=useState('login'); // 'login' or 'register'
  var [role,setRole]=useState('student');
  var [name,setName]=useState('');
  var [email,setEmail]=useState('');
  var [pw,setPw]=useState('');
  var [err,setErr]=useState('');
  var [loading,setLoading]=useState(false);
  
  var CREDS={admin:{email:'meera@mitadt.edu',pw:'admin123'},student:{email:'rahul@mitadt.edu',pw:'student123'}};
  var particles=useMemo(()=>Array.from({length:20},(_,i)=>({id:i,size:Math.random()*6+2,x:Math.random()*100,y:Math.random()*100,dur:Math.random()*8+4,delay:Math.random()*4,color:['#7c3aed','#2563eb','#0d9488'][i%3]})),[]);
  
  var autofill=()=>{
    setEmail(CREDS[role].email);
    setPw(CREDS[role].pw);
    if(mode==='register') setName(role==='admin'?'Dr. Meera Joshi':'Rahul Sharma');
  };

  var submit=async e=>{
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password: pw } : { name, email, password: pw, role: role.charAt(0).toUpperCase() + role.slice(1) };
      
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('cc_token', data.token);
      onLogin(data.user);
    } catch (err) {
      console.error(err);
      setErr(err.message + ". Try autofill for demo.");
    } finally {
      setLoading(false);
    }
  };

  return(
    <div className="w-full h-full flex items-center justify-center relative" style={{background:'#0a0a0f'}}>
      <div className="grid-bg absolute inset-0 pointer-events-none"/>
      {particles.map(p=>(
        <div key={p.id} className="particle pointer-events-none" style={{width:p.size,height:p.size,left:`${p.x}%`,top:`${p.y}%`,background:p.color,opacity:.35,boxShadow:`0 0 ${p.size*2}px ${p.color}`,animation:`float ${p.dur}s ${p.delay}s ease-in-out infinite`}}/>
      ))}
      <div className="glass rounded-3xl p-8 w-full max-w-md relative z-10" style={{border:'1px solid rgba(124,58,237,.35)',boxShadow:'0 0 60px rgba(124,58,237,.2)'}}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⛓</div>
          <h1 className="text-3xl font-bold gradient-text">CampusChain</h1>
          <p className="text-gray-500 text-sm mt-1">{mode==='login'?'Sign in to your account':'Create a new account'}</p>
        </div>

        <div className="flex gap-4 mb-6 border-b border-white/10">
          {['login','register'].map(m=>(
            <button key={m} onClick={()=>setMode(m)} className={`pb-2 text-sm font-medium transition-all ${mode===m?'text-purple-400 border-b-2 border-purple-400':'text-gray-500 hover:text-gray-300'}`}>
              {m==='login'?'Login':'Register'}
            </button>
          ))}
        </div>

        <div className="flex rounded-xl overflow-hidden mb-6 p-1" style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)'}}>
          {[['student','🎓 Student'],['admin','🛡 Admin']].map(([r,lbl])=>(
            <button key={r} onClick={()=>{setRole(r);setEmail('');setPw('');setErr('');}} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${role===r?'text-white':'text-gray-500 hover:text-gray-300'}`} style={role===r?{background:'linear-gradient(135deg,#7c3aed,#2563eb)',boxShadow:'0 4px 15px rgba(124,58,237,.3)'}:{}}>{lbl}</button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode==='register' && (
            <div><Lbl>Full Name</Lbl><Inp type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" required/></div>
          )}
          <div><Lbl>Email Address</Lbl><Inp type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="university@mitadt.edu" required/></div>
          <div><Lbl>Password</Lbl><Inp type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required/></div>
          
          {err&&<div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}
          
          <div className="flex gap-2">
            <BtnS onClick={autofill} cls="flex-1 justify-center text-center text-xs">✨ Autofill</BtnS>
            <button type="submit" disabled={loading} className="btn-p flex-[2] py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
              {loading?<><span style={{animation:'spin .8s linear infinite',display:'inline-block'}}>⟳</span> Connecting...</>:<> {mode==='login'?'Sign In':'Create Account'}</>}
            </button>
          </div>
        </form>
        
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-1 text-[10px] text-gray-600">
          <span>🔒 Hyperledger Fabric</span><span className="text-right">⚡ 3,482 TPS</span>
          <span>🌐 12 Active Nodes</span><span className="text-right">🛡 ZK Auth</span>
        </div>
      </div>
    </div>
  );};

var Sidebar=({role,page,setPage,disputes,fees,collapsed,setCollapsed})=>{
  var openD=disputes.filter(d=>d.status==='Open').length;
  var aR=[
    {id:'overview',icon:'📊',label:'Overview'},
    {id:'fee-portal',icon:'💳',label:'Fee Portal'},
    {id:'event-tickets',icon:'🎟',label:'Event Tickets'},
    {id:'p2p-transactions',icon:'🔄',label:'P2P Transactions'},
    {id:'disputes',icon:'⚖️',label:'Disputes',badge:openD},
    {id:'users-roles',icon:'👥',label:'Users & Roles'},
    {id:'policy-config',icon:'⚙️',label:'Policy Config'},
    {id:'audit-trail',icon:'📋',label:'Audit Trail'},
  ];
  var sR=[
    {id:'my-wallet',icon:'👛',label:'My Wallet'},
    {id:'my-fees',icon:'💰',label:'My Fees'},
    {id:'events-tickets',icon:'🎫',label:'Events & Tickets'},
    {id:'p2p-transfer',icon:'↔️',label:'P2P Transfer'},
    {id:'my-profile',icon:'👤',label:'My Profile'},
  ];
  var routes=role==='admin'?aR:sR;
  return(
    <div className="flex flex-col shrink-0 transition-all duration-300" style={{width:collapsed?60:220,background:'linear-gradient(180deg,#0f0f1a,#0a0a14)',borderRight:'1px solid rgba(255,255,255,.08)',height:'100vh'}}>
      <div className="flex items-center gap-3 px-4" style={{height:60,borderBottom:'1px solid rgba(255,255,255,.08)'}}>
        <span className="text-xl shrink-0">⛓</span>
        {!collapsed&&<span className="font-bold text-sm gradient-text whitespace-nowrap">CampusChain</span>}
      </div>
      <nav className="flex-1 p-2 space-y-0.5 scroll">
        {routes.map(r=>(
          <div key={r.id} onClick={()=>setPage(r.id)} className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl ${page===r.id?'active':''}`}>
            <span className="text-base shrink-0">{r.icon}</span>
            {!collapsed&&<span className="text-sm text-gray-300 flex-1 whitespace-nowrap">{r.label}</span>}
            {!collapsed&&r.badge>0&&<span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold">{r.badge}</span>}
          </div>
        ))}
      </nav>
      {role==='admin'&&!collapsed&&(
        <div className="m-2 p-3 rounded-xl" style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)'}}>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Network Health</div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" style={{boxShadow:'0 0 6px #4ade80'}}/>
            <span className="text-gray-400">Consensus: Active</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600"><span>Nodes: 12</span><span>~2s</span><span>Gas:₹0</span></div>
        </div>
      )}
      <button onClick={()=>setCollapsed(!collapsed)} className="m-2 p-2 rounded-xl text-gray-500 hover:text-white transition-colors text-sm text-center" style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)'}}>
        {collapsed?'→':'←'}
      </button>
    </div>
  );};

var TopBar=({user,page,block,onLogout,notifs})=>{
  var L={'overview':'Overview','fee-portal':'Fee Portal','event-tickets':'Event Tickets','p2p-transactions':'P2P Transactions','disputes':'Disputes','users-roles':'Users & Roles','policy-config':'Policy Config','audit-trail':'Audit Trail','my-wallet':'My Wallet','my-fees':'My Fees','events-tickets':'Events & Tickets','p2p-transfer':'P2P Transfer','my-profile':'My Profile'};
  return(
    <div className="flex items-center justify-between px-6 shrink-0" style={{height:60,background:'rgba(10,10,15,.9)',borderBottom:'1px solid rgba(255,255,255,.08)',backdropFilter:'blur(10px)'}}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">MIT-ADT University</span>
        <span className="text-gray-600 mx-1">›</span>
        <span className="text-gray-200 font-medium">{L[page]||page}</span>
      </div>
      {user.role==='admin'&&(
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs" style={{background:'rgba(124,58,237,.1)',border:'1px solid rgba(124,58,237,.2)'}}>
          <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" style={{boxShadow:'0 0 6px #4ade80'}}/>
          <span className="font-mono text-gray-300">Block #{block.toLocaleString()}</span>
          <span className="text-gray-600">·</span>
          <span className="text-purple-400">3,482 TPS · Hyperledger Fabric</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer text-gray-400 hover:text-white transition-colors text-xl">
          🔔<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">{notifs}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}}>{user.name[0]}</div>
          <div>
            <div className="text-sm font-medium text-white leading-tight">{user.name}</div>
            <Badge type={user.role==='admin'?'Admin':'Student'} text={user.role==='admin'?'Admin':'Student'}/>
          </div>
        </div>
        <button onClick={onLogout} className="btn-s px-3 py-1.5 rounded-lg text-xs text-gray-400">Logout</button>
      </div>
    </div>
  );};
