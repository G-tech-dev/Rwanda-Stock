import { getDatabase } from "./mongodb";
import type { SessionUser } from "./auth";
export async function confirmManualPayment(txRef:string,trader:SessionUser){
 if(!/^RS-[a-f0-9-]{36}$/i.test(txRef))throw new Error("Invalid payment reference.");
 const db=await getDatabase(),payments=db.collection("payments");
 const payment=await payments.findOne({txRef});
 if(!payment){const e=new Error("Payment reference not found.");Object.assign(e,{statusCode:404});throw e;}
 if(payment.status==="trader_confirmed")return{status:"trader_confirmed",txRef,note:"Manual trader confirmation; not independently verified."};
 if(payment.status!=="pending")throw new Error("This payment is not pending confirmation.");
 if(payment.businessId!==trader.businessId){const e=new Error("This payment belongs to another business.");Object.assign(e,{statusCode:403});throw e;}
 const now=new Date();
 const updated=await payments.updateOne({txRef,status:"pending",businessId:trader.businessId},{$set:{status:"trader_confirmed",traderConfirmedAt:now,traderConfirmedBy:trader.userId,updatedAt:now,confirmationMethod:"manual_trader_confirmation"}});
 if(!updated.modifiedCount){const latest=await payments.findOne({txRef});if(latest?.status==="trader_confirmed")return{status:"trader_confirmed",txRef};throw new Error("Payment status changed. Refresh and check the record.");}
 if(payment.purpose==="wallet_topup"){
   const ledger=await db.collection("wallet_ledger").insertOne({entryId:txRef,txRef,businessId:trader.businessId,ownerUserId:trader.userId,type:"topup",amountRwf:Number(payment.amountRwf),createdAt:now});
   if(ledger.insertedId)await db.collection("trader_wallets").updateOne({businessId:trader.businessId},{$inc:{balanceRwf:Number(payment.amountRwf)},$set:{updatedAt:now},$setOnInsert:{businessId:trader.businessId,ownerUserId:trader.userId,createdAt:now}},{upsert:true});
 }else if(payment.purpose==="sale"&&payment.orderId){
   await db.collection("orders").updateOne({orderId:String(payment.orderId),businessId:trader.businessId,paymentStatus:"pending"},{$set:{paymentStatus:"trader_confirmed",paymentReference:txRef,traderConfirmedAt:now,updatedAt:now}});
 }else if(payment.purpose==="subscription"){
   await db.collection("subscriptions").updateOne({businessId:trader.businessId,planId:"business_monthly"},{$set:{businessId:trader.businessId,planId:"business_monthly",status:"trader_confirmed",lastPaymentReference:txRef,updatedAt:now},$setOnInsert:{createdAt:now},$max:{paidThrough:new Date(now.getTime()+30*24*60*60*1000)}},{upsert:true});
 }
 return{status:"trader_confirmed",txRef,note:"The trader recorded manual confirmation. The mobile-money operator has not independently verified this payment."};
}
