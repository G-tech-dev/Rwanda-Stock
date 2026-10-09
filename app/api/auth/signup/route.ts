import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "customer" ? "customer" : body.role === "trader" ? "trader" : null;
    const businessName = typeof body.businessName === "string" ? body.businessName.trim().slice(0,100) : "";
    const businessType = typeof body.businessType === "string" ? body.businessType.trim().slice(0,60) : "Retail shop";
    if (name.length < 2 || name.length > 100) return NextResponse.json({error:"Name must be 2–100 characters."},{status:400});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({error:"Enter a valid email."},{status:400});
    if (password.length < 10 || password.length > 128) return NextResponse.json({error:"Password must be 10–128 characters."},{status:400});
    if (!role) return NextResponse.json({error:"Choose trader or customer."},{status:400});
    if (role === "trader" && businessName.length < 2) return NextResponse.json({error:"Enter your business name."},{status:400});
    const db = await getDatabase();
    if (await db.collection("users").findOne({email})) return NextResponse.json({error:"An account with this email already exists."},{status:409});
    const userId = randomUUID();
    const businessId = role === "trader" ? randomUUID() : "customer-" + userId;
    const now = new Date();
    await db.collection("users").insertOne({userId,name,email,passwordHash:await hash(password,12),role,businessId,businessName:role==="trader"?businessName:null,businessType,createdAt:now,updatedAt:now});
    if (role === "trader") {
      await db.collection("businesses").insertOne({businessId,ownerUserId:userId,name:businessName,type:businessType,createdAt:now,updatedAt:now});
      await db.collection("trader_wallets").insertOne({businessId,ownerUserId:userId,balanceRwf:0,createdAt:now,updatedAt:now});
    }
    await createSession({userId,email,name,role,businessId});
    return NextResponse.json({user:{userId,name,email,role,businessId}}, {status:201});
  } catch (e) { console.error("signup failed",e); return NextResponse.json({error:"Could not create account. Check server configuration."},{status:500}); }
}
