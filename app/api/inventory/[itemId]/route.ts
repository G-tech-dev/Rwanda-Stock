import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
export const runtime="nodejs";
type Ctx={params:Promise<{itemId:string}>};
export async function PATCH(req:NextRequest,ctx:Ctx){
 const {user,response}=await requireUser(["trader","admin"]);if(response)return response;
 const {itemId}=await ctx.params;let b:Record<string,unknown>;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 const set:Record<string,unknown>={updatedAt:new Date()};
 if(typeof b.name==="string"&&b.name.trim().length>0&&b.name.trim().length<=120)set.name=b.name.trim();
 if(typeof b.category==="string")set.category=b.category.trim().slice(0,80);
 for(const k of ["stock","priceRwf"]){if(b[k]!==undefined){const n=Number(b[k]);if(!Number.isSafeInteger(n)||n<0)return NextResponse.json({error:"Stock and price must be non-negative whole numbers."},{status:400});set[k]=n}}
 const db=await getDatabase();const filter={itemId,...(user!.role==="admin"?{}:{businessId:user!.businessId})};
 const r=await db.collection("inventory").updateOne(filter,{$set:set});if(!r.matchedCount)return NextResponse.json({error:"Item not found."},{status:404});
 return NextResponse.json({ok:true});
}
export async function DELETE(_req:NextRequest,ctx:Ctx){
 const {user,response}=await requireUser(["trader","admin"]);if(response)return response;const {itemId}=await ctx.params;
 const r=await (await getDatabase()).collection("inventory").deleteOne({itemId,...(user!.role==="admin"?{}:{businessId:user!.businessId})});
 return r.deletedCount?NextResponse.json({ok:true}):NextResponse.json({error:"Item not found."},{status:404});
}
