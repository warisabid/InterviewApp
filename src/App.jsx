import { useState, useEffect, useRef, useCallback } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const T = {
  bg:"#07090e",s:"#0c1320",card:"#101926",card2:"#0e1624",
  b:"#192840",b2:"#24374e",t:"#ccd8ee",t2:"#7a96b8",t3:"#3d5a78",
  a:"#c8902e",aL:"#e4aa48",aD:"#9a6a18",
  g:"#1bc87a",gD:"#0e9458",r:"#e04040",rD:"#a82828",
  bl:"#3a84d0",blL:"#58a0eb",
  ff:"'Fraunces', serif",fm:"'IBM Plex Mono', monospace",
};

const EXP_BANDS = [
  {k:"0-2",yrs:"0–2 yrs",role:"Entry Level",title:"Analyst / Associate",desc:"Learning AP & OTC fundamentals"},
  {k:"2-6",yrs:"2–6 yrs",role:"Mid Level",title:"Senior Analyst / Lead",desc:"Building operational expertise"},
  {k:"6-10",yrs:"6–10 yrs",role:"Senior Level",title:"Manager / Process Lead",desc:"Deep domain ownership"},
  {k:"10+",yrs:"10+ yrs",role:"Expert",title:"Director / VP / Head",desc:"Strategic leadership & transformation"},
];
const DOMAINS = ["AP (Accounts Payable)","OTC (Order-to-Cash)","P2P (Procure-to-Pay)","R2R (Record-to-Report)","Both AP & OTC","Finance Shared Services","Treasury Operations","Full Finance Operations"];
const SKILL_DEFS = [
  {k:"ap",short:"AP",label:"AP Domain Knowledge",desc:"Invoice processing, vendor management, payments & aging"},
  {k:"otc",short:"OTC",label:"OTC Domain Knowledge",desc:"Order management, billing, cash application & collections"},
  {k:"erp",short:"ERP",label:"ERP & Technical Skills",desc:"Oracle, SAP, NetSuite, Excel, RPA & automation"},
  {k:"proc",short:"Proc",label:"Process & Controls",desc:"SOX, reconciliations, ICFR & month-end close"},
  {k:"ppl",short:"People",label:"People & Communication",desc:"Stakeholder management, escalation & cross-team collaboration"},
];
const R_LABELS = ["","Novice","Basic","Intermediate","Advanced","Expert"];

const QS = [
  {id:1,cat:"AP",q:"What is the primary purpose of Three-Way Match in Accounts Payable?",opts:["Match invoices with bank statements","Verify PO, GRN & supplier invoice before payment","Reconcile vendor ledger with GL","Approve payment terms with vendor"],ans:1,exp:"Three-Way Match compares PO, GRN, and Supplier Invoice to ensure all align before payment — preventing fraud and overpayment."},
  {id:2,cat:"AP",q:"Which document confirms goods or services have been received from a vendor?",opts:["Purchase Order","Debit Memo","Goods Receipt Note (GRN)","Credit Note"],ans:2,exp:"A GRN is raised by the receiving team to confirm ordered goods/services were received as specified in the PO."},
  {id:3,cat:"AP",q:"In NetSuite, which feature primarily prevents duplicate invoice payments?",opts:["Dunning Letters","Vendor Bill Duplicate Detection","Smart Match","Approval Routing"],ans:1,exp:"NetSuite's Vendor Bill Duplicate Detection flags bills with the same vendor, amount, and date — blocking accidental re-payments."},
  {id:4,cat:"AP",q:"A 'short pay' in Accounts Payable occurs when:",opts:["Payment is made before the due date","Payment is less than invoiced amount due to deductions or disputes","Invoice is paid in foreign currency","An advance payment is issued"],ans:1,exp:"Short pay means vendor receives less than invoiced — typically from WHT deductions, disputes, quality deductions, or credit memos."},
  {id:5,cat:"AP",q:"Withholding Tax (WHT) in AP is best described as:",opts:["Tax charged by the vendor on services","Tax deducted at source from vendor payment & remitted to tax authority","Sales tax applied to goods purchased","Import duty on foreign vendor invoices"],ans:1,exp:"WHT is deducted at source by the buyer. The vendor receives net amount; the withheld portion goes directly to the tax authority."},
  {id:6,cat:"AP",q:"Which AP aging bucket signals the most overdue payables requiring escalation?",opts:["0–30 days","31–60 days","61–90 days","91+ days"],ans:3,exp:"91+ days bucket represents the oldest outstanding payables — needing dispute resolution, management escalation, or potential write-off."},
  {id:7,cat:"AP",q:"The purpose of a vendor statement reconciliation is to:",opts:["Match purchase orders with GRNs","Compare AP ledger balance against vendor's own records","Process the monthly payment run","Approve new vendor onboarding"],ans:1,exp:"Vendor statement reconciliation identifies mismatches between company AP ledger and vendor records — catching missed invoices and timing differences."},
  {id:8,cat:"AP",q:"Payment term 'Net 30' requires the buyer to:",opts:["Pay full invoice amount within 30 days of invoice date","Get 2% discount if paid in 10 days, else pay in 30 days","Pay 30 days after goods receipt","Pay 30% upfront with balance at 30 days"],ans:0,exp:"'Net 30' means the full invoice amount is due within 30 calendar days of invoice date — no early-payment discount implied."},
  {id:9,cat:"OTC",q:"In the OTC cycle, which step immediately follows Order Management?",opts:["Cash Application","Credit Management","Invoicing","Collections"],ans:1,exp:"After order placement, Credit Management reviews customer creditworthiness before the order proceeds to fulfillment."},
  {id:10,cat:"OTC",q:"Cash Application in Order-to-Cash refers to:",opts:["Applying customer discounts to open invoices","Matching incoming customer payments to open AR invoices","Generating invoices for shipped goods","Processing customer refunds"],ans:1,exp:"Cash Application matches and posts incoming customer payments to specific open AR invoices, reducing the outstanding AR balance."},
  {id:11,cat:"OTC",q:"DSO (Days Sales Outstanding) measures:",opts:["Average days taken to pay suppliers","Average days to collect customer payment after a sale","Inventory holding days before a sale","End-to-end cash conversion cycle length"],ans:1,exp:"DSO is the average days between making a sale and receiving payment. Lower DSO = more efficient receivables and better working capital."},
  {id:12,cat:"OTC",q:"A 'Dunning Letter' in OTC collections is used to:",opts:["Inform vendors of upcoming payment dates","Remind customers of overdue invoices","Acknowledge receipt of a customer purchase order","Formally approve a customer credit limit increase"],ans:1,exp:"Dunning letters are escalating reminders to customers with overdue AR — progressing from gentle reminder to formal demand before legal action."},
  {id:13,cat:"OTC",q:"A customer account is typically put on 'Credit Hold' when:",opts:["The customer pays consistently early","Customer exceeds credit limit or has significantly overdue invoices","Customer's order volume suddenly increases","Customer requests copies of past invoices"],ans:1,exp:"Credit holds block new orders for customers who exceed credit limits or have deteriorating payment behaviour."},
  {id:14,cat:"OTC",q:"Which document formally initiates the OTC process?",opts:["Tax Invoice","Sales Order","Delivery Note","Credit Memo"],ans:1,exp:"A Sales Order is the confirmed internal document that triggers the OTC cycle — from fulfillment through invoicing and cash collection."},
  {id:15,cat:"OTC",q:"A Debit Memo issued to a customer is used to:",opts:["Reduce the balance the customer owes","Increase the balance owed for additional charges or corrections","Cancel an existing tax invoice","Record application of a customer payment"],ans:1,exp:"A Debit Memo increases the customer's outstanding balance — issued for billing corrections, additional service charges, or price adjustments."},
  {id:16,cat:"OTC",q:"'Unapplied cash' in AR means:",opts:["Customer payment received but not yet matched to any open invoice","Customer payment applied to incorrect invoice","Advance payment made to a vendor","Cash refunded to customer for overpayment"],ans:0,exp:"Unapplied cash = remittances received from customers not yet matched to specific open invoices — creating a suspense balance in AR."},
];

