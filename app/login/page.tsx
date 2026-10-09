"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {MarketingLayout} from "../components/marketing";
export default function LoginPage(){
 const router=useRouter();const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[error,setError]=useState("");const[busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Sign-in failed.");router.push(d.user.role==="customer"?"/payments":"/workspace");router.refresh();}catch(e){setError(e instanceof Error?e.message:"Sign-in failed.");}finally{setBusy(false)}}
 return <MarketingLayout><main className="auth-page"><form className="auth-card" onSubmit={submit}><span className="section-kicker">WELCOME BACK</span><h1>Sign in to EasyPay Rwanda</h1><p>Open your business workspace or customer account.</p><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p className="auth-error" role="alert">{error}</p>}<button className="marketing-button auth-submit" disabled={busy}>{busy?"Signing in…":"Sign in"}</button><p className="auth-switch">New to EasyPay Rwanda? <Link href="/signup">Create an account</Link></p></form></main></MarketingLayout>
}
