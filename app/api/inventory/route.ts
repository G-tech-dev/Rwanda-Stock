import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
 const {user,response}=await requireUser(["trader","admin"]); if(response)return response;
 const db=await getDatabase(); const filter=user!.role==="admin"?{}:{businessId:user!.businessId};
 const items=await db.collection("inventory").find(filter).sort({updatedAt:-1}).limit(500).toArray();
 return NextResponse.json({items:items.map(({_id,...x})=>x)});
}
export async function POST(req:NextRequest) {
 const {user,response}=await requireUser(["trader","admin"]); if(response)return response;
 try { const b=await req.json(); const name=typeof b.name==="string"?b.name.trim():""; const category=typeof b.category==="string"?b.category.trim().slice(0,80):"General"; const stock=Number(b.stock); const priceRwf=Number(b.priceRwf);
 if(name.length<1||name.length>120||!Number.isSafeInteger(stock)||stock<0||stock>100000000||!Number.isSafeInteger(priceRwf)||priceRwf<0||priceRwf>1000000000) return NextResponse.json({error:"Enter a name, non-negative whole stock, and valid price in RWF."},{status:400});
 const now=new Date(); const item={itemId:randomUUID(),businessId:user!.businessId,ownerUserId:user!.userId,name,category,stock,priceRwf,createdAt:now,updatedAt:now};
 await (await getDatabase()).collection("inventory").insertOne(item); const {_id,...result}=item as typeof item & {_id?:unknown}; return NextResponse.json({item:result},{status:201});
 } catch {return NextResponse.json({error:"Could not save inventory item."},{status:500});}
}
