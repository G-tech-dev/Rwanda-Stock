import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){const{user,response}=await requireUser(["trader"]);if(response)return response;const rows=await(await getDatabase()).collection("payments").find({businessId:user!.businessId}).sort({createdAt:-1}).limit(100).toArray();return NextResponse.json({payments:rows.map(({_id,...x})=>x)});}
