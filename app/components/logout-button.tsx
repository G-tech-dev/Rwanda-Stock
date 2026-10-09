"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function LogoutButton(){const[busy,setBusy]=useState(false);const router=useRouter();return <button className="marketing-button workspace-logout" disabled={busy} onClick={async()=>{setBusy(true);try{await fetch("/api/auth/logout",{method:"POST"});router.push("/login");router.refresh();}finally{setBusy(false)}}}>{busy?"Signing out…":"Sign out"}</button>}
