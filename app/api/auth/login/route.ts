import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return NextResponse.json({error:"Email and password are required."},{status:400});
    const user = await (await getDatabase()).collection("users").findOne({email});
    if (!user || typeof user.passwordHash !== "string" || !(await compare(password,user.passwordHash))) return NextResponse.json({error:"Email or password is incorrect."},{status:401});
    await createSession({userId:String(user.userId),email:String(user.email),name:String(user.name),role:user.role,businessId:String(user.businessId)});
    return NextResponse.json({user:{userId:user.userId,name:user.name,email:user.email,role:user.role,businessId:user.businessId}});
  } catch (e) { console.error("login failed",e); return NextResponse.json({error:"Could not sign in. Check server configuration."},{status:500}); }
}
