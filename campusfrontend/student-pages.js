var MyWalletPage=({user,users,setUsers,txns,toast,block})=>{
  var [realBalance, setRealBalance] = useState('0');
  var me=users.find(u=>u.id===user.id)||users[1];
  
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (!user.walletAddress) {
            console.log("⚠️ No walletAddress for current user");
            return;
        }
        const provider = CampusAPI.getProvider();
        if (!provider) return;
        const contract = CampusAPI.getContract('CampusCoin', provider);
        const bal = await contract.balanceOf(user.walletAddress);
        setRealBalance(ethers.utils.formatUnits(bal, 18).split('.')[0]); 
      } catch (e) { console.error("Balance fetch error:", e); }
    };
    fetchBalance();
  }, [user.walletAddress, block]);

  var [modal,setModal]=useState(null);
  var [topForm,setTopForm]=useState({amount:'',upi:''});
  var myTxns=txns.filter(t=>t.sname===me.name);
  var tip=useMemo(()=>rnd(AI_TIPS),[]);
  var topUp=async ()=>{
    var amt=Number(topForm.amount);if(!amt||amt<=0)return;
    // In a real app, this would trigger a payment gateway and THEN update backend
    try {
      const res = await CampusAPI.updateUser(me.id, { balance: me.balance + amt });
      if (res.error) throw new Error(res.error);
      setUsers(prev=>prev.map(u=>u.id===me.id?{...u,balance:u.balance+amt}:u));
      toast('success','Top-Up Successful!',`${fmtINR(amt)} added to your wallet`);
      setTopForm({amount:'',upi:''});setModal(null);
    } catch (err) { toast('error', 'Top-Up Failed', err.message); }
  };
  return(
    <div className="p-6 space-y-6">
      <div className="glass rounded-3xl p-8 text-center glow-p" style={{border:'1px solid rgba(124,58,237,.4)'}}>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">CampusCoin Balance</div>
        <div className="text-5xl font-bold text-white font-mono mb-1">{fmtINR(realBalance)}</div>
        <div className="text-sm text-purple-400 mb-6">≈ {realBalance} CampusCoin</div>
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

var MyFeesPage=({user,users,setUsers,fees,setFees,addTxn,addAudit,toast})=>{
  var me=users.find(u=>u.id===user.id)||users[1];
  var myFees=fees.filter(f=>f.sid===me.id);
  var pending=myFees.filter(f=>f.status==='Pending');
  var confirmed=myFees.filter(f=>f.status==='Confirmed');
  var pay = async f => {
    try {
      const addr = await CampusAPI.connectWallet();
      const provider = CampusAPI.getProvider();
      const signer = provider.getSigner();

      toast('info', 'Blockchain', 'Requesting Approval...');
      const coin = CampusAPI.getContract('CampusCoin', signer);
      const approveTx = await coin.approve(CONTRACTS.FeePayment.address, ethers.utils.parseUnits(f.amount.toString(), 18));
      await approveTx.wait();

      toast('info', 'Blockchain', 'Processing Payment...');
      const feeContract = CampusAPI.getContract('FeePayment', signer);
      const payTx = await feeContract.payFee(f.id, ethers.utils.formatBytes32String(genHash().substr(0,10)));
      await payTx.wait();

      // Update Backend
      await CampusAPI.updateFee(f.id, { status: 'Confirmed', paidAt: new Date().toISOString(), txHash: payTx.hash });
      
      setFees(prev=>prev.map(x=>x.id===f.id?{...x,status:'Confirmed',txHash:payTx.hash,paidAt:fmtNow()}:x));
      addTxn({type:'FEE_PAYMENT',sname:me.name,amount:f.amount,service:f.cat,status:'CONFIRMED'});
      addAudit('FEE_PAID',me.name,`Paid ${f.cat} fee on-chain: ${fmtINR(f.amount)}`);
      toast('success','Payment Successful!',`Confirmed on-chain · Tx: ${payTx.hash.substr(0,10)}...`);
    } catch (err) {
      console.error(err);
      toast('error','Payment Failed', err.message.includes('user rejected') ? 'Transaction rejected' : err.message);
    }
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

var EventsTicketsPage=({user,users,setUsers,events,setEvents,nfts,setNfts,addTxn,addAudit,toast})=>{
  var me=users.find(u=>u.id===user.id)||users[1];
  var myTickets=nfts.filter(n=>n.sid===me.id);
  var [rec,setRec]=useState('');
  var buy = async ev => {
    try {
      const addr = await CampusAPI.connectWallet();
      const provider = CampusAPI.getProvider();
      const signer = provider.getSigner();

      if (myTickets.find(t => t.eid === ev.id)) {
        toast('warning', 'Already Purchased', 'You own a ticket for this event');
        return;
      }

      toast('info', 'Blockchain', 'Requesting Approval...');
      const coin = CampusAPI.getContract('CampusCoin', signer);
      const approveTx = await coin.approve(CONTRACTS.EventTicket.address, ethers.utils.parseUnits(ev.price.toString(), 18));
      await approveTx.wait();

      toast('info', 'Blockchain', 'Minting Ticket NFT...');
      const ticketContract = CampusAPI.getContract('EventTicket', signer);
      const seat = 'S-' + Math.floor(Math.random() * 200 + 1);
      const mintTx = await ticketContract.mintTicket(user.wallet, ev.id, seat);
      await mintTx.wait();

      const token = 'TKT-' + genHash().substr(2, 6);
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, sold: e.sold + 1 } : e));
      setNfts(prev => [...prev, { id: 'NFT-' + String(nextId(prev)).padStart(3, '0'), sid: me.id, sname: me.name, eid: ev.id, ename: ev.name, seat, ts: fmtNow(), token, txHash: mintTx.hash }]);
      addTxn({ type: 'TOKEN_MINT', sname: me.name, amount: ev.price, service: 'Event Ticket', status: 'CONFIRMED' });
      addAudit('TICKET_PURCHASED', me.name, `Bought ticket for ${ev.name} on-chain`);
      toast('success', 'Ticket Purchased!', `NFT Minted · Tx: ${mintTx.hash.substr(0,10)}...`);
    } catch (err) {
      console.error(err);
      toast('error', 'Purchase Failed', err.message.includes('user rejected') ? 'Transaction rejected' : err.message);
    }
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
              {owned?<div className="text-xs text-green-400 text-center py-2 rounded-lg bg-green-500/10 border border-green-500/20">✅ You own: {owned.token}</div>:<BtnP onClick={()=>buy(ev)} cls="w-full text-center" >{ev.price===0?'🎟 Get Free Ticket':'💳 Buy Ticket'}</BtnP>}
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

var P2PTransferPage=({user,users,setUsers,addTxn,addAudit,policies,toast})=>{
  var me=users.find(u=>u.id===user.id)||users[1];
  var students=users.filter(u=>u.role==='Student'&&u.id!==me.id&&u.status==='Active');
  var [form,setForm]=useState({rid:'',amount:'',note:''});
  var [ledger,setLedger]=useState([]);
  var [tab,setTab]=useState('Send');
  var limit=policies.find(p=>p.id===2);
  var send = async () => {
    var amt = Number(form.amount); var rec = users.find(u => u.id === Number(form.rid));
    if (!rec || !amt || amt <= 0) { toast('error', 'Invalid Transfer', 'Check recipient and amount'); return; }
    if (limit?.enabled && amt > limit.val) { toast('warning', 'Limit Exceeded', `Max P2P: ${fmtINR(limit.val)}`); return; }

    try {
      const addr = await CampusAPI.connectWallet();
      const provider = CampusAPI.getProvider();
      const signer = provider.getSigner();

      toast('info', 'Blockchain', 'Sending CampusCoins...');
      const coin = CampusAPI.getContract('CampusCoin', signer);
      const tx = await coin.transfer(rec.wallet, ethers.utils.parseUnits(amt.toString(), 18));
      await tx.wait();

      // Update local state and audit
      var entry = { id: nextId(ledger), from: me.name, to: rec.name, amount: amt, note: form.note, ts: fmtNow(), hash: tx.hash };
      setLedger(prev => [...prev, entry]);
      addTxn({ type: 'P2P_XFER', sname: me.name, amount: amt, service: 'P2P', status: 'CONFIRMED', hash: tx.hash });
      addAudit('P2P_TRANSFER', me.name, `Transfer ${fmtINR(amt)} to ${rec.name} on-chain`);
      toast('success', 'Transfer Successful!', `Tx: ${tx.hash.substr(0,10)}...`);
      setForm({ rid: '', amount: '', note: '' });
    } catch (err) {
      console.error(err);
      toast('error', 'Transfer Failed', err.message.includes('user rejected') ? 'Transaction rejected' : err.message);
    }
  };
  var sent=ledger.filter(l=>l.from===me.name);
  var received=ledger.filter(l=>l.to===me.name);
  return(
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">P2P Transfer</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 glass rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Send Money</h3>
          <div><Lbl>Recipient</Lbl><Sel value={form.rid} onChange={e=>setForm(p=>({...p,rid:e.target.value}))}><option value="">-- Select Student --</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Sel></div>
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

var MyProfilePage=({user,users,txns,fees,nfts})=>{
  var me=users.find(u=>u.id===user.id)||users[1];
  var [copied,setCopied]=useState(false);
  var copyWallet=()=>{navigator.clipboard?.writeText(me.walletAddress).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);};
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
          <div className="text-right"><div className="text-xs text-gray-500 mb-1">CampusCoin Balance</div><div className="text-2xl font-bold font-mono text-white">{fmtINR(realBalance)}</div></div>
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Wallet Address</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}>
          <span className="font-mono text-purple-300 text-sm flex-1 break-all">{me.walletAddress}</span>
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
