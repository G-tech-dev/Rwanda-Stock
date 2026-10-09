"use client";

import { useMemo, useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings, CircleHelp,
  Bell, CalendarDays, ArrowUpRight, Boxes, Wallet, AlertTriangle, Plus, ClipboardList,
  Truck, Search, Leaf, Coffee, Pill, BriefcaseBusiness, CheckCircle2, Clock3
} from "lucide-react";

type BusinessType = "Retail shop" | "Restaurant" | "Pharmacy" | "Services";
type Product = { name: string; category: string; stock: number; price: number; icon: string };
const inventoryByType: Record<BusinessType, Product[]> = {
  "Retail shop": [
    { name: "Cooking oil 5L", category: "Groceries", stock: 24, price: 8500, icon: "🛢️" },
    { name: "Rice 5kg", category: "Groceries", stock: 8, price: 7200, icon: "🍚" },
    { name: "Laundry soap", category: "Household", stock: 46, price: 1200, icon: "🧼" },
    { name: "Sugar 1kg", category: "Groceries", stock: 5, price: 1800, icon: "🧂" }
  ],
  Restaurant: [
    { name: "Rice (5kg bag)", category: "Ingredients", stock: 12, price: 7200, icon: "🍚" },
    { name: "Cooking oil 5L", category: "Ingredients", stock: 6, price: 8500, icon: "🛢️" },
    { name: "Fresh tomatoes", category: "Produce", stock: 18, price: 1500, icon: "🍅" },
    { name: "Mineral water", category: "Drinks", stock: 40, price: 500, icon: "💧" }
  ],
  Pharmacy: [
    { name: "First aid bandage", category: "First aid", stock: 32, price: 1500, icon: "🩹" },
    { name: "Hand sanitizer", category: "Hygiene", stock: 7, price: 2500, icon: "🧴" },
    { name: "Digital thermometer", category: "Equipment", stock: 4, price: 6500, icon: "🌡️" },
    { name: "Disposable masks", category: "Protection", stock: 60, price: 300, icon: "😷" }
  ],
  Services: [
    { name: "Printing paper", category: "Supplies", stock: 14, price: 6500, icon: "📄" },
    { name: "Ink cartridge", category: "Supplies", stock: 5, price: 18000, icon: "🖨️" },
    { name: "Packaging materials", category: "Materials", stock: 22, price: 1200, icon: "📦" },
    { name: "Cleaning supplies", category: "Operations", stock: 3, price: 4500, icon: "🧹" }
  ]
};
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Inventory", icon: Package },
  { label: "Sales", icon: ShoppingCart },
  { label: "Customers", icon: Users },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings }
];
const formatRwf = (amount: number) => new Intl.NumberFormat("en-RW", {
  style: "currency", currency: "RWF", maximumFractionDigits: 0
}).format(amount);

