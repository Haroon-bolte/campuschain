var {useState,useEffect,useRef,useMemo,useCallback}=React;

var Badge=({type,text})=>{
  var t=text||type;
  var m={CONFIRMED:'bg-green-500/20 text-green-400 border-green-500/30',PENDING:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',FAILED:'bg-red-500/20 text-red-400 border-red-500/30',MINTED:'bg-purple-500/20 text-purple-400 border-purple-500/30',Active:'bg-green-500/20 text-green-400 border-green-500/30',Suspended:'bg-red-500/20 text-red-400 border-red-500/30',Admin:'bg-purple-500/20 text-purple-400 border-purple-500/30',Student:'bg-blue-500/20 text-blue-400 border-blue-500/30',Faculty:'bg-teal-500/20 text-teal-400 border-teal-500/30',HIGH:'bg-red-500/20 text-red-400 border-red-500/30',MED:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',LOW:'bg-green-500/20 text-green-400 border-green-500/30',Open:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',Resolved:'bg-green-500/20 text-green-400 border-green-500/30',FEE_PAYMENT:'bg-blue-500/20 text-blue-400 border-blue-500/30',TOKEN_MINT:'bg-purple-500/20 text-purple-400 border-purple-500/30',SMART_CTR:'bg-rose-500/20 text-rose-400 border-rose-500/30',P2P_XFER:'bg-teal-500/20 text-teal-400 border-teal-500/30',ADMIN_ACL:'bg-orange-500/20 text-orange-400 border-orange-500/30'};
  var cls=m[t]||'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{t}</span>;
};

var Toast=({toasts})=>(
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map(t=>(
      <div key={t.id} className={`toast-anim glass rounded-xl px-4 py-3 flex items-center gap-3 min-w-72 shadow-2xl border ${t.type==='success'?'border-green-500/40 bg-green-500/10':t.type==='error'?'border-red-500/40 bg-red-500/10':t.type==='warning'?'border-yellow-500/40 bg-yellow-500/10':'border-blue-500/40 bg-blue-500/10'}`}>
        <span className="text-lg">{t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warning'?'⚠️':'ℹ️'}</span>
        <div><div className="text-sm font-medium text-white">{t.title}</div>{t.msg&&<div className="text-xs text-gray-400 mt-0.5">{t.msg}</div>}</div>
      </div>
    ))}
  </div>
);

var Modal=({open,onClose,title,children,wide})=>{
  if(!open)return null;
  return(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,.75)',backdropFilter:'blur(4px)'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className={`modal-anim glass rounded-2xl ${wide?'w-full max-w-2xl':'w-full max-w-lg'}`} style={{border:'1px solid rgba(124,58,237,.3)',maxHeight:'85vh',overflowY:'auto',overflowX:'hidden'}}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition-colors">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );};

var Sparkline=({data,color})=>{
  var h=40,w=100,min=Math.min(...data),max=Math.max(...data),r=max-min||1;
  var pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/r)*h}`).join(' ');
  return(<svg width={w} height={h} className="opacity-70"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
};

var useCounter=(target,dur=1200)=>{
  var [v,setV]=useState(0);
  useEffect(()=>{var s=0,step=target/(dur/16);var t=setInterval(()=>{s+=step;if(s>=target){setV(target);clearInterval(t);}else setV(Math.floor(s));},16);return()=>clearInterval(t);},[target]);
  return v;
};

var MetricCard=({title,value,pre='',suf='',delta,icon,glow,bdr,sparkData,sparkColor})=>{
  var c=useCounter(value);
  return(
    <div className={`glass rounded-2xl p-5 ${glow}`} style={{border:`1px solid ${bdr}`}}>
      <div className="flex items-start justify-between mb-3">
        <div><div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</div><div className="text-2xl font-bold text-white font-mono">{pre}{c.toLocaleString('en-IN')}{suf}</div></div>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div className={`text-xs ${delta>=0?'text-green-400':'text-red-400'}`}>{delta>=0?'↑':'↓'}{Math.abs(delta)}% vs last month</div>
        <Sparkline data={sparkData} color={sparkColor}/>
      </div>
    </div>
  );};

var LineChart=({data,color='#7c3aed'})=>{
  var h=180,w=600,pad=30,min=0,max=(Math.max(...data)||100)*1.1;
  var gX=i=>pad+(i/(data.length-1))*(w-pad*2);
  var gY=v=>h-pad-((v-min)/(max-min))*(h-pad*2);
  var pts=data.map((v,i)=>`${gX(i)},${gY(v)}`).join(' ');
  var lbls=Array.from({length:30},(_,i)=>{var d=new Date();d.setDate(d.getDate()-(29-i));return`${d.getDate()}/${d.getMonth()+1}`;});
  return(
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[0,1,2,3].map(i=><line key={i} x1={pad} y1={pad+i*(h-pad*2)/3} x2={w-pad} y2={pad+i*(h-pad*2)/3} stroke="rgba(255,255,255,.06)" strokeWidth="1"/>)}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{filter:`drop-shadow(0 0 6px ${color})`}}/>
      {lbls.filter((_,i)=>i%5===0).map((l,i)=><text key={i} x={gX(i*5)} y={h-5} textAnchor="middle" style={{fill:'rgba(255,255,255,.3)',fontSize:8}}>{l}</text>)}
    </svg>
  );};

var BarChart=({items})=>{
  var max=Math.max(...items.map(x=>x.v))||1;
  return(
    <div className="space-y-3">
      {items.map((it,i)=>(
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-gray-400 w-20 shrink-0">{it.label}</span>
          <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
            <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000" style={{width:`${(it.v/max)*100}%`,background:'linear-gradient(90deg,#7c3aed,#2563eb)',boxShadow:'0 0 10px rgba(124,58,237,.4)'}}>
              <span className="text-xs font-mono text-white/80">{fmtINR(it.v)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );};

var Lbl=({children})=><label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">{children}</label>;
var Inp=(props)=><input className="w-full rounded-xl px-3 py-2 text-sm" {...props}/>;
var Sel=({children,...props})=><select className="w-full rounded-xl px-3 py-2 text-sm" {...props}>{children}</select>;
var Textarea=(props)=><textarea className="w-full rounded-xl px-3 py-2 text-sm" rows={3} {...props}/>;
var BtnP=({children,onClick,cls='',type='button'})=><button type={type} onClick={onClick} className={`btn-p px-4 py-2 rounded-xl text-white text-sm font-medium ${cls}`}>{children}</button>;
var BtnS=({children,onClick,cls='',type='button'})=><button type={type} onClick={onClick} className={`btn-s px-4 py-2 rounded-xl text-gray-300 text-sm ${cls}`}>{children}</button>;
var Card=({children,cls=''})=><div className={`glass rounded-2xl p-5 ${cls}`}>{children}</div>;
var SectionTitle=({children})=><h2 className="text-lg font-semibold text-white mb-4">{children}</h2>;
var Th=({children})=><th className="text-left text-xs text-gray-500 uppercase tracking-wider pb-3 px-2 font-medium">{children}</th>;
var Td=({children,cls=''})=><td className={`px-2 py-3 text-sm text-gray-300 ${cls}`}>{children}</td>;