const avg = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
const getStats = sessions => {
  if (!sessions.length) return {attempts:0,avgScore:0,bestScore:0,passRate:0,apPerf:0,otcPerf:0};
  const pcts = sessions.map(s=>(s.score/s.total)*100);
  return {
    attempts:sessions.length,
    avgScore:Math.round(avg(pcts)),
    bestScore:Math.round(Math.max(...pcts)),
    passRate:Math.round(sessions.filter(s=>(s.score/s.total)>=0.7).length/sessions.length*100),
    apPerf:Math.round(avg(sessions.filter(s=>s.apTotal>0).map(s=>(s.apScore/s.apTotal)*100)))||0,
    otcPerf:Math.round(avg(sessions.filter(s=>s.otcTotal>0).map(s=>(s.otcScore/s.otcTotal)*100)))||0,
  };
};
const getRecs = (profile, st) => {
  const recs=[], r=profile?.ratings||{};
  if(st.attempts>0){
    if(st.apPerf<70) recs.push({area:"AP Core Processes",icon:"📋",detail:"Revisit Three-Way Match, GRN reconciliation, WHT handling and payment terms.",pri:"High"});
    if(st.otcPerf<70) recs.push({area:"OTC Cycle Mastery",icon:"💰",detail:"Strengthen Cash Application, DSO improvement, credit management & dunning.",pri:"High"});
    if(st.avgScore<60) recs.push({area:"Finance Fundamentals",icon:"📊",detail:"Review aging analysis, GL reconciliation basics and period-end close concepts.",pri:"Medium"});
  }
  if((r.erp||3)<=2) recs.push({area:"ERP Systems Expertise",icon:"⚙️",detail:"Deepen NetSuite/Oracle/SAP AP-AR module knowledge and automation capabilities.",pri:(r.erp||3)===1?"High":"Medium"});
  if((r.proc||3)<=2) recs.push({area:"Process & Controls",icon:"🔄",detail:"Study SOX ICFR, reconciliation best practices and month-end close governance.",pri:"Medium"});
  if((r.ppl||3)<=2) recs.push({area:"Stakeholder Communication",icon:"🤝",detail:"Build structured escalation frameworks and cross-functional influence skills.",pri:"Low"});
  if(!recs.length) recs.push({area:"Advanced Transformation",icon:"🎯",detail:"Explore process automation, finance transformation strategy and KPI ownership.",pri:"Low"});
  return recs.slice(0,4);
};
const priColor = p => p==="High"?T.r:p==="Medium"?T.a:T.t2;

const INTERVIEWER_SYS = (user,profile,st) => `You are Jordan Wei, a Senior Finance Operations Interview Coach with 15 years of experience at Big 4 firms specialising in AP and OTC transformation. You are conducting a structured mock job interview.

CANDIDATE PROFILE:
- Name: ${user?.name||"Candidate"}
- Experience: ${user?.experience||"2-6"} years  
- Domain Focus: ${user?.domain||"AP & OTC"}
- AP Self-Rating: ${profile?.ratings?.ap||3}/5 | OTC: ${profile?.ratings?.otc||3}/5 | ERP: ${profile?.ratings?.erp||3}/5
${st?.attempts>0?`- Mock Test Avg: ${st.avgScore}% across ${st.attempts} tests`:"- No mock tests taken yet"}

INTERVIEW RULES:
1. Greet them warmly by first name, then ask your FIRST question immediately in the same message
2. After each answer: ONE brief acknowledgment (max 15 words), then ONE new question
3. Ask exactly 5 questions total — track this internally
4. Calibrate difficulty to experience:
   - 0-2 yrs: Basic concepts (invoice matching, payment terms, OTC cycle steps)
   - 2-6 yrs: Process exceptions (WHT, DSO analysis, ERP navigation, reconciliation)
   - 6-10 yrs: Ownership (SLA governance, automation ROI, cross-team escalation)
   - 10+ yrs: Strategy (transformation roadmap, CoE design, system selection, org change)
5. Cover at least 2 AP and 2 OTC topics across the 5 questions
6. Be professional, warm, and encouraging — this is a safe learning environment

AFTER THE 5TH ANSWER output ONLY this (start with the exact tag [INTERVIEW_COMPLETE]):
[INTERVIEW_COMPLETE]
**Overall Rating: X/10**

**Communication & Clarity** — [1-2 sentence assessment]
**Technical Knowledge** — [1-2 sentence assessment]
**Process Understanding** — [1-2 sentence assessment]

**Key Strengths:**
- [strength based on their actual answers]
- [strength based on their actual answers]

**Priority Development Areas:**
- [specific gap] → [concrete action]
- [specific gap] → [concrete action]

**30-Day Action Plan:**
- [actionable, specific step]
- [actionable, specific step]
[/INTERVIEW_COMPLETE]`;