export default function Home() {
  const [businessType, setBusinessType] = useState<BusinessType>("Retail shop");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [products, setProducts] = useState(inventoryByType["Retail shop"]);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const filteredProducts = useMemo(() => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const lowStock = products.filter(p => p.stock < 10).length;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function changeBusiness(value: BusinessType) {
    setBusinessType(value);
    setProducts(inventoryByType[value].map(item => ({ ...item })));
    setSearch("");
  }
  function addProduct() {
    const name = window.prompt("Enter the product or item name:");
    if (!name?.trim()) return;
    const priceText = window.prompt("Enter the selling price in RWF (numbers only):", "1000");
    if (priceText === null) return;
    const price = Number(priceText);
    if (!Number.isFinite(price) || price < 0) { notify("Please enter a valid price."); return; }
    setProducts(current => [...current, { name: name.trim(), category: "New item", stock: 0, price, icon: "📦" }]);
    notify("Item added to this demo inventory.");
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Leaf size={23} strokeWidth={2.5}/></div><div><div className="brand-name">Rwanda Stock</div><div className="brand-sub">Business made simpler</div></div></div>
      <div className="nav-group"><div className="nav-label">WORKSPACE</div><nav className="nav-list" aria-label="Main navigation">
        {navItems.map(({label, icon: Icon}) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => { setActiveNav(label); if (label !== "Dashboard") notify(`${label} preview selected — full module is coming next.`); }}><Icon size={17}/>{label}</button>)}
      </nav></div>
      <div className="sidebar-bottom"><div className="help-card"><strong>Need a hand?</strong><p>Get help setting up your business workspace.</p><button onClick={() => notify("Help centre will be available soon.")}><CircleHelp size={13} style={{verticalAlign:"-2px",marginRight:5}}/>Open help centre</button></div><div className="profile"><div className="avatar">RS</div><div><strong>My Business</strong><span>Free plan · Rwanda</span></div></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">Rwanda · Business workspace</div><h1 className="page-title">{activeNav === "Dashboard" ? "Business overview" : activeNav}</h1></div><div className="top-actions"><div className="date-chip"><CalendarDays size={14} style={{verticalAlign:"-3px",marginRight:7}}/>Today</div><button className="icon-btn" aria-label="Notifications" onClick={() => notify("You're all caught up!") }><Bell size={17}/></button></div></header>
      <section className="welcome"><div><h2>Good business starts with clarity. 🌱</h2><p>Track your stock, understand your sales, and keep your business moving.</p></div><button className="welcome-cta" onClick={() => notify("Business setup wizard is coming next.")}>Set up my business <ArrowUpRight size={15} style={{verticalAlign:"-3px",marginLeft:5}}/></button></section>
      <div className="section-head"><div><h3>Your business at a glance</h3><p>Choose your business type to see tailored inventory examples.</p></div><select className="business-select" aria-label="Business type" value={businessType} onChange={e => changeBusiness(e.target.value as BusinessType)}><option>Retail shop</option><option>Restaurant</option><option>Pharmacy</option><option>Services</option></select></div>
      <section className="metrics" aria-label="Business metrics">
        <Metric icon={<Wallet size={16}/>} label="Sales today" value={formatRwf(186500)} foot={<><span className="positive">↑ 12.8%</span> vs yesterday</>}/>
        <Metric icon={<Boxes size={16}/>} label="Items in stock" value={String(products.reduce((sum,p) => sum+p.stock,0))} foot={<>{products.length} different items tracked</>}/>
        <Metric icon={<AlertTriangle size={16}/>} label="Low-stock items" value={String(lowStock)} foot={<span style={{color:lowStock ? "#a96d09" : "#16845b",fontWeight:700}}>{lowStock ? "Needs attention" : "All looking good"}</span>}/>
        <Metric icon={<ShoppingCart size={16}/>} label="Orders today" value="28" foot={<><span className="positive">↑ 4</span> vs yesterday</>}/>
      </section>
      <div className="content-grid" style={{marginTop:17}}>
        <section className="panel"><div className="panel-head"><div><h3>Stock overview</h3><p>Keep an eye on your items and prices.</p></div><button className="text-btn" onClick={addProduct}><Plus size={14} style={{verticalAlign:"-3px",marginRight:3}}/>Add item</button></div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,border:"1px solid #e6ece8",borderRadius:9,padding:"8px 10px",maxWidth:260}}><Search size={14} color="#8a968d"/><input aria-label="Search inventory" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{border:0,outline:0,width:"100%",fontSize:11,background:"transparent"}}/></div>
          <div className="table-wrap"><table><thead><tr><th>ITEM</th><th>STOCK</th><th>PRICE</th><th>STATUS</th></tr></thead><tbody>
            {filteredProducts.map((p,i) => <tr key={p.name+i}><td><div className="product-cell"><div className="product-dot">{p.icon}</div><div>{p.name}<div style={{fontSize:9,color:"#8b978e",fontWeight:400,marginTop:4}}>{p.category}</div></div></div></td><td>{p.stock} units</td><td>{formatRwf(p.price)}</td><td><span className={`stock-pill ${p.stock<10 ? "low" : ""}`}>{p.stock<10 ? "Low stock" : "In stock"}</span></td></tr>)}
            {filteredProducts.length===0 && <tr><td colSpan={4} style={{textAlign:"center",color:"#7a867d",padding:25}}>No matching items found.</td></tr>}
          </tbody></table></div>
        </section>
        <section className="panel"><div className="panel-head"><div><h3>Recent activity</h3><p>A quick look at business updates.</p></div><button className="text-btn" onClick={() => notify("You're viewing the latest activity.")}>View all</button></div>
          <div className="activity-list"><Activity icon={<CheckCircle2 size={16}/>} title="Sale recorded" detail={`A customer purchase · ${formatRwf(24500)}`} time="10:42 AM"/><Activity icon={<Package size={16}/>} title="Stock updated" detail={`12 items added to ${businessType.toLowerCase()} stock`} time="9:30 AM"/><Activity icon={<Users size={16}/>} title="New customer" detail="A new customer profile was added" time="Yesterday"/><Activity icon={<Clock3 size={16}/>} title="Daily summary ready" detail="Your business summary is ready to review" time="Yesterday"/></div>
        </section>
      </div>
      <div className="section-head"><div><h3>Quick actions</h3><p>Common tasks, right when you need them.</p></div></div>
      <section className="quick-grid">
        <QuickAction icon={<Plus size={18}/>} title="Add stock item" detail="Register a new product" onClick={addProduct}/>
        <QuickAction icon={<ShoppingCart size={18}/>} title="Record a sale" detail="Track a customer purchase" onClick={() => notify("Sales entry form is the next module to build.")}/>
        <QuickAction icon={<ClipboardList size={18}/>} title="View reports" detail="Understand your performance" onClick={() => {setActiveNav("Reports");notify("Reports preview selected — coming next.");}}/>
        <QuickAction icon={<Truck size={18}/>} title="Suppliers" detail="Manage your supply contacts" onClick={() => notify("Supplier management is coming next.")}/>
        <QuickAction icon={businessType==="Restaurant" ? <Coffee size={18}/> : businessType==="Pharmacy" ? <Pill size={18}/> : <BriefcaseBusiness size={18}/>} title="Business tools" detail={`Tools for ${businessType.toLowerCase()}`} onClick={() => notify(`Showing tools tailored for: ${businessType}.`)}/>
        <QuickAction icon={<BarChart3 size={18}/>} title="Sales summary" detail="Review daily totals" onClick={() => notify("Sales reports are coming next.")}/>
      </section>
      <div className="footer-note">Rwanda Stock · Built for Rwanda's small businesses · Demo figures only</div>
    </main>
    {toast && <div role="status" className="toast">{toast}</div>}
  </div>;
}

function Metric({icon,label,value,foot}:{icon:React.ReactNode;label:string;value:string;foot:React.ReactNode}) {
  return <div className="metric"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-foot">{foot}</div></div>;
}
function Activity({icon,title,detail,time}:{icon:React.ReactNode;title:string;detail:string;time:string}) {
  return <div className="activity"><div className="activity-icon">{icon}</div><div className="activity-text"><strong>{title}</strong><p>{detail}</p></div><div className="activity-time">{time}</div></div>;
}
function QuickAction({icon,title,detail,onClick}:{icon:React.ReactNode;title:string;detail:string;onClick:()=>void}) {
  return <button className="quick-action" onClick={onClick}><div className="quick-icon">{icon}</div><div><strong>{title}</strong><span>{detail}</span></div></button>;
}