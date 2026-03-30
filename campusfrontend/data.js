var AI_TIPS=[
  'Your spending is 60% canteen. Use bulk credits to save 15%.',
  'Balance is sufficient for next semester fees. Schedule early to avoid fines.',
  'You transfer funds every Friday — set a weekly P2P budget.',
  'Library fine risk is low. Use balance for upcoming Tech Fest tickets.',
  'Pay hostel fees 3 days early for 0.5% CampusCoin cashback.',
];
var AI_RECS=[
  'Based on your CS profile, Tech Fest 2026 is a perfect match! 3 friends attending.',
  'Your history shows interest in workshops. AI Summit on Apr 30 fits your profile.',
  'You attended Cultural Night last year — new lineup features 2 bands you liked!',
  'Sports Day has zero entry cost — great networking value across departments.',
];
var AI_REMIND=[
  'Dear Student, your fee is overdue. Clear dues via CampusChain to avoid 2% daily fine.',
  'Reminder: Fee due in 3 days. Pay instantly with zero gas fees on CampusChain.',
  'Action Required: Outstanding balance detected. Smart contract enforcement on due date.',
];
var AI_EVENT_DESC=[
  'An immersive tech festival featuring cutting-edge hackathons, expert keynotes, and innovation showcases.',
  'A vibrant celebration of culture, creativity, and community with live performances and exhibitions.',
  'A competitive and fun-filled event bringing together students from all departments in sporting glory.',
];
var EVT_TYPES=['FEE_PAYMENT','TOKEN_MINT','SMART_CTR','P2P_XFER','ADMIN_ACL'];
var EVT_DESCS={
  FEE_PAYMENT:['Tuition fee processed for Rahul','Hostel fee confirmed for Priya','Library fee cleared by Arjun'],
  TOKEN_MINT:['50 CampusCoin minted for enrollment','Top-up credited to wallet 0x4b2e','200 tokens minted via UPI gateway'],
  SMART_CTR:['Policy updated: Max Spend limit','KYC verification contract executed','Fee auto-debit contract triggered'],
  P2P_XFER:['Transfer: Rahul → Priya ₹500','P2P: Arjun → Sneha ₹1,200','Peer transfer confirmed on-chain'],
  ADMIN_ACL:['Admin role granted to faculty','Wallet access revoked: suspended user','Permission matrix updated by Dr. Meera'],
};
var genHash=()=>'0x'+Math.random().toString(16).substr(2,8)+'...'+Math.random().toString(16).substr(2,4);
var genFullHash=()=>'0x'+Array.from({length:40},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
var fmtINR=n=>'₹'+Number(n).toLocaleString('en-IN');
var fmtNow=()=>new Date().toLocaleString('en-IN',{hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
var daysUntil=d=>Math.ceil((new Date(d)-new Date())/864e5);
var rnd=arr=>arr[Math.floor(Math.random()*arr.length)];
var nextId=arr=>Math.max(0,...arr.map(x=>x.id))+1;
var SPARK_P=[40,55,48,70,65,80,75,90,85,95,88,92,78,85,90,95,88,92,96,100];
var SPARK_T=[30,35,40,38,45,50,48,55,60,58,65,70,68,72,75,80,78,82,85,90];
var SPARK_R=[10,15,12,18,20,25,22,28,30,35,32,38,40,45,42,48,50,55,52,58];
