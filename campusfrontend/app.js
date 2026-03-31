var App=()=>{
  var [user,setUser]=useState(null);
  var [page,setPage]=useState('overview');
  var [collapsed,setCollapsed]=useState(false);
  var [isLoaded,setIsLoaded]=useState(false);
  var [dbError,setDbError]=useState(null);

  // Initialize with empty arrays instead of hardcoded data
  var [users,setUsers]=useState([]);
  var [fees,setFees]=useState([]);
  var [events,setEvents]=useState([]);
  var [txns,setTxns]=useState([]);
  var [disputes,setDisputes]=useState([]);
  var [policies,setPolicies]=useState([]);
  var [auditLog,setAuditLog]=useState([]);
  var [nfts,setNfts]=useState([]);
  var [toasts,setToasts]=useState([]);
  var [block,setBlock]=useState(2847392);
  var [liveEvents,setLiveEvents]=useState([]);

  // Fetch data from real API
  useEffect(()=>{
    const fetchData = async () => {
        try {
            await CampusAPI.init(); // Load contract addresses first
            const [u, f, e, t, d, p] = await Promise.all([
                CampusAPI.getUsers(),
                CampusAPI.getFees(),
                CampusAPI.getEvents(),
                CampusAPI.getTransactions(),
                // Disputes and Audit are part of the endpoints
                fetch('http://localhost:5000/api/disputes').then(r => r.json()),
                CampusAPI.getTransactions() // Audit log is essentially transactional or separate
            ]);

            setUsers(u || []);
            setFees(f || []);
            setEvents(e || []);
            setTxns(t || []);
            setDisputes(d || []);
            // Policies fetch
            fetch('http://localhost:5000/api/policies').then(r => r.json()).then(setPolicies);
            
            setIsLoaded(true);
        } catch (err) {
            console.error("API fetch failed:", err);
            setDbError(err.message);
        }
    };
    fetchData();
  },[]);

  // Real Blockchain block number
  useEffect(()=>{
    if(!isLoaded) return;
    const updateBlock = async () => {
        try {
            const b = await CampusAPI.getBlockNumber();
            if (b) setBlock(b);
        } catch (e) {}
    };
    updateBlock();
    var t=setInterval(updateBlock, 5000);
    return()=>clearInterval(t);
  },[isLoaded]);

  useEffect(()=>{
    if(!isLoaded) return;
    var t=setInterval(()=>{
      var type=rnd(EVT_TYPES);
      var desc=rnd(EVT_DESCS[type]);
      setLiveEvents(prev=>[...prev.slice(-20),{type,desc,block:block+Math.floor(Math.random()*2),ts:fmtNow()}]);
    },6000);
    return()=>clearInterval(t);
  },[block, isLoaded]);

  var toast=useCallback((type,title,msg)=>{
    var id=Date.now();
    setToasts(prev=>[...prev,{id,type,title,msg}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),3500);
  },[]);

  var addAudit=useCallback((action,actor,detail)=>{
    var entry={id:Date.now(),ts:fmtNow(),block,action,actor,detail,hash:genHash()};
    setAuditLog(prev=>[...prev,entry]);
  },[block]);

  var addTxn=useCallback((t)=>{
    var entry={id:Date.now(),hash:genHash(),type:t.type,sname:t.sname,amount:t.amount,service:t.service,status:t.status,ts:fmtNow(),block};
    setTxns(prev=>[...prev,entry]);
  },[block]);

  var login=useCallback(u=>{
    setUser(u);
    // Extremely robust role check: handles casing, spacing, and specific admin emails
    const roleStr = String(u.role || '').trim().toLowerCase();
    const isAdmin = roleStr === 'admin' || u.email === 'meera@mitadt.edu';
    
    setPage(isAdmin ? 'overview' : 'my-wallet');
    toast('success', `Welcome, ${u.name}!`, isAdmin ? 'Admin Dashboard' : 'Student Dashboard');
  },[]);

  var logout=useCallback(()=>{setUser(null);setPage('overview');},[]);

  // IF FETCH FAILED DUE TO CORS (Local File Execution)
  if(dbError) {
    return(
      <div className="flex h-screen w-screen items-center justify-center p-6 text-center" style={{background:'#0a0a0f',color:'white'}}>
        <div className="glass rounded-2xl p-8 max-w-lg glow-r">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">CORS / Protocol Error</h2>
          <p className="text-sm text-gray-400 mb-6">Because we are now fetching data securely from `database.json`, you cannot double-click the HTML file to open it. Browsers block local file fetching.</p>
          <div className="text-left text-xs bg-black/50 p-4 rounded-xl font-mono text-gray-300">
            Please use a local web server.<br/><br/>
            If you are using VS Code:<br/>
            1. Install the "Live Server" extension.<br/>
            2. Right click index.html and select "Open with Live Server".
          </div>
        </div>
      </div>
    );
  }

  // IF STILL LOADING THE FETCH
  if(!isLoaded){
    return(
      <div className="flex flex-col h-screen w-screen items-center justify-center" style={{background:'#0a0a0f',color:'white'}}>
        <div style={{animation:'spin 1s linear infinite'}} className="text-4xl mb-4">⛓</div>
        <div className="text-sm text-gray-400">Loading Database...</div>
      </div>
    );
  }

  if(!user){
    return(
      <div style={{position:'fixed',inset:0,overflow:'hidden'}}>
        <LoginScreen onLogin={login}/>
        <Toast toasts={toasts}/>
      </div>
    );
  }

  var sharedProps={user,users,setUsers,fees,setFees,events,setEvents,txns,addTxn,disputes,setDisputes,policies,setPolicies,auditLog,setAuditLog,nfts,setNfts,addAudit,toast};

  var adminPage=()=>{
    switch(page){
      case 'overview': return <AdminOverviewPage txns={txns} liveEvents={liveEvents} addAudit={addAudit}/>;
      case 'fee-portal': return <AdminFeePortalPage user={user} fees={fees} setFees={setFees} users={users} addAudit={addAudit} addTxn={addTxn} toast={toast}/>;
      case 'event-tickets': return <AdminEventsPage user={user} events={events} setEvents={setEvents} users={users} nfts={nfts} setNfts={setNfts} addAudit={addAudit} addTxn={addTxn} toast={toast}/>;
      case 'p2p-transactions': return <AdminP2PPage txns={txns}/>;
      case 'disputes': return <AdminDisputesPage user={user} disputes={disputes} setDisputes={setDisputes} addAudit={addAudit} toast={toast}/>;
      case 'users-roles': return <AdminUsersPage user={user} users={users} setUsers={setUsers} addAudit={addAudit} toast={toast}/>;
      case 'policy-config': return <AdminPolicyPage user={user} policies={policies} setPolicies={setPolicies} addAudit={addAudit} toast={toast}/>;
      case 'audit-trail': return <AdminAuditPage auditLog={auditLog}/>;
      default: return <AdminOverviewPage txns={txns} liveEvents={liveEvents} addAudit={addAudit}/>;
    }
  };

  var studentPage=()=>{
    switch(page){
      case 'my-wallet': return <StudentWalletPage user={user} users={users} setUsers={setUsers} txns={txns} toast={toast} block={block}/>;
      case 'my-fees': return <StudentFeesPage user={user} users={users} setUsers={setUsers} fees={fees} setFees={setFees} addTxn={addTxn} addAudit={addAudit} toast={toast} block={block}/>;
      case 'events-tickets': return <StudentEventsPage user={user} users={users} setUsers={setUsers} events={events} setEvents={setEvents} nfts={nfts} setNfts={setNfts} addTxn={addTxn} addAudit={addAudit} toast={toast} block={block}/>;
      case 'p2p-transfer': return <StudentP2PPage user={user} users={users} setUsers={setUsers} txns={txns} toast={toast} block={block} policies={policies}/>;
      case 'my-profile': return <StudentProfilePage user={user} users={users} txns={txns} fees={fees} nfts={nfts}/>;
      default: return <StudentWalletPage user={user} users={users} setUsers={setUsers} txns={txns} toast={toast} block={block}/>;
    }
  };

  return(
    <div style={{position:'fixed',inset:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <TopBar user={user} page={page} block={block} onLogout={logout} notifs={disputes.filter(d=>d.status==='Open').length}/>
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <Sidebar role={user.role} users={users} page={page} setPage={setPage} disputes={disputes} fees={fees} collapsed={collapsed} setCollapsed={setCollapsed}/>
        <div className="flex-1 scroll" style={{background:'#0a0a0f'}}>
          {String(user.role || '').toLowerCase().includes('admin')?adminPage():studentPage()}
        </div>
      </div>
      <Toast toasts={toasts}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
