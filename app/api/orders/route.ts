import { NextRequest,NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(){const{user,response}=await requireUser(["trader","admin"]);if(response)return response;const rows=await(await getDatabase()).collection("orders").find({businessId:user!.businessId}).sort({createdAt:-1}).limit(300).toArray();return NextResponse.json({orders:rows.map(({_id,...x})=>x)});}
export async function POST(req:NextRequest){
 const{user,response}=await requireUser(["trader","admin"]);if(response)return response;
 try{const b=await req.json();if(!Array.isArray(b.items)||b.items.length<1||b.items.length>50)return NextResponse.json({error:"A sale must contain 1–50 items."},{status:400});
 const db=await getDatabase();const normalized=[] as {itemId:string;name:string;quantity:number;unitPriceRwf:number;lineTotalRwf:number}[];let totalRwf=0;
 for(const raw of b.items){if(!raw||typeof raw.itemId!=="string")return NextResponse.json({error:"Invalid item."},{status:400});const quantity=Number(raw.quantity);if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100000)return NextResponse.json({error:"Quantity must be a positive whole number."},{status:400});const item=await db.collection("inventory").findOne({itemId:raw.itemId,businessId:user!.businessId});if(!item)return NextResponse.json({error:"An item was not found in this business inventory."},{status:404});if(Number(item.stock)<quantity)return NextResponse.json({error:"Not enough stock for "+item.name+"."},{status:409});const lineTotalRwf=Number(item.priceRwf)*quantity;if(!Number.isSafeInteger(lineTotalRwf)||lineTotalRwf<0)return NextResponse.json({error:"Invalid item price."},{status:400});normalized.push({itemId:String(item.itemId),name:String(item.name),quantity,unitPriceRwf:Number(item.priceRwf),lineTotalRwf});totalRwf+=lineTotalRwf;}
 if(!Number.isSafeInteger(totalRwf)||totalRwf<1)return NextResponse.json({error:"Sale total must be greater than zero."},{status:400});
 // Atomic conditional decrements prevent stock from going negative; compensate earlier decrements if a later item fails.
 const decremented=[] as {itemId:string;quantity:number}[];
 for(const line of normalized){const r=await db.collection("inventory").updateOne({itemId:line.itemId,businessId:user!.businessId,stock:{$gte:line.quantity}},{$inc:{stock:-line.quantity},$set:{updatedAt:new Date()}});if(!r.modifiedCount){for(const d of decremented)await db.collection("inventory").updateOne({itemId:d.itemId,businessId:user!.businessId},{$inc:{stock:d.quantity}});return NextResponse.json({error:"Stock changed during checkout. Please try again."},{status:409});}decremented.push({itemId:line.itemId,quantity:line.quantity});}
 const now=new Date();const order={orderId:randomUUID(),businessId:user!.businessId,traderUserId:user!.userId,items:normalized,totalRwf,currency:"RWF",paymentStatus:"pending",status:"created",createdAt:now,updatedAt:now};
 try{await db.collection("orders").insertOne(order);}catch(e){for(const d of decremented)await db.collection("inventory").updateOne({itemId:d.itemId,businessId:user!.businessId},{$inc:{stock:d.quantity}});throw e;}
 const{_id,...result}=order as typeof order & {_id?:unknown};return NextResponse.json({order:result},{status:201});
 }catch(e){console.error("order create failed",e);return NextResponse.json({error:"Could not record sale."},{status:500});}
}