export default function App() {
  const FONTS = <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400&display=swap" rel="stylesheet"/>;

  const [screen, setScreen] = useState("auth");
  const [authMode, setAuthMode] = useState("login");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({email:"",password:""});
  const [regForm, setRegForm] = useState({name:"",email:"",age:"",contact:"",experience:"",domain:"",password:"",consent:false});
  const [formErr, setFormErr] = useState("");
  const [surveyStep, setSurveyStep] = useState(1);
  const [profile, setProfile] = useState({experience:null,ratings:{ap:3,otc:3,erp:3,proc:3,ppl:3}});
  const [sessions, setSessions] = useState([]);
  const [questions, setQuestions] = useState(QS);
  const [filter, setFilter] = useState("Both");
  const [testQs, setTestQs] = useState([]);
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(null);
  const [testAns, setTestAns] = useState([]);
  const [showExp, setShowExp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerOn, setTimerOn] = useState(false);
  const [lastSession, setLastSession] = useState(null);
  const [interviewMode, setInterviewMode] = useState("text");
  const [interviewMsgs, setInterviewMsgs] = useState([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [qCount, setQCount] = useState(0);
  const [interviewDone, setInterviewDone] = useState(false);
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const [importTxt, setImportTxt] = useState("");
  const [importErr, setImportErr] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const chatEndRef = useRef(null);

  const st = getStats(sessions);
  const recs = getRecs(profile, st);

  useEffect(()=>{
    (async()=>{ try{ const d=await window.storage.get('fo-users'); if(d) setUsers(JSON.parse(d.value)); }catch(e){} })();
  },[]);

  useEffect(()=>{
    if(!currentUser) return;
    (async()=>{
      try{
        const sd=await window.storage.get(`fo-s-${currentUser.id}`);
        if(sd) setSessions(JSON.parse(sd.value));
        const pd=await window.storage.get(`fo-p-${currentUser.id}`);
        if(pd){ setProfile(JSON.parse(pd.value)); setScreen("home"); }
        else setScreen("survey");
      }catch(e){ setScreen("survey"); }
    })();
  },[currentUser]);

  useEffect(()=>{
    if(videoActive && streamRef.current && videoRef.current)
      videoRef.current.srcObject = streamRef.current;
  },[videoActive, screen]);

  useEffect(()=>{
    if(!timerOn||timeLeft<=0) return;
    const t=setInterval(()=>setTimeLeft(p=>{if(p<=1){clearInterval(t);return 0;}return p-1;}),1000);
    return ()=>clearInterval(t);
  },[timerOn,timeLeft]);

  useEffect(()=>{ if(timerOn&&timeLeft===0) doAutoAdv(); },[timeLeft,timerOn]);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[interviewMsgs]);

  const save = async (key, val) => { try{ await window.storage.set(key, JSON.stringify(val)); }catch(e){} };

  const handleLogin = ()=>{
    if(!loginForm.email||!loginForm.password){setFormErr("Please fill all fields.");return;}
    const u=users.find(u=>u.email.toLowerCase()===loginForm.email.toLowerCase()&&u.password===loginForm.password);
    if(!u){setFormErr("Invalid email or password.");return;}
    setCurrentUser(u); setFormErr("");
  };

  const handleRegister = ()=>{
    if(!regForm.name||!regForm.email||!regForm.age||!regForm.contact||!regForm.experience||!regForm.domain||!regForm.password){setFormErr("Please complete all fields.");return;}
    if(!regForm.consent){setFormErr("Consent is required to create an account.");return;}
    if(users.find(u=>u.email.toLowerCase()===regForm.email.toLowerCase())){setFormErr("An account with this email already exists.");return;}
    const u={id:Date.now().toString(),name:regForm.name,email:regForm.email,age:+regForm.age,contact:regForm.contact,experience:regForm.experience,domain:regForm.domain,password:regForm.password,consentDate:new Date().toISOString(),consentGiven:true,joined:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})};
    const nu=[...users,u]; setUsers(nu); save('fo-users',nu); setCurrentUser(u); setFormErr("");
  };

  const handleLogout = ()=>{ setCurrentUser(null); setSessions([]); setProfile({experience:null,ratings:{ap:3,otc:3,erp:3,proc:3,ppl:3}}); setScreen("auth"); };

  const saveProfile = async p=>{ await save(`fo-p-${currentUser?.id}`,p); };

  const startTest = ()=>{
    const pool=questions.filter(q=>filter==="Both"?true:q.cat===filter);
    const qs=[...pool].sort(()=>Math.random()-0.5).slice(0,Math.min(10,pool.length));
    setTestQs(qs);setQi(0);setSel(null);setTestAns([]);setShowExp(false);setTimeLeft(30);setTimerOn(true);setScreen("test");
  };

  const doAutoAdv = useCallback(()=>{
    setTestQs(qs=>{ setQi(i=>{ setTestAns(ans=>{ const q=qs[i]; const na=[...ans,{qId:q?.id,sel:null,correct:q?.ans,cat:q?.cat}];
      if(i+1<qs.length){setSel(null);setShowExp(false);setTimeLeft(30);setTimerOn(true);return na;}
      else{setTimerOn(false); setTimeout(()=>endTest(na,qs),0); return na;}
    }); return i+1<qs.length?i+1:i; }); return qs; });
  },[]);

  const handleSel = idx=>{ if(sel!==null) return; setSel(idx); setTimerOn(false); setShowExp(true); };

  const handleNext = ()=>{
    const q=testQs[qi]; const na=[...testAns,{qId:q.id,sel,correct:q.ans,cat:q.cat}]; setTestAns(na);
    if(qi+1<testQs.length){setQi(qi+1);setSel(null);setShowExp(false);setTimeLeft(30);setTimerOn(true);}
    else{setTimerOn(false);endTest(na,testQs);}
  };

  const endTest = (finalAns,qs)=>{
    const apScore=finalAns.filter(a=>a.cat==="AP"&&a.sel===a.correct).length;
    const otcScore=finalAns.filter(a=>a.cat==="OTC"&&a.sel===a.correct).length;
    const session={id:Date.now(),date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"}),score:finalAns.filter(a=>a.sel===a.correct).length,total:qs.length,apScore,apTotal:qs.filter(q=>q.cat==="AP").length,otcScore,otcTotal:qs.filter(q=>q.cat==="OTC").length,answers:finalAns,questions:qs};
    const ns=[session,...sessions]; setSessions(ns); save(`fo-s-${currentUser?.id}`,ns); setLastSession(session); setScreen("results");
  };

  const callAI = async (messages) => {
    const resp = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:INTERVIEWER_SYS(currentUser,profile,st),messages})});
    const data = await resp.json();
    return data.content?.[0]?.text||"I apologize, there was an issue connecting. Please try again.";
  };

  const startInterview = async (mode)=>{
    setInterviewMode(mode); setInterviewMsgs([]); setInterviewInput(""); setQCount(0); setInterviewDone(false); setInterviewFeedback("");
    setScreen("interview");
    if(mode==="video"){
      try{
        const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        streamRef.current=stream; setVideoActive(true);
      }catch(e){console.log("Camera unavailable");}
    }
    setInterviewLoading(true);
    try{
      const text=await callAI([{role:"user",content:"Please begin the mock interview now."}]);
      setInterviewMsgs([{role:"assistant",content:text,ts:Date.now()}]);
      if(mode==="voice"||mode==="video") speakText(text);
    }catch(e){
      setInterviewMsgs([{role:"assistant",content:"Hello! I'm having connection trouble. Please check your internet and try again.",ts:Date.now()}]);
    }
    setInterviewLoading(false);
  };

  const sendMsg = async (text)=>{
    if(!text.trim()||interviewLoading||interviewDone) return;
    const userMsg={role:"user",content:text.trim(),ts:Date.now()};
    const newMsgs=[...interviewMsgs,userMsg];
    setInterviewMsgs(newMsgs); setInterviewInput(""); setInterviewLoading(true);
    try{
      const apiMsgs=[{role:"user",content:"Please begin the mock interview now."},...newMsgs.map(m=>({role:m.role,content:m.content}))];
      const aiText=await callAI(apiMsgs);
      if(aiText.includes("[INTERVIEW_COMPLETE]")){
        const fb=aiText.replace(/\[INTERVIEW_COMPLETE\]/g,"").replace(/\[\/INTERVIEW_COMPLETE\]/g,"").trim();
        setInterviewFeedback(fb); setInterviewDone(true);
        setInterviewMsgs(p=>[...p,{role:"assistant",content:"Thank you — that completes our interview session! Your detailed feedback report is ready.",ts:Date.now()}]);
      } else {
        setInterviewMsgs(p=>[...p,{role:"assistant",content:aiText,ts:Date.now()}]);
        if(interviewMode==="voice"||interviewMode==="video") speakText(aiText);
        setQCount(c=>Math.min(c+1,5));
      }
    }catch(e){
      setInterviewMsgs(p=>[...p,{role:"assistant",content:"Connection issue — please resend your response.",ts:Date.now()}]);
    }
    setInterviewLoading(false);
  };

  const speakText = text=>{
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text.replace(/\*\*/g,"").replace(/•/g,"").slice(0,600));
    utt.rate=0.92; utt.pitch=1;
    const voices=window.speechSynthesis.getVoices();
    const v=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Google US")||v.lang==="en-US");
    if(v) utt.voice=v;
    utt.onstart=()=>setIsSpeaking(true); utt.onend=()=>setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const toggleVoice = ()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Speech recognition requires Chrome browser.");return;}
    if(isListening){recRef.current?.stop();setIsListening(false);return;}
    const r=new SR(); r.lang="en-US"; r.interimResults=false;
    r.onresult=e=>{setInterviewInput(e.results[0][0].transcript);setIsListening(false);};
    r.onerror=()=>setIsListening(false); r.onend=()=>setIsListening(false);
    recRef.current=r; r.start(); setIsListening(true);
  };

  const stopInterview = ()=>{
    streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null;
    window.speechSynthesis?.cancel(); recRef.current?.stop();
    setVideoActive(false); setIsListening(false); setIsSpeaking(false); setScreen("home");
  };

  const handleImport = ()=>{
    try{
      const p=JSON.parse(importTxt);
      if(!Array.isArray(p)) throw new Error("Must be a JSON array");
      p.forEach((q,i)=>{if(!q.q&&!q.question) throw new Error(`Q${i+1}: missing 'q'`);if(!Array.isArray(q.opts||q.options)) throw new Error(`Q${i+1}: 'opts' must be array`);if(typeof(q.ans??q.correct)!=="number") throw new Error(`Q${i+1}: 'ans' must be number`);});
      setQuestions(prev=>[...prev,...p.map((q,i)=>({id:Date.now()+i,cat:(q.cat||q.category||"AP").toUpperCase(),q:q.q||q.question,opts:q.opts||q.options,ans:q.ans??q.correct,exp:q.exp||q.explanation||""}))]);
      setImportTxt(""); setImportErr(""); setScreen("home");
    }catch(e){setImportErr(e.message);}
  };

  const setRating=(k,v)=>setProfile(p=>({...p,ratings:{...p.ratings,[k]:v}}));

  const RatingRow=({sk})=>(
    <div style={{marginBottom:"1.375rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"}}>
        <div><div style={{fontSize:"0.85rem",color:T.t,fontWeight:500,marginBottom:"0.15rem"}}>{sk.label}</div><div style={{fontSize:"0.7rem",color:T.t3,lineHeight:1.5}}>{sk.desc}</div></div>
        <span style={{fontSize:"0.71rem",color:T.aL,marginLeft:"1rem",flexShrink:0}}>{R_LABELS[profile.ratings[sk.k]]}</span>
      </div>
      <div style={{display:"flex",gap:"0.35rem",alignItems:"center"}}>
        {[1,2,3,4,5].map(v=>{const active=profile.ratings[sk.k]>=v,col=["",T.t3,"#4a7a9a",T.bl,T.a,T.g][profile.ratings[sk.k]];return <button key={v} onClick={()=>setRating(sk.k,v)} style={{flex:1,height:6,borderRadius:4,border:"none",cursor:"pointer",background:active?col:T.b,transition:"background 0.2s"}}/>;})}<span style={{fontSize:"0.69rem",color:T.t3,marginLeft:"0.4rem",minWidth:10}}>{profile.ratings[sk.k]}</span>
      </div>
    </div>
  );

  const exp = EXP_BANDS.find(e=>e.k===profile.experience||e.k===currentUser?.experience);
  const radarData = SKILL_DEFS.map(s=>({skill:s.short,"Self":Math.round((profile.ratings[s.k]/5)*100),"Actual":s.k==="ap"?st.apPerf:s.k==="otc"?st.otcPerf:Math.round((profile.ratings[s.k]/5)*100)}));

  const Nav = ({extra})=>(
    <div style={{borderBottom:`1px solid ${T.b}`,padding:"0.7rem 1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg,position:"sticky",top:0,zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
        <span style={{fontFamily:T.ff,fontSize:"1rem",color:T.aL,cursor:"pointer"}} onClick={()=>setScreen("home")}>AP/OTC Pro</span>
        {exp&&<span style={{fontSize:"0.67rem",color:T.t3,borderLeft:`1px solid ${T.b}`,paddingLeft:"0.75rem"}}>{exp.yrs} · {exp.role}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
        {extra}
        <span style={{fontSize:"0.73rem",color:T.t2,padding:"0 0.375rem"}}>{currentUser?.name}</span>
        <button onClick={()=>{setSurveyStep(1);setScreen("survey");}} style={{padding:"0.3rem 0.7rem",background:"transparent",color:T.t2,border:`1px solid ${T.b}`,borderRadius:99,fontFamily:T.fm,fontSize:"0.68rem",cursor:"pointer"}}>Profile</button>
        <button onClick={handleLogout} style={{padding:"0.3rem 0.7rem",background:"transparent",color:T.r,border:`1px solid ${T.b}`,borderRadius:99,fontFamily:T.fm,fontSize:"0.68rem",cursor:"pointer"}}>Logout</button>
      </div>
    </div>
  );

  // ── AUTH ──────────────────────────────────────────────────────────────
  if(screen==="auth") return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm,display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem"}}>
      {FONTS}
      <div style={{width:"100%",maxWidth:460}}>
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{fontSize:"0.68rem",color:T.t3,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:"0.625rem"}}>Finance Operations · Assessment Platform</div>
          <h1 style={{fontFamily:T.ff,fontSize:"2.4rem",color:T.aL,margin:"0 0 0.3rem",lineHeight:1.1}}>AP/OTC Pro</h1>
          <p style={{color:T.t2,fontSize:"0.78rem",margin:0}}>Mock Test · AI Interview Coach · Skill Analytics</p>
        </div>
        <div style={{display:"flex",background:T.s,borderRadius:8,padding:"0.2rem",marginBottom:"1.5rem",border:`1px solid ${T.b}`}}>
          {["login","register"].map(m=><button key={m} onClick={()=>{setAuthMode(m);setFormErr("");}} style={{flex:1,padding:"0.55rem",background:authMode===m?T.card:"transparent",border:"none",borderRadius:6,color:authMode===m?T.t:T.t2,fontFamily:T.fm,fontSize:"0.78rem",cursor:"pointer",transition:"all 0.2s"}}>{m==="login"?"Sign In":"Create Account"}</button>)}
        </div>
        <div style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:12,padding:"1.625rem"}}>
          {authMode==="login"?(
            <div>
              {[{k:"email",label:"Email Address",type:"email",ph:"you@example.com"},{k:"password",label:"Password",type:"password",ph:"••••••••"}].map(f=>(
                <div key={f.k} style={{marginBottom:"1rem"}}>
                  <label style={{display:"block",fontSize:"0.71rem",color:T.t2,marginBottom:"0.35rem",letterSpacing:"0.06em"}}>{f.label}</label>
                  <input type={f.type} value={loginForm[f.k]} onChange={e=>setLoginForm(p=>({...p,[f.k]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder={f.ph} style={{width:"100%",padding:"0.675rem 0.875rem",background:T.s,border:`1px solid ${T.b}`,borderRadius:7,color:T.t,fontFamily:T.fm,fontSize:"0.82rem",outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
              {formErr&&<p style={{color:T.r,fontSize:"0.75rem",marginBottom:"0.625rem"}}>⚠ {formErr}</p>}
              <button onClick={handleLogin} style={{width:"100%",padding:"0.85rem",background:T.a,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>Sign In →</button>
            </div>
          ):(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem 0.875rem",marginBottom:"0.125rem"}}>
                {[{k:"name",label:"Full Name",type:"text",ph:"Your full name",span:2},{k:"email",label:"Email Address",type:"email",ph:"you@example.com",span:2},{k:"age",label:"Age",type:"number",ph:"28",span:1},{k:"contact",label:"Contact Number",type:"tel",ph:"+91 98765 43210",span:1},{k:"password",label:"Create Password",type:"password",ph:"Min 6 characters",span:2}].map(f=>(
                  <div key={f.k} style={{gridColumn:`span ${f.span}`}}>
                    <label style={{display:"block",fontSize:"0.7rem",color:T.t2,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>{f.label}</label>
                    <input type={f.type} value={regForm[f.k]} onChange={e=>setRegForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",padding:"0.625rem 0.75rem",background:T.s,border:`1px solid ${T.b}`,borderRadius:7,color:T.t,fontFamily:T.fm,fontSize:"0.79rem",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
                <div style={{gridColumn:"span 1"}}>
                  <label style={{display:"block",fontSize:"0.7rem",color:T.t2,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>Experience Band</label>
                  <select value={regForm.experience} onChange={e=>setRegForm(p=>({...p,experience:e.target.value}))} style={{width:"100%",padding:"0.625rem 0.75rem",background:T.s,border:`1px solid ${T.b}`,borderRadius:7,color:regForm.experience?T.t:T.t3,fontFamily:T.fm,fontSize:"0.79rem",outline:"none",boxSizing:"border-box"}}>
                    <option value="">Select years</option>
                    {EXP_BANDS.map(e=><option key={e.k} value={e.k}>{e.yrs} · {e.role}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"span 1"}}>
                  <label style={{display:"block",fontSize:"0.7rem",color:T.t2,marginBottom:"0.3rem",letterSpacing:"0.06em"}}>Domain / Expertise</label>
                  <select value={regForm.domain} onChange={e=>setRegForm(p=>({...p,domain:e.target.value}))} style={{width:"100%",padding:"0.625rem 0.75rem",background:T.s,border:`1px solid ${T.b}`,borderRadius:7,color:regForm.domain?T.t:T.t3,fontFamily:T.fm,fontSize:"0.79rem",outline:"none",boxSizing:"border-box"}}>
                    <option value="">Select domain</option>
                    {DOMAINS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{background:T.s,border:`1px solid ${T.b}`,borderRadius:8,padding:"0.875rem",margin:"1rem 0 0.875rem"}}>
                <div style={{fontSize:"0.67rem",color:T.a,marginBottom:"0.4rem",letterSpacing:"0.12em",fontWeight:600}}>DATA CONSENT & LEGAL NOTICE</div>
                <p style={{fontSize:"0.7rem",color:T.t2,margin:"0 0 0.625rem",lineHeight:1.65}}>By registering, you consent to your personal data (name, email, age, contact, experience, domain, and assessment results) being securely stored and used solely to personalise your learning experience and generate skill analytics. Your data will not be sold to third parties. You may request data deletion at any time by contacting support. This consent is recorded with a timestamp for legal compliance under applicable data protection laws.</p>
                <label style={{display:"flex",gap:"0.5rem",alignItems:"flex-start",cursor:"pointer"}}>
                  <input type="checkbox" checked={regForm.consent} onChange={e=>setRegForm(p=>({...p,consent:e.target.checked}))} style={{marginTop:2,accentColor:T.a,flexShrink:0}}/>
                  <span style={{fontSize:"0.7rem",color:T.t,lineHeight:1.55}}>I have read and understood the above. I freely consent to the collection and use of my data as described.</span>
                </label>
              </div>
              {formErr&&<p style={{color:T.r,fontSize:"0.75rem",marginBottom:"0.625rem"}}>⚠ {formErr}</p>}
              <button onClick={handleRegister} style={{width:"100%",padding:"0.85rem",background:T.a,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>Create Account →</button>
            </div>
          )}
        </div>
        <p style={{textAlign:"center",fontSize:"0.71rem",color:T.t3,marginTop:"1rem"}}>
          {authMode==="login"?"New here? ":"Already registered? "}
          <button onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setFormErr("");}} style={{background:"none",border:"none",color:T.aL,cursor:"pointer",fontFamily:T.fm,fontSize:"0.71rem",textDecoration:"underline"}}>{authMode==="login"?"Create account →":"Sign in →"}</button>
        </p>
      </div>
    </div>
  );

  // ── SURVEY ────────────────────────────────────────────────────────────
  if(screen==="survey") return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm,display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem"}}>
      {FONTS}
      <div style={{maxWidth:580,width:"100%"}}>
        <div style={{fontSize:"0.67rem",color:T.t3,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:"0.5rem"}}>Pre-Assessment Survey · {currentUser?.name}</div>
        <h1 style={{fontFamily:T.ff,fontSize:"2rem",color:T.aL,margin:"0 0 0.375rem",lineHeight:1.15}}>{surveyStep===1?"Experience Band":surveyStep===2?"Domain Confidence":"Skills Profile"}</h1>
        <p style={{color:T.t2,fontSize:"0.78rem",margin:"0 0 1.75rem",lineHeight:1.6}}>{surveyStep===1?"Your band calibrates question difficulty, interview depth, and focus recommendations.":surveyStep===2?"Rate your AP & OTC confidence honestly — this sets your personalised focus areas.":"Rate your technical and professional capabilities to complete your expertise radar."}</p>
        <div style={{display:"flex",gap:"0.35rem",marginBottom:"2rem"}}>{[1,2,3].map(s=><div key={s} style={{flex:1,height:3,borderRadius:99,background:surveyStep>=s?T.a:T.b,transition:"background 0.3s"}}/>)}</div>

        {surveyStep===1&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",marginBottom:"1.5rem"}}>
            {EXP_BANDS.map(e=><button key={e.k} onClick={()=>setProfile(p=>({...p,experience:e.k}))} style={{padding:"1.125rem",background:profile.experience===e.k?T.card2:T.s,border:`1px solid ${profile.experience===e.k?T.a:T.b}`,borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all 0.2s",outline:"none"}}>
              <div style={{fontSize:"0.67rem",color:T.a,marginBottom:"0.25rem",letterSpacing:"0.1em",textTransform:"uppercase"}}>{e.yrs}</div>
              <div style={{fontFamily:T.ff,fontSize:"1rem",color:T.t,marginBottom:"0.2rem"}}>{e.role}</div>
              <div style={{fontSize:"0.72rem",color:T.t2,marginBottom:"0.25rem"}}>{e.title}</div>
              <div style={{fontSize:"0.67rem",color:T.t3,lineHeight:1.4}}>{e.desc}</div>
            </button>)}
          </div>
          <button onClick={()=>profile.experience&&setSurveyStep(2)} style={{width:"100%",padding:"0.85rem",background:profile.experience?T.a:"#1a2840",color:profile.experience?"#fff":T.t3,border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:profile.experience?"pointer":"default"}}>Continue →</button>
        </>}
        {surveyStep===2&&<>
          {SKILL_DEFS.slice(0,2).map(sk=><RatingRow key={sk.k} sk={sk}/>)}
          <div style={{display:"flex",gap:"0.75rem",marginTop:"0.5rem"}}>
            <button onClick={()=>setSurveyStep(1)} style={{padding:"0.85rem 1.25rem",background:"transparent",color:T.t2,border:`1px solid ${T.b}`,borderRadius:8,fontFamily:T.fm,cursor:"pointer"}}>←</button>
            <button onClick={()=>setSurveyStep(3)} style={{flex:1,padding:"0.85rem",background:T.a,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>Continue →</button>
          </div>
        </>}
        {surveyStep===3&&<>
          {SKILL_DEFS.slice(2).map(sk=><RatingRow key={sk.k} sk={sk}/>)}
          <div style={{display:"flex",gap:"0.75rem",marginTop:"0.5rem"}}>
            <button onClick={()=>setSurveyStep(2)} style={{padding:"0.85rem 1.25rem",background:"transparent",color:T.t2,border:`1px solid ${T.b}`,borderRadius:8,fontFamily:T.fm,cursor:"pointer"}}>←</button>
            <button onClick={async()=>{if(profile.experience){await saveProfile(profile);setScreen("home");}}} style={{flex:1,padding:"0.85rem",background:T.g,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>Launch Dashboard →</button>
          </div>
        </>}
      </div>
    </div>
  );

  // ── IMPORT ────────────────────────────────────────────────────────────
  if(screen==="import") return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm}}>
      {FONTS}<Nav/>
      <div style={{maxWidth:620,margin:"0 auto",padding:"2rem"}}>
        <h2 style={{fontFamily:T.ff,fontSize:"1.9rem",color:T.aL,margin:"0 0 0.5rem"}}>Import Questions</h2>
        <p style={{color:T.t2,fontSize:"0.78rem",marginBottom:"1.25rem",lineHeight:1.6}}>Fields: <code style={{color:T.aL}}>q</code>, <code style={{color:T.aL}}>opts</code> (array), <code style={{color:T.aL}}>ans</code> (0-based index), <code style={{color:T.aL}}>cat</code> (AP/OTC), <code style={{color:T.aL}}>exp</code> (explanation).</p>
        <div style={{background:T.s,border:`1px solid ${T.b}`,borderRadius:8,padding:"0.75rem",marginBottom:"0.75rem",fontSize:"0.7rem",color:T.t3,lineHeight:1.7}}>{`[{ "cat": "AP", "q": "What is...?", "opts": ["A","B","C","D"], "ans": 0, "exp": "Because..." }]`}</div>
        <textarea value={importTxt} onChange={e=>setImportTxt(e.target.value)} placeholder="Paste JSON here..." style={{width:"100%",height:160,background:T.s,border:`1px solid ${T.b}`,borderRadius:8,color:T.t,fontFamily:T.fm,fontSize:"0.78rem",padding:"0.75rem",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        {importErr&&<p style={{color:T.r,fontSize:"0.75rem",marginTop:"0.375rem"}}>⚠ {importErr}</p>}
        <div style={{display:"flex",gap:"0.75rem",marginTop:"0.75rem"}}>
          <button onClick={handleImport} style={{flex:2,padding:"0.85rem",background:T.a,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>Add to Bank</button>
          <button onClick={()=>setScreen("home")} style={{flex:1,padding:"0.85rem",background:"transparent",color:T.t2,border:`1px solid ${T.b}`,borderRadius:8,fontFamily:T.fm,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // ── TEST ──────────────────────────────────────────────────────────────
  if(screen==="test"&&testQs.length>0){
    const q=testQs[qi],circ=2*Math.PI*18,tCol=timeLeft>15?T.g:timeLeft>7?T.a:T.r;
    return (
      <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm,display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem"}}>
        {FONTS}
        <div style={{maxWidth:680,width:"100%"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.375rem"}}>
            <div style={{fontSize:"0.78rem"}}><span style={{color:T.t3}}>Q </span><span style={{color:T.aL,fontWeight:600}}>{qi+1}</span><span style={{color:T.t3}}>/{testQs.length}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"0.625rem"}}>
              <span style={{padding:"0.18rem 0.55rem",borderRadius:99,fontSize:"0.68rem",background:q.cat==="AP"?"#182e50":"#163028",color:q.cat==="AP"?T.blL:T.g}}>{q.cat}</span>
              <svg width={44} height={44} viewBox="0 0 44 44">
                <circle cx={22} cy={22} r={18} fill="none" stroke={T.b} strokeWidth={3}/>
                <circle cx={22} cy={22} r={18} fill="none" stroke={tCol} strokeWidth={3} strokeDasharray={circ} strokeDashoffset={circ-(timeLeft/30)*circ} strokeLinecap="round" transform="rotate(-90 22 22)" style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
                <text x={22} y={26} textAnchor="middle" fill={tCol} fontSize={11} fontFamily="IBM Plex Mono" fontWeight={600}>{timeLeft}</text>
              </svg>
            </div>
          </div>
          <div style={{height:3,background:T.b,borderRadius:99,marginBottom:"1.75rem"}}><div style={{width:`${(qi/testQs.length)*100}%`,height:"100%",background:T.a,borderRadius:99,transition:"width 0.4s"}}/></div>
          <h2 style={{fontFamily:T.ff,fontSize:"1.3rem",lineHeight:1.55,color:T.t,margin:"0 0 1.625rem"}}>{q.q}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:"0.575rem",marginBottom:"1.125rem"}}>
            {q.opts.map((opt,idx)=>{let bg=T.card,brd=T.b,col=T.t2;if(sel!==null){if(idx===q.ans){bg="#0e3020";brd="#166834";col=T.g;}else if(idx===sel&&sel!==q.ans){bg="#2e0e0e";brd="#7a1a1a";col=T.r;}}return<button key={idx} onClick={()=>handleSel(idx)} style={{padding:"0.85rem 1.1rem",background:bg,border:`1px solid ${brd}`,borderRadius:8,color:col,fontFamily:T.fm,fontSize:"0.82rem",textAlign:"left",cursor:sel===null?"pointer":"default",transition:"all 0.2s",display:"flex",gap:"0.625rem",outline:"none"}}><span style={{minWidth:18,color:T.t3,flexShrink:0}}>{String.fromCharCode(65+idx)}.</span><span style={{lineHeight:1.5}}>{opt}</span></button>;})}
          </div>
          {showExp&&<div style={{background:T.s,border:`1px solid ${T.b}`,borderRadius:8,padding:"0.875rem",marginBottom:"1.1rem",fontSize:"0.78rem",color:T.t2,lineHeight:1.65}}><span style={{color:T.aL,fontWeight:600}}>Why? </span>{q.exp}</div>}
          {sel!==null&&<button onClick={handleNext} style={{width:"100%",padding:"0.875rem",background:T.a,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>{qi+1<testQs.length?"Next →":"View Results →"}</button>}
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────
  if(screen==="results"&&lastSession){
    const s=lastSession,pct=Math.round((s.score/s.total)*100),pass=pct>=70;
    const apPct=s.apTotal>0?Math.round((s.apScore/s.apTotal)*100):null,otcPct=s.otcTotal>0?Math.round((s.otcScore/s.otcTotal)*100):null;
    return (
      <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm,padding:"2rem",display:"flex",flexDirection:"column",alignItems:"center"}}>
        {FONTS}
        <div style={{maxWidth:700,width:"100%"}}>
          <div style={{textAlign:"center",padding:"1.875rem",background:T.s,border:`1px solid ${T.b}`,borderRadius:14,marginBottom:"1.125rem"}}>
            <div style={{fontSize:"4.5rem",fontFamily:T.ff,color:pass?T.g:pct>=50?T.a:T.r,lineHeight:1}}>{pct}%</div>
            <div style={{color:T.t2,marginTop:"0.4rem",fontSize:"0.81rem"}}>{s.score} of {s.total} correct</div>
            <span style={{display:"inline-block",margin:"0.6rem auto 0",padding:"0.25rem 0.875rem",borderRadius:99,background:pass?"#0e3020":"#2e0e0e",color:pass?T.g:T.r,fontSize:"0.73rem",border:`1px solid ${pass?T.gD:T.rD}`}}>{pass?"✓ PASS — Well done!":"✗ NEEDS REVIEW — Keep going!"}</span>
            {(apPct!==null||otcPct!==null)&&<div style={{display:"flex",gap:"0.625rem",justifyContent:"center",marginTop:"0.875rem",flexWrap:"wrap"}}>
              {apPct!==null&&<div style={{padding:"0.5rem 1rem",background:T.card,border:`1px solid ${T.b}`,borderRadius:8,textAlign:"center"}}><div style={{fontSize:"1.4rem",color:T.blL,fontFamily:T.ff}}>{apPct}%</div><div style={{fontSize:"0.67rem",color:T.t3}}>AP</div></div>}
              {otcPct!==null&&<div style={{padding:"0.5rem 1rem",background:T.card,border:`1px solid ${T.b}`,borderRadius:8,textAlign:"center"}}><div style={{fontSize:"1.4rem",color:T.g,fontFamily:T.ff}}>{otcPct}%</div><div style={{fontSize:"0.67rem",color:T.t3}}>OTC</div></div>}
            </div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"1.125rem"}}>
            {s.questions.map((q,i)=>{const a=s.answers[i],ok=a?.sel===q.ans;return(
              <div key={q.id} style={{background:T.card,border:`1px solid ${ok?T.gD:T.rD}`,borderRadius:8,padding:"0.875rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.25rem"}}>
                  <span style={{fontSize:"0.68rem",color:T.t3}}>Q{i+1} · {q.cat}</span>
                  <span style={{fontSize:"0.68rem",color:ok?T.g:T.r}}>{ok?"✓ Correct":"✗ Wrong"}</span>
                </div>
                <p style={{margin:"0 0 0.25rem",fontSize:"0.79rem",color:T.t,lineHeight:1.5}}>{q.q}</p>
                {!ok&&<><p style={{margin:"0 0 0.125rem",fontSize:"0.73rem",color:T.t2}}>Your answer: <span style={{color:T.r}}>{a?.sel!=null?q.opts[a.sel]:"Timed out"}</span></p><p style={{margin:0,fontSize:"0.73rem",color:T.t2}}>Correct: <span style={{color:T.g}}>{q.opts[q.ans]}</span></p></>}
              </div>
            );})}
          </div>
          <div style={{display:"flex",gap:"0.75rem"}}>
            <button onClick={startTest} style={{flex:1,padding:"0.875rem",background:T.a,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>Retry</button>
            <button onClick={()=>setScreen("interview-setup")} style={{flex:1,padding:"0.875rem",background:"transparent",color:T.blL,border:`1px solid ${T.b}`,borderRadius:8,fontFamily:T.fm,cursor:"pointer"}}>Try AI Interview</button>
            <button onClick={()=>setScreen("home")} style={{flex:1,padding:"0.875rem",background:"transparent",color:T.t2,border:`1px solid ${T.b}`,borderRadius:8,fontFamily:T.fm,cursor:"pointer"}}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ── INTERVIEW SETUP ───────────────────────────────────────────────────
  if(screen==="interview-setup") return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm}}>
      {FONTS}<Nav/>
      <div style={{maxWidth:580,margin:"0 auto",padding:"2rem"}}>
        <div style={{fontSize:"0.67rem",color:T.t3,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:"0.5rem"}}>AI Interview Simulation</div>
        <h1 style={{fontFamily:T.ff,fontSize:"2.1rem",color:T.aL,margin:"0 0 0.5rem",lineHeight:1.15}}>Mock Interview</h1>
        <p style={{color:T.t2,fontSize:"0.78rem",marginBottom:"2rem",lineHeight:1.65}}>Jordan Wei, your AI interview coach, will conduct a structured 5-question mock interview tailored to your <strong style={{color:T.t}}>{currentUser?.experience} yrs</strong> of experience in <strong style={{color:T.t}}>{currentUser?.domain}</strong>. Choose your preferred interaction mode below.</p>

        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"1.875rem"}}>
          {[
            {mode:"text",icon:"💬",title:"Text Interview",desc:"Type your responses. Best for thoughtful, detailed answers at your own pace.",badge:"Always works"},
            {mode:"voice",icon:"🎙️",title:"Voice + Text",desc:"Speak your answers via microphone. Interviewer speaks to you via text-to-speech.",badge:"Chrome recommended"},
            {mode:"video",icon:"🎥",title:"Video + Voice",desc:"Camera on with voice input. The most realistic interview simulation experience.",badge:"Requires camera permission"},
          ].map(opt=>(
            <button key={opt.mode} onClick={()=>startInterview(opt.mode)} style={{padding:"1.25rem",background:T.card,border:`1px solid ${T.b}`,borderRadius:10,cursor:"pointer",textAlign:"left",display:"flex",gap:"1rem",alignItems:"center",transition:"border-color 0.2s",outline:"none"}}>
              <span style={{fontSize:"1.75rem",flexShrink:0}}>{opt.icon}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem"}}>
                  <span style={{fontSize:"0.9rem",color:T.t,fontWeight:500}}>{opt.title}</span>
                  <span style={{fontSize:"0.61rem",padding:"0.1rem 0.425rem",borderRadius:99,background:T.s,color:T.t3,border:`1px solid ${T.b}`}}>{opt.badge}</span>
                </div>
                <span style={{fontSize:"0.74rem",color:T.t2,lineHeight:1.5}}>{opt.desc}</span>
              </div>
              <span style={{color:T.t3}}>→</span>
            </button>
          ))}
        </div>

        <div style={{background:T.s,border:`1px solid ${T.b}`,borderRadius:10,padding:"1rem"}}>
          <div style={{fontSize:"0.67rem",color:T.t3,marginBottom:"0.625rem",letterSpacing:"0.1em"}}>WHAT TO EXPECT IN YOUR SESSION</div>
          {["5 targeted questions across AP, OTC, process design, and ERP topics","Difficulty calibrated to your experience level and self-rated confidence","Detailed feedback: overall rating, communication, technical depth, process understanding","Personalised 30-day action plan based on your actual interview performance"].map((item,i)=>(
            <div key={i} style={{display:"flex",gap:"0.5rem",padding:"0.3rem 0",fontSize:"0.75rem",color:T.t2}}>
              <span style={{color:T.a,flexShrink:0}}>→</span>{item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── INTERVIEW SESSION ──────────────────────────────────────────────────
  if(screen==="interview") return (
    <div style={{height:"100vh",background:T.bg,color:T.t,fontFamily:T.fm,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {FONTS}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes ripple{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.2);opacity:0}}`}</style>
      <div style={{borderBottom:`1px solid ${T.b}`,padding:"0.7rem 1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <div style={{position:"relative",width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${T.a},${T.bl})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",fontWeight:600,color:"#fff",flexShrink:0}}>
            JW
            {isSpeaking&&<div style={{position:"absolute",inset:-3,borderRadius:"50%",border:`2px solid ${T.a}`,animation:"ripple 1.2s infinite"}}/>}
          </div>
          <div>
            <div style={{fontSize:"0.85rem",color:T.t,fontWeight:500}}>Jordan Wei <span style={{fontSize:"0.68rem",color:T.t3,marginLeft:"0.25rem"}}>{interviewMode==="video"?"📹 Video":interviewMode==="voice"?"🎙 Voice":"💬 Text"}</span></div>
            <div style={{fontSize:"0.68rem",color:isSpeaking?T.g:T.t3}}>{isSpeaking?"● Speaking...":isListening?"● Listening...":"AI Interview Coach"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.625rem"}}>
          <div style={{display:"flex",gap:"0.25rem"}}>
            {[1,2,3,4,5].map(n=><div key={n} style={{width:8,height:8,borderRadius:"50%",background:n<=qCount?T.a:T.b,transition:"background 0.3s"}}/>)}
          </div>
          <span style={{fontSize:"0.72rem",color:T.t3,marginLeft:"0.25rem"}}>Q{Math.min(qCount+1,5)}/5</span>
          <button onClick={stopInterview} style={{padding:"0.3rem 0.7rem",background:"transparent",color:T.r,border:`1px solid ${T.rD}`,borderRadius:99,fontFamily:T.fm,fontSize:"0.69rem",cursor:"pointer",marginLeft:"0.25rem"}}>✕ End</button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {interviewMode==="video"&&(
          <div style={{width:240,borderRight:`1px solid ${T.b}`,background:T.s,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.75rem",padding:"1rem",flexShrink:0}}>
            <div style={{position:"relative",width:"100%",aspectRatio:"4/3",background:T.bg,borderRadius:10,overflow:"hidden",border:`1px solid ${T.b}`}}>
              {videoActive?<video ref={videoRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"0.375rem",color:T.t3,fontSize:"0.73rem"}}><span style={{fontSize:"1.5rem"}}>📷</span>Camera unavailable</div>}
              {isListening&&<div style={{position:"absolute",bottom:8,right:8,padding:"0.18rem 0.4rem",background:"rgba(220,40,40,0.9)",borderRadius:99,fontSize:"0.63rem",color:"#fff",animation:"pulse 1s infinite"}}>● REC</div>}
            </div>
            <div style={{fontSize:"0.71rem",color:T.t2,textAlign:"center"}}>{currentUser?.name}</div>
          </div>
        )}

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
            {interviewMsgs.map((msg,i)=>(
              <div key={i} style={{display:"flex",gap:"0.625rem",alignItems:"flex-start",flexDirection:msg.role==="user"?"row-reverse":"row"}}>
                {msg.role==="assistant"&&<div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.a},${T.bl})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:600,color:"#fff",flexShrink:0}}>JW</div>}
                {msg.role==="user"&&<div style={{width:32,height:32,borderRadius:"50%",background:T.b,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",color:T.t2,flexShrink:0,fontWeight:600}}>{currentUser?.name?.[0]}</div>}
                <div style={{maxWidth:"74%",padding:"0.8rem 1rem",borderRadius:msg.role==="user"?"12px 2px 12px 12px":"2px 12px 12px 12px",background:msg.role==="user"?T.b:T.card,border:`1px solid ${T.b}`,fontSize:"0.81rem",lineHeight:1.65,color:T.t,whiteSpace:"pre-wrap"}}>{msg.content}</div>
              </div>
            ))}
            {interviewLoading&&<div style={{display:"flex",gap:"0.625rem",alignItems:"flex-start"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.a},${T.bl})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:600,color:"#fff",flexShrink:0}}>JW</div>
              <div style={{padding:"0.8rem 1rem",borderRadius:"2px 12px 12px 12px",background:T.card,border:`1px solid ${T.b}`}}>
                <div style={{display:"flex",gap:"0.3rem"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.a,animation:`bounce 1s ${i*0.18}s infinite`}}/>)}</div>
              </div>
            </div>}
            {interviewDone&&<div style={{textAlign:"center",padding:"1.25rem",background:T.s,border:`1px solid ${T.gD}`,borderRadius:12}}>
              <div style={{fontFamily:T.ff,fontSize:"1.1rem",color:T.g,marginBottom:"0.4rem"}}>Interview Complete ✓</div>
              <p style={{fontSize:"0.76rem",color:T.t2,margin:"0 0 0.875rem",lineHeight:1.5}}>Your detailed feedback report and 30-day action plan is ready.</p>
              <button onClick={()=>setScreen("interview-results")} style={{padding:"0.7rem 1.75rem",background:T.g,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer",fontSize:"0.83rem"}}>View Feedback Report →</button>
            </div>}
            <div ref={chatEndRef}/>
          </div>

          {!interviewDone&&<div style={{borderTop:`1px solid ${T.b}`,padding:"0.875rem 1.25rem",display:"flex",gap:"0.5rem",alignItems:"flex-end",flexShrink:0}}>
            <textarea value={interviewInput} onChange={e=>setInterviewInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg(interviewInput);}}} placeholder={interviewLoading?"Jordan is responding...":"Type your answer... (Enter to send, Shift+Enter for new line)"} disabled={interviewLoading} style={{flex:1,minHeight:52,maxHeight:110,padding:"0.7rem 0.875rem",background:T.s,border:`1px solid ${T.b}`,borderRadius:8,color:T.t,fontFamily:T.fm,fontSize:"0.8rem",resize:"none",outline:"none",lineHeight:1.5}}/>
            {(interviewMode==="voice"||interviewMode==="video")&&<button onClick={toggleVoice} style={{width:46,height:46,borderRadius:"50%",background:isListening?"#2e0a0a":T.s,border:`2px solid ${isListening?T.r:T.b}`,color:isListening?T.r:T.t2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0,transition:"all 0.2s"}}>{isListening?"⏹":"🎙"}</button>}
            <button onClick={()=>sendMsg(interviewInput)} disabled={interviewLoading||!interviewInput.trim()} style={{width:46,height:46,borderRadius:"50%",background:interviewInput.trim()?T.a:T.s,border:`1px solid ${interviewInput.trim()?T.a:T.b}`,color:interviewInput.trim()?"#fff":T.t3,cursor:interviewInput.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0,transition:"all 0.2s"}}>→</button>
          </div>}
        </div>
      </div>
    </div>
  );

  // ── INTERVIEW RESULTS ──────────────────────────────────────────────────
  if(screen==="interview-results") return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm}}>
      {FONTS}<Nav/>
      <div style={{maxWidth:720,margin:"0 auto",padding:"2rem"}}>
        <div style={{marginBottom:"1.75rem"}}>
          <div style={{fontSize:"0.67rem",color:T.t3,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:"0.4rem"}}>Interview Feedback Report</div>
          <h1 style={{fontFamily:T.ff,fontSize:"2rem",color:T.aL,margin:0}}>Feedback from Jordan Wei</h1>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:12,padding:"1.75rem",marginBottom:"1.25rem"}}>
          {interviewFeedback.split('\n').map((line,i)=>{
            if(line.includes("Overall Rating:")) return <div key={i} style={{fontFamily:T.ff,fontSize:"1.6rem",color:T.g,margin:"0 0 1rem"}}>{line.replace(/\*\*/g,"")}</div>;
            if(line.startsWith("**")&&line.endsWith("**")) return <div key={i} style={{fontSize:"0.85rem",color:T.aL,fontWeight:600,margin:"1rem 0 0.25rem",letterSpacing:"0.04em"}}>{line.replace(/\*\*/g,"")}</div>;
            if(line.startsWith("•")) return <div key={i} style={{paddingLeft:"1rem",margin:"0.2rem 0",fontSize:"0.8rem",color:T.t2,lineHeight:1.6}}>→ {line.slice(1).trim()}</div>;
            if(line.includes(" — ")) return <div key={i} style={{fontSize:"0.79rem",color:T.t2,lineHeight:1.65,marginBottom:"0.25rem"}}>{line}</div>;
            return <div key={i} style={{fontSize:"0.79rem",color:T.t2,lineHeight:line?1.65:1,margin:line?"0":"0.375rem 0"}}>{line}</div>;
          })}
        </div>
        <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
          <button onClick={()=>setScreen("interview-setup")} style={{flex:1,minWidth:150,padding:"0.875rem",background:T.a,color:"#fff",border:"none",borderRadius:8,fontFamily:T.fm,fontWeight:600,cursor:"pointer"}}>Retake Interview</button>
          <button onClick={startTest} style={{flex:1,minWidth:150,padding:"0.875rem",background:"transparent",color:T.blL,border:`1px solid ${T.b}`,borderRadius:8,fontFamily:T.fm,cursor:"pointer"}}>Take Mock Test</button>
          <button onClick={()=>setScreen("home")} style={{flex:1,minWidth:150,padding:"0.875rem",background:"transparent",color:T.t2,border:`1px solid ${T.b}`,borderRadius:8,fontFamily:T.fm,cursor:"pointer"}}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ──────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.t,fontFamily:T.fm}}>
      {FONTS}
      <Nav extra={<button onClick={()=>setScreen("import")} style={{padding:"0.3rem 0.7rem",background:"transparent",color:T.t2,border:`1px solid ${T.b}`,borderRadius:99,fontFamily:T.fm,fontSize:"0.68rem",cursor:"pointer"}}>+ Import</button>}/>
      <div style={{maxWidth:1040,margin:"0 auto",padding:"1.75rem"}}>
        <div style={{marginBottom:"1.5rem"}}>
          <h1 style={{fontFamily:T.ff,fontSize:"clamp(1.3rem,3vw,1.85rem)",margin:"0 0 0.2rem",color:T.t}}>Welcome back, {currentUser?.name?.split(' ')[0]}.</h1>
          <p style={{color:T.t2,margin:0,fontSize:"0.77rem"}}>{exp?.title} · {currentUser?.domain}{st.attempts>0?` · ${st.attempts} test${st.attempts>1?"s":""} completed`:""}</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:"0.625rem",marginBottom:"1rem"}}>
          {[{label:"Attempts",val:st.attempts||"—",col:T.blL},{label:"Avg Score",val:st.attempts?`${st.avgScore}%`:"—",col:T.t},{label:"Best",val:st.attempts?`${st.bestScore}%`:"—",col:T.g},{label:"Pass Rate",val:st.attempts?`${st.passRate}%`:"—",col:st.passRate>=70?T.g:st.passRate>=50?T.a:T.r}].map(c=>(
            <div key={c.label} style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:9,padding:"0.875rem"}}>
              <div style={{fontSize:"1.55rem",fontFamily:T.ff,color:c.col,marginBottom:"0.2rem"}}>{c.val}</div>
              <div style={{fontSize:"0.64rem",color:T.t3,letterSpacing:"0.05em"}}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"minmax(240px,1fr) minmax(240px,1fr)",gap:"0.75rem",marginBottom:"0.75rem"}}>
          <div style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:9,padding:"1rem"}}>
            <div style={{fontSize:"0.65rem",color:T.t3,marginBottom:"0.75rem",letterSpacing:"0.12em"}}>SKILL RADAR{st.attempts>0?" · SELF vs ACTUAL":""}</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={65}>
                <PolarGrid stroke={T.b}/><PolarAngleAxis dataKey="skill" tick={{fill:T.t2,fontSize:10,fontFamily:"IBM Plex Mono"}}/><PolarRadiusAxis angle={90} domain={[0,100]} tick={false} axisLine={false}/>
                <Radar name="Self" dataKey="Self" stroke={T.aL} fill={T.aL} fillOpacity={0.12} strokeWidth={1.5}/>
                {st.attempts>0&&<Radar name="Actual" dataKey="Actual" stroke={T.g} fill={T.g} fillOpacity={0.12} strokeWidth={1.5}/>}
              </RadarChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:"1rem",justifyContent:"center",fontSize:"0.65rem",color:T.t2}}>
              <span><span style={{color:T.aL}}>●</span> Self</span>
              {st.attempts>0&&<span><span style={{color:T.g}}>●</span> Actual</span>}
            </div>
          </div>
          <div style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:9,padding:"1rem"}}>
            <div style={{fontSize:"0.65rem",color:T.t3,marginBottom:"0.75rem",letterSpacing:"0.12em"}}>FOCUS AREAS</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
              {recs.map((r,i)=>(
                <div key={i} style={{background:T.s,border:`1px solid ${T.b}`,borderRadius:7,padding:"0.65rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.15rem"}}>
                    <span style={{fontSize:"0.77rem",color:T.t,fontWeight:500}}>{r.icon} {r.area}</span>
                    <span style={{fontSize:"0.59rem",padding:"0.08rem 0.375rem",borderRadius:99,color:priColor(r.pri),border:`1px solid ${priColor(r.pri)}`}}>{r.pri}</span>
                  </div>
                  <p style={{margin:0,fontSize:"0.7rem",color:T.t2,lineHeight:1.5}}>{r.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {st.attempts>0&&<div style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:9,padding:"1rem",marginBottom:"0.75rem"}}>
          <div style={{fontSize:"0.65rem",color:T.t3,marginBottom:"0.875rem",letterSpacing:"0.12em"}}>CATEGORY PERFORMANCE</div>
          {[{label:"AP Questions",val:st.apPerf,col:T.blL},{label:"OTC Questions",val:st.otcPerf,col:T.g},{label:"Overall Average",val:st.avgScore,col:T.aL}].map(b=>(
            <div key={b.label} style={{marginBottom:"0.75rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.73rem",marginBottom:"0.275rem"}}>
                <span style={{color:T.t2}}>{b.label}</span>
                <div style={{display:"flex",gap:"0.5rem"}}><span style={{fontSize:"0.65rem",color:T.t3}}>Target 70%</span><span style={{color:b.val>=70?T.g:b.val>=50?T.a:T.r,fontWeight:600}}>{b.val}%</span></div>
              </div>
              <div style={{height:6,background:T.s,borderRadius:99,position:"relative"}}>
                <div style={{width:`${b.val}%`,height:"100%",background:b.col,borderRadius:99,transition:"width 1s"}}/>
                <div style={{position:"absolute",top:0,left:"70%",width:2,height:"100%",background:T.t3,borderRadius:1}}/>
              </div>
            </div>
          ))}
        </div>}

        {sessions.length>0&&<div style={{background:T.card,border:`1px solid ${T.b}`,borderRadius:9,padding:"1rem",marginBottom:"0.75rem"}}>
          <div style={{fontSize:"0.65rem",color:T.t3,marginBottom:"0.75rem",letterSpacing:"0.12em"}}>ATTEMPT HISTORY</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.73rem"}}>
              <thead><tr style={{color:T.t3,borderBottom:`1px solid ${T.b}`}}>{["#","Date","Overall","AP","OTC","Result"].map(h=><th key={h} style={{textAlign:"left",padding:"0.3rem 0.5rem",fontWeight:500,letterSpacing:"0.04em"}}>{h}</th>)}</tr></thead>
              <tbody>{sessions.map((s,i)=>{const pct=Math.round((s.score/s.total)*100),pass=pct>=70;return(
                <tr key={s.id} style={{borderBottom:`1px solid ${T.b}`,color:T.t2}}>
                  <td style={{padding:"0.35rem 0.5rem",color:T.t3}}>{sessions.length-i}</td>
                  <td style={{padding:"0.35rem 0.5rem"}}>{s.date}</td>
                  <td style={{padding:"0.35rem 0.5rem",color:pass?T.g:pct>=50?T.a:T.r,fontWeight:600}}>{pct}%</td>
                  <td style={{padding:"0.35rem 0.5rem",color:T.blL}}>{s.apTotal>0?`${Math.round((s.apScore/s.apTotal)*100)}%`:"—"}</td>
                  <td style={{padding:"0.35rem 0.5rem",color:T.g}}>{s.otcTotal>0?`${Math.round((s.otcScore/s.otcTotal)*100)}%`:"—"}</td>
                  <td style={{padding:"0.35rem 0.5rem"}}><span style={{padding:"0.1rem 0.4rem",borderRadius:99,fontSize:"0.65rem",background:pass?"#0e3020":"#2e0e0e",color:pass?T.g:T.r,border:`1px solid ${pass?T.gD:T.rD}`}}>{pass?"Pass":"Fail"}</span></td>
                </tr>
              );})}</tbody>
            </table>
          </div>
        </div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
          <div style={{background:T.s,border:`1px solid ${T.b}`,borderRadius:10,padding:"1.375rem"}}>
            <div style={{fontFamily:T.ff,fontSize:"1.1rem",color:T.t,marginBottom:"0.3rem"}}>Mock Test</div>
            <p style={{margin:"0 0 0.875rem",fontSize:"0.75rem",color:T.t2,lineHeight:1.55}}>10 randomised AP/OTC questions · 30s each · {questions.length} in bank</p>
            <div style={{display:"flex",gap:"0.35rem",marginBottom:"0.875rem"}}>{["Both","AP","OTC"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"0.25rem 0.7rem",background:filter===f?T.a:"transparent",color:filter===f?"#fff":T.t2,border:`1px solid ${filter===f?T.a:T.b}`,borderRadius:99,fontFamily:T.fm,fontSize:"0.69rem",cursor:"pointer",transition:"all 0.2s"}}>{f}</button>)}</div>
            <button onClick={startTest} style={{width:"100%",padding:"0.775rem",background:T.a,color:"#fff",border:"none",borderRadius:7,fontFamily:T.fm,fontWeight:600,cursor:"pointer",fontSize:"0.82rem"}}>Start Test →</button>
          </div>
          <div style={{background:T.s,border:`1px solid ${T.b}`,borderRadius:10,padding:"1.375rem"}}>
            <div style={{fontFamily:T.ff,fontSize:"1.1rem",color:T.t,marginBottom:"0.3rem"}}>AI Interview</div>
            <p style={{margin:"0 0 0.875rem",fontSize:"0.75rem",color:T.t2,lineHeight:1.55}}>5 live questions with Jordan Wei · Voice, video, or text · Full feedback report</p>
            <div style={{display:"flex",gap:"0.35rem",marginBottom:"0.875rem"}}>
              {[["💬","Text"],["🎙","Voice"],["🎥","Video"]].map(([ic,lb])=><span key={lb} style={{padding:"0.25rem 0.6rem",background:T.card,border:`1px solid ${T.b}`,borderRadius:99,fontSize:"0.66rem",color:T.t3}}>{ic} {lb}</span>)}
            </div>
            <button onClick={()=>setScreen("interview-setup")} style={{width:"100%",padding:"0.775rem",background:`linear-gradient(135deg,${T.a},${T.bl})`,color:"#fff",border:"none",borderRadius:7,fontFamily:T.fm,fontWeight:600,cursor:"pointer",fontSize:"0.82rem"}}>Start Interview →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
