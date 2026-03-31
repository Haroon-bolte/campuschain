var StudentWalletPage=({user,users,setUsers,txns,toast,block})=>{
  // Robust lookup
  var me=users.find(u=>isSelf(u,user))||user;
  var [modal,setModal]=useState(null);
  var [topForm,setTopForm]=useState({amount:'',upi:''});
  var myTxns=txns.filter(t=>t.sname===me.name);
  var tip=useMemo(()=>rnd(AI_TIPS),[]);
  var topUp=()=>{
    var amt=Number(topForm.amount);if(!amt||amt<=0)return;
    setUsers(prev=>prev.map(u=>u.id===me.id?{...u,balance:u.balance+amt}:u));
    toast('success','Top-Up Successful!',`${fmtINR(amt)} added to your wallet`);
    setTopForm({amount:'',upi:''});setModal(null);
  };
  return(
    <div className="p-6 space-y-6">
      <div className="glass rounded-3xl p-8 text-center glow-p" style={{border:'1px solid rgba(124,58,237,.4)'}}>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">CampusCoin Balance</div>
        <div className="text-5xl font-bold text-white font-mono mb-1">{fmtINR(me.balance)}</div>
        <div className="text-sm text-purple-400 mb-6">≈ {me.balance} CampusCoin</div>
        <BtnP onClick={()=>setModal('topup')} cls="px-8">💳 Top-Up via UPI</BtnP>
      </div>
      <div className="glass rounded-2xl p-5" style={{border:'1px solid rgba(13,148,136,.3)'}}>
        <div className="flex items-start gap-3"><span className="text-2xl">🤖</span><div><div className="text-xs text-teal-400 uppercase tracking-wider mb-1">AI Spending Tip</div><div className="text-sm text-gray-300 leading-relaxed">{tip}</div></div></div>
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Transaction History</h3>
        <div className="space-y-3 scroll" style={{maxHeight:300}}>
          {myTxns.length===0&&<div className="text-center text-gray-500 py-8">No transactions yet</div>}
          {myTxns.slice().reverse().map((t,i)=>(
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{background:t.type==='FEE_PAYMENT'?'rgba(37,99,235,.2)':'rgba(124,58,237,.2)'}}>{t.type==='FEE_PAYMENT'?'💳':'💸'}</div>
                <div><div className="text-sm text-white">{t.service}</div><div className="text-xs text-gray-500">{t.ts}</div></div>
              </div>
              <div className={`font-mono font-semibold ${t.type==='P2P_XFER'&&t.sname!==me.name?'text-green-400':'text-red-400'}`}>
                {t.type==='P2P_XFER'&&t.sname!==me.name?'+':'-'}{fmtINR(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={modal==='topup'} onClose={()=>setModal(null)} title="💳 Top-Up via UPI">
        <div className="space-y-4">
          <div><Lbl>Amount (₹)</Lbl><Inp type="number" value={topForm.amount} onChange={e=>setTopForm(p=>({...p,amount:e.target.value}))} placeholder="1000"/></div>
          <div><Lbl>UPI ID</Lbl><Inp value={topForm.upi} onChange={e=>setTopForm(p=>({...p,upi:e.target.value}))} placeholder="rahul@upi"/></div>
          <div className="flex gap-2 pt-2"><BtnP onClick={topUp}>✅ Confirm Top-Up</BtnP><BtnS onClick={()=>setModal(null)}>Cancel</BtnS></div>
        </div>
      </Modal>
    </div>
  );};

var StudentFeesPage=({user,users,setUsers,fees,setFees,addTxn,addAudit,toast,block})=>{
  var me=users.find(u=>isSelf(u,user))||user;
  var myFees=fees.filter(f=>isMatch(f.sid,me));
  var pending=myFees.filter(f=>f.status==='Pending');
  var confirmed=myFees.filter(f=>f.status==='Confirmed');
  var pay=f=>{
    if(me.balance<f.amount){toast('error','Insufficient Balance',`Need ${fmtINR(f.amount)}, have ${fmtINR(me.balance)}`);return;}
    toast('info','Blockchain','Broadcasting transaction to CampusChain...');
    setTimeout(()=>{
      var hash=genHash();
      toast('info','Blockchain','Confirming on-chain... Block #'+(block+1));
      setTimeout(()=>{
        setUsers(prev=>prev.map(u=>isMatch(u,me)?{...u,balance:u.balance-f.amount}:u));
        setFees(prev=>prev.map(x=>isMatch(x,f)?{...x,status:'Confirmed',txHash:hash,paidAt:fmtNow()}:x));
        addTxn({type:'FEE_PAYMENT',sname:me.name,amount:f.amount,service:f.cat,status:'CONFIRMED'});
        addAudit('FEE_PAID',me.name,`Paid ${f.cat} fee on-chain: ${fmtINR(f.amount)}`);
        toast('success','Payment Confirmed!',`On-chain Tx: ${hash.substr(0,14)}...`);
      },1200);
    },800);
  };
  return(
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">My Fees</h2>
      {pending.length>0&&(
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Upcoming Dues</h3>
          <div className="grid grid-cols-2 gap-4">
            {pending.map(f=>{
              var days=daysUntil(f.due);
              return(
                <div key={f.id} className="glass rounded-2xl p-5 space-y-3" style={{border:`1px solid ${days<7?'rgba(225,29,72,.3)':'rgba(255,255,255,.1)'}`}}>
                  <div className="flex justify-between"><div className="font-medium text-white">{f.cat}</div><span className={`text-xs font-medium ${days<7?'text-red-400':days<14?'text-yellow-400':'text-gray-400'}`}>{days>0?`${days}d left`:'Overdue!'}</span></div>
                  <div className="text-2xl font-bold font-mono text-white">{fmtINR(f.amount)}</div>
                  <div className="text-xs text-gray-500">Due: {f.due}</div>
                  <BtnP onClick={()=>pay(f)} cls="w-full text-center">💳 Pay Now</BtnP>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {confirmed.length>0&&(
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Payment History</h3>
          <div className="glass rounded-2xl p-5">
            <table className="w-full">
              <thead><tr>{['Category','Amount','Paid On','Tx Hash','Status'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>{confirmed.map(f=>(<tr key={f.id} className="border-t border-white/5 tr"><Td>{f.cat}</Td><Td><span className="font-mono">{fmtINR(f.amount)}</span></Td><Td className="text-xs">{f.paidAt}</Td><Td><span className="font-mono text-purple-400 text-xs">{f.txHash}</span></Td><Td><Badge type="CONFIRMED" text="CONFIRMED"/></Td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );};

var StudentEventsPage=({user,users,setUsers,events,setEvents,nfts,setNfts,addTxn,addAudit,toast,block})=>{
  var me=users.find(u=>isSelf(u,user))||user;
  var myTickets=nfts.filter(n=>isMatch(n.sid,me));
  var [rec,setRec]=useState('');
  var buy=ev=>{
    if(me.balance<ev.price){toast('error','Insufficient Balance',`Need ${fmtINR(ev.price)}`);return;}
    if(myTickets.find(t=>t.eid===ev.id)){toast('warning','Already Purchased','You own a ticket for this event');return;}
    toast('info','Blockchain','Minting NFT ticket on CampusChain...');
    setTimeout(()=>{
      var token='TKT-'+genHash().substr(2,6);
      var seat='S-'+Math.floor(Math.random()*200+1);
      var hash=genHash();
      toast('info','Blockchain','Confirming mint... Block #'+(block+1));
      setTimeout(()=>{
        setUsers(prev=>prev.map(u=>u.id===me.id?{...u,balance:u.balance-ev.price}:u));
        setEvents(prev=>prev.map(e=>e.id===ev.id?{...e,sold:e.sold+1}:e));
        setNfts(prev=>[...prev,{id:'NFT-'+String(nextId(prev)).padStart(3,'0'),sid:me.id,sname:me.name,eid:ev.id,ename:ev.name,seat,ts:fmtNow(),token,txHash:hash}]);
        addTxn({type:'TOKEN_MINT',sname:me.name,amount:ev.price,service:'Event Ticket',status:'CONFIRMED'});
        addAudit('TICKET_PURCHASED',me.name,`Minted NFT ticket for ${ev.name}`);
        toast('success','NFT Ticket Minted!',`Token: ${token} · Seat: ${seat} · Tx: ${hash.substr(0,10)}...`);
      },1200);
    },800);
  };
  return(
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Events & Tickets</h2>
        <BtnS onClick={()=>setRec(rnd(AI_RECS))}>🤖 AI Recommend</BtnS>
      </div>
      {rec&&<div className="glass rounded-xl p-4 flex gap-3" style={{border:'1px solid rgba(13,148,136,.3)'}}><span className="text-xl">🤖</span><div><div className="text-xs text-teal-400 mb-1">AI Recommendation</div><div className="text-sm text-gray-300">{rec}</div></div></div>}
      <div className="grid grid-cols-2 gap-4">
        {events.map(ev=>{
          var owned=myTickets.find(t=>t.eid===ev.id);
          return(
            <div key={ev.id} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex justify-between"><div className="font-medium text-white">{ev.name}</div><Badge type={ev.status} text={ev.status}/></div>
              <div className="text-xs text-gray-500">📅 {ev.date} · 📍 {ev.venue}</div>
              <div className="text-sm text-gray-400">{ev.desc}</div>
              <div className="flex justify-between text-sm"><span className="text-white font-mono font-bold">{ev.price===0?'Free':fmtINR(ev.price)}</span><span className="text-gray-400">{ev.cap-ev.sold} seats left</span></div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min((ev.sold/ev.cap)*100,100)}%`,background:'linear-gradient(90deg,#7c3aed,#2563eb)'}}/></div>
              {owned ? (
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center gap-2 text-xs text-green-400 font-medium">
                  ✔ You own: {owned.token}
                </div>
              ) : <BtnP onClick={()=>buy(ev)} cls="w-full text-center" >{ev.price===0?'🎟 Get Free Ticket':'💳 Buy Ticket'}</BtnP>}
            </div>
          );
        })}
      </div>
      {myTickets.length>0&&(
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">My NFT Tickets</h3>
          <div className="grid grid-cols-2 gap-3">
            {myTickets.map(t=>(
              <div key={t.id} className="rounded-xl p-4" style={{background:'rgba(124,58,237,.1)',border:'1px solid rgba(124,58,237,.3)'}}>
                <div className="flex justify-between items-start mb-2"><div className="font-medium text-white text-sm">{t.ename}</div><Badge type="MINTED" text="NFT"/></div>
                <div className="font-mono text-xs text-purple-300">{t.token}</div>
                <div className="text-xs text-gray-500 mt-1">Seat: {t.seat} · {t.ts}</div>
                <div className="mt-2 rounded-lg bg-white/5 flex items-center justify-center" style={{height:60}}><span className="text-gray-600 text-xs">▦ QR Placeholder</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );};
var StudentP2PPage=({user,users,setUsers,txns,toast,block,policies})=>{
  var me=users.find(u=>isSelf(u,user))||user;
  var students=users.filter(u=>{
    var isOther = !isMatch(u,me);
    var isStudent = u.role==='Student';
    var notSuspended = u.status !== 'Suspended';
    return isStudent && isOther && notSuspended;
  });
  var [form,setForm]=useState({rid:'',amount:'',note:''});
  var [ledger,setLedger]=useState([]);
  var [tab,setTab]=useState('Send');
  var limit=policies.find(p=>p.id===2);
  var send=()=>{
    var amt=Number(form.amount);
    // Match by string comparison to handle both MongoDB _id and numeric ids
    var rec=users.find(u=>String(u._id||u.id)===String(form.rid));
    if(!rec||!amt||amt<=0){toast('error','Invalid Transfer','Check recipient and amount');return;}
    if(limit?.enabled&&amt>limit.val){toast('warning','Limit Exceeded',`Max P2P: ${fmtINR(limit.val)}`);return;}
    if(me.balance<amt){toast('error','Insufficient Balance',fmtINR(me.balance));return;}
    toast('info','Blockchain','Broadcasting P2P transfer...');
    setTimeout(()=>{
      var hash=genHash();
      var meKey=String(me._id||me.id);
      var recKey=String(rec._id||rec.id);
      setUsers(prev=>prev.map(u=>{
        var uKey=String(u._id||u.id);
        if(uKey===meKey) return {...u,balance:(u.balance||0)-amt};
        if(uKey===recKey) return {...u,balance:(u.balance||0)+amt};
        return u;
      }));
      var entry={id:nextId(ledger),from:me.name,to:rec.name,amount:amt,note:form.note,ts:fmtNow(),hash};
      setLedger(prev=>[...prev,entry]);
      addTxn({type:'P2P_XFER',sname:me.name,amount:amt,service:'P2P',status:'CONFIRMED'});
      addAudit('P2P_TRANSFER',me.name,`Transfer ${fmtINR(amt)} to ${rec.name} on-chain`);
      toast('success','Transfer Confirmed!',`${fmtINR(amt)} → ${rec.name} · Tx: ${hash.substr(0,10)}...`);
      setForm({rid:'',amount:'',note:''});
    },1500);
  };
  var sent=ledger.filter(l=>l.from===me.name);
  var received=ledger.filter(l=>l.to===me.name);
  return(
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">P2P Transfer</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 glass rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Send Money</h3>
          <div><Lbl>Recipient</Lbl><Sel value={form.rid} onChange={e=>setForm(p=>({...p,rid:e.target.value}))}><option value="">-- Select Student --</option>{students.map(s=>{var sk=String(s._id||s.id);return <option key={sk} value={sk}>{s.name}</option>;})}</Sel></div>
          <div><Lbl>Amount (₹)</Lbl><Inp type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="500"/></div>
          {limit?.enabled&&Number(form.amount)>limit.val&&<div className="text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">⚠️ Exceeds policy limit of {fmtINR(limit.val)}</div>}
          <div><Lbl>Note (optional)</Lbl><Inp value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Lunch split"/></div>
          <BtnP onClick={send} cls="w-full text-center">💸 Send Money</BtnP>
          <div className="text-xs text-gray-500 text-center">Your balance: <span className="text-white font-mono">{fmtINR(me.balance)}</span></div>
        </div>
        <div className="col-span-2 glass rounded-2xl p-5">
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{background:'rgba(255,255,255,.05)'}}>
            {['Send','Received'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'text-white':'text-gray-500'}`} style={tab===t?{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}:{}}>{t} ({t==='Send'?sent.length:received.length})</button>)}
          </div>
          <div className="space-y-3 scroll" style={{maxHeight:300}}>
            {(tab==='Send'?sent:received).length===0&&<div className="text-center text-gray-500 py-8">No transfers yet</div>}
            {(tab==='Send'?sent:received).slice().reverse().map((l,i)=>(
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                <div><div className="text-sm text-white">{tab==='Send'?`To: ${l.to}`:`From: ${l.from}`}</div><div className="text-xs text-gray-500">{l.note||'No note'} · {l.ts}</div></div>
                <div className={`font-mono font-semibold ${tab==='Send'?'text-red-400':'text-green-400'}`}>{tab==='Send'?'-':'+'}{fmtINR(l.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );};

var StudentProfilePage=({user,users,txns,fees,nfts})=>{
  var me=users.find(u=>isSelf(u,user))||user;
  var [copied,setCopied]=useState(false);
  var copyWallet=()=>{navigator.clipboard?.writeText(me.wallet).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);};
  var myTxns=txns.filter(t=>t.sname===me.name).length;
  var myFees=fees.filter(f=>f.sid===me.id&&f.status==='Confirmed').length;
  var myTickets=nfts.filter(n=>n.sid===me.id).length;
  return(
    <div className="p-6 space-y-5">
      <div className="glass rounded-3xl p-8" style={{border:'1px solid rgba(124,58,237,.3)'}}>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shrink-0" style={{background:'linear-gradient(135deg,#7c3aed,#2563eb)',boxShadow:'0 0 30px rgba(124,58,237,.4)'}}>{me.name[0]}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{me.name}</h2>
            <div className="flex items-center gap-2 mt-1"><Badge type={me.role} text={me.role}/>{me.rollNo&&<span className="text-xs text-gray-500">{me.rollNo}</span>}</div>
            <div className="text-sm text-gray-400 mt-1">{me.dept}{me.sem?` · Semester ${me.sem}`:''}</div>
          </div>
          <div className="text-right"><div className="text-xs text-gray-500 mb-1">CampusCoin Balance</div><div className="text-2xl font-bold font-mono text-white">{fmtINR(me.balance)}</div></div>
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Wallet Address</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}>
          <span className="font-mono text-purple-300 text-sm flex-1 break-all">{me.wallet}</span>
          <button onClick={copyWallet} className="text-xs shrink-0 px-3 py-1.5 rounded-lg transition-all" style={{background:'rgba(124,58,237,.2)',border:'1px solid rgba(124,58,237,.3)',color:copied?'#4ade80':'#a78bfa'}}>{copied?'✅ Copied':'📋 Copy'}</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[{label:'Transactions',val:myTxns,icon:'⚡'},{label:'Fees Paid',val:myFees,icon:'💳'},{label:'Events',val:myTickets,icon:'🎫'},{label:'P2P Sent',val:0,icon:'💸'}].map((s,i)=>(
          <div key={i} className="glass rounded-xl p-4 text-center"><div className="text-2xl mb-1">{s.icon}</div><div className="text-xl font-bold text-white">{s.val}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Academic Info</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['Department',me.dept||'N/A'],['Roll Number',me.rollNo||'N/A'],['Semester',me.sem?`Semester ${me.sem}`:'N/A'],['Status',me.status]].map(([k,v])=>(
            <div key={k} className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-500">{k}</span><span className="text-white">{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );};
