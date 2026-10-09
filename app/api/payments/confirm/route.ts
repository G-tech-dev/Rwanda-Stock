import { NextRequest,NextResponse } from "next/server";
import { confirmManualPayment } from "@/lib/payments";
import { requireUser } from "@/lib/auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const{user,response}=await requireUser(["trader"]);if(response)return response;
 let b:Record<string,unknown>;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid request body."},{status:400})}
 if(typeof b.txRef!=="string")return NextResponse.json({error:"Payment reference is required."},{status:400});
 try{return NextResponse.json(await confirmManualPayment(b.txRef,user!));}
 catch(e){const status=typeof e==="object"&&e!==null&&"statusCode"in e&&typeof e.statusCode==="number"?e.statusCode:400;return NextResponse.json({error:e instanceof Error?e.message:"Could not confirm payment."},{status});}
}
