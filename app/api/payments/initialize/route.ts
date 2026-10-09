import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const{user,response}=await requireUser();if(response)return response;
 if(!process.env.MONGODB_URI)return NextResponse.json({error:"Payments are not configured."},{status:503});
 let b:Record<string,unknown>;try{b=await req.json()}catch{return NextResponse.json({error:"Invalid request body."},{status:400})}
 const purpose=b.purpose,network=b.network;
 if(!["sale","wallet_topup","subscription"].includes(String(purpose)))return NextResponse.json({error:"Choose a valid payment type."},{status:400});
 if(network!=="mtn"&&network!=="airtel")return NextResponse.json({error:"Choose MTN MoMo or Airtel Money."},{status:400});
 const phone=typeof b.phone==="string"?b.phone.replace(/[\s()-]/g,""):"";
 if(!/^\+?\d{9,15}$/.test(phone))return NextResponse.json({error:"Enter a valid mobile-money phone number."},{status:400});
 if(purpose==="sale"&&user!.role!=="customer")return NextResponse.json({error:"Sign in with a customer account to pay for an order."},{status:403});
 if((purpose==="wallet_topup"||purpose==="subscription")&&user!.role!=="trader")return NextResponse.json({error:"Only a signed-in trader can pay for a wallet top-up or subscription."},{status:403});
 const db=await getDatabase();let amountRwf:number;let orderId:string|undefined;let businessId:string|undefined;let planId:string|undefined;
 if(purpose==="sale"){
   const raw=typeof b.orderId==="string"?b.orderId.trim():"";
   const order=await db.collection("orders").findOne({orderId:raw,paymentStatus:"pending"});
   if(!order)return NextResponse.json({error:"Pending order not found."},{status:404});
   amountRwf=Number(order.totalRwf);orderId=String(order.orderId);businessId=String(order.businessId);
 }else if(purpose==="subscription"){
   amountRwf=Number(process.env.RS_BUSINESS_MONTHLY_PRICE_RWF);planId="business_monthly";businessId=user!.businessId;
   if(!Number.isSafeInteger(amountRwf)||amountRwf<100)return NextResponse.json({error:"Subscription price is not configured. No payment was started."},{status:503});
 }else{
   amountRwf=Number(b.amountRwf);businessId=user!.businessId;
   if(!Number.isSafeInteger(amountRwf)||amountRwf<100||amountRwf>10000000)return NextResponse.json({error:"Top-up must be between 100 and 10,000,000 RWF."},{status:400});
 }
 if(!Number.isSafeInteger(amountRwf)||amountRwf<1)return NextResponse.json({error:"Invalid amount."},{status:400});
 const txRef="EP-"+randomUUID(),now=new Date(),ussdCode=network==="mtn"?"*182#":"*182*8*1#";
 const instructions=network==="mtn"
 ?["Dial *182# on the MTN MoMo phone.","Choose the appropriate merchant-payment option and enter the trader's merchant details.","Enter the exact amount and check the recipient name.","Enter your PIN only in the official MTN USSD menu.","Keep the MTN confirmation message and share the payment reference."]
 :["Dial *182*8*1# on the Airtel Money phone.","Follow the merchant-payment menu and enter the trader's merchant code.","Enter the exact amount and check the recipient name.","Enter your PIN only in the official Airtel USSD menu.","Keep the Airtel confirmation message and share the payment reference."];
 await db.collection("payments").insertOne({txRef,purpose,network,status:"pending",amountRwf,currency:"RWF",email:user!.email,name:user!.name,phone,payerUserId:user!.userId,...(businessId?{businessId}:{}),...(orderId?{orderId}:{}),...(planId?{planId}:{}),createdAt:now,updatedAt:now});
 return NextResponse.json({txRef,purpose,network,status:"pending",amountRwf,ussdCode,instructions});
}
