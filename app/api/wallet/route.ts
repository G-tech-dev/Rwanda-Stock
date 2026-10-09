import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(){const{user,response}=await requireUser(["trader","admin"]);if(response)return response;const db=await getDatabase();const wallet=await db.collection("trader_wallets").findOne({businessId:user!.businessId});const entries=await db.collection("wallet_ledger").find({businessId:user!.businessId}).sort({createdAt:-1}).limit(100).toArray();return NextResponse.json({balanceRwf:Number(wallet?.balanceRwf||0),entries:entries.map(({_id,...x})=>x)});}
