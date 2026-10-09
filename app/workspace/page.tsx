import {redirect} from "next/navigation";
import Link from "next/link";
import {getSession} from "@/lib/auth";
import {getDatabase} from "@/lib/mongodb";
import {MarketingLayout} from "../components/marketing";
import {Package,Users,Wallet,AlertTriangle,BarChart3} from "lucide-react";
import LogoutButton from "../components/logout-button";
import PendingPayments from "../components/pending-payments";
export const dynamic="force-dynamic";
const fmt=(n:number)=>new Intl.NumberFormat("en-RW",{style:"currency",currency:"RWF",maximumFractionDigits:0}).format(n);
export default async function WorkspacePage(){
 const user=await getSession();if(!user)redirect("/login");if(user.role==="customer")redirect("/payments");
 const db=await getDatabase();const businessId=user.businessId;
 const [items,lowStock,customers,orders,wallet,latest]=await Promise.all([
  db.collection("inventory").countDocuments({businessId}),
  db.collection("inventory").countDocuments({businessId,stock:{$lt:10}}),
  db.collection("customers").countDocuments({businessId}),
  db.collection("orders").find({businessId}).sort({createdAt:-1}).limit(10).toArray(),
  db.collection("trader_wallets").findOne({businessId}),
  db.collection("inventory").find({businessId}).sort({updatedAt:-1}).limit(10).toArray()
 ]);
 return <MarketingLayout><main className="workspace-page"><header className="workspace-heading"><div><span className="section-kicker">YOUR BUSINESS WORKSPACE</span><h1>Hello, {user.name}</h1><p>{user.role==="admin"?"Administrator": "Business owner"} · secure account session</p></div><LogoutButton/><Link href="/payments" className="marketing-button">Wallet & payments</Link></header>
 <section className="workspace-metrics"><article><Package/><span>Inventory items</span><strong>{items}</strong></article><article><AlertTriangle/><span>Low-stock items</span><strong>{lowStock}</strong></article><article><Users/><span>Customers</span><strong>{customers}</strong></article><article><Wallet/><span>Trader wallet</span><strong>{fmt(Number(wallet?.balanceRwf||0))}</strong></article></section>
 <section className="workspace-columns"><article className="workspace-panel"><div className="workspace-panel-title"><div><h2>Inventory</h2><p>Items stored for your business.</p></div><Link href="/api/inventory">Inventory API</Link></div>{latest.length?<div className="workspace-table"><table><thead><tr><th>Item</th><th>Stock</th><th>Price</th></tr></thead><tbody>{latest.map((x,i)=><tr key={String(x.itemId||i)}><td>{String(x.name)}</td><td>{Number(x.stock)}</td><td>{fmt(Number(x.priceRwf))}</td></tr>)}</tbody></table></div>:<p className="workspace-empty">No inventory yet. Add your first item through the inventory API.</p>}</article>
 <article className="workspace-panel"><div className="workspace-panel-title"><div><h2>Recent sales</h2><p>Orders recorded for this business.</p></div><Link href="/api/orders">Orders API</Link></div>{orders.length?<div className="workspace-orders">{orders.map((o,i)=><div className="workspace-order" key={String(o.orderId||i)}><span><strong>{String(o.orderId).slice(0,15)}…</strong><small>{String(o.paymentStatus||"pending")}</small></span><b>{fmt(Number(o.totalRwf||0))}</b></div>)}</div>:<p className="workspace-empty">No sales recorded yet. Use the orders API to record a sale.</p>}<Link href="/api/reports" className="workspace-report-link"><BarChart3 size={16}/> Open business reports API</Link></article></section>
 <div style={{marginTop:16}}><PendingPayments/></div>
 <p className="workspace-footnote">Amounts and statuses come from the database. Manual mobile-money confirmation is a trader assertion, not independent operator verification.</p></main></MarketingLayout>
}
