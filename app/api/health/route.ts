import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
export const runtime="nodejs";
export async function GET(){if(!process.env.MONGODB_URI)return NextResponse.json({ok:false,database:"not_configured"},{status:503});try{const db=await getDatabase();await db.command({ping:1});return NextResponse.json({ok:true,database:"connected"});}catch{return NextResponse.json({ok:false,database:"unavailable"},{status:503});}}
