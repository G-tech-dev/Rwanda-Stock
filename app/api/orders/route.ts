import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireUser(["trader", "admin"]);
  if (response) return response;
  const rows = await (await getDatabase()).collection("orders")
    .find({ businessId: user!.businessId })
    .sort({ createdAt: -1 }).limit(300).toArray();
  return NextResponse.json({ orders: rows.map(({ _id, ...x }) => x) });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(["trader", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const amountRwf = Number(body.amountRwf);

    if (description.length < 2 || description.length > 160) {
      return NextResponse.json({ error: "Enter a description between 2 and 160 characters." }, { status: 400 });
    }
    if (!Number.isSafeInteger(amountRwf) || amountRwf < 100 || amountRwf > 10000000) {
      return NextResponse.json({ error: "Amount must be between 100 and 10,000,000 RWF." }, { status: 400 });
    }

    const now = new Date();
    const order = {
      orderId: "EP-" + randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase(),
      businessId: user!.businessId,
      traderUserId: user!.userId,
      description,
      totalRwf: amountRwf,
      currency: "RWF",
      paymentStatus: "pending",
      status: "created",
      createdAt: now,
      updatedAt: now
    };
    await (await getDatabase()).collection("orders").insertOne(order);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("payment request create failed", error);
    return NextResponse.json({ error: "Could not create payment request." }, { status: 500 });
  }
}