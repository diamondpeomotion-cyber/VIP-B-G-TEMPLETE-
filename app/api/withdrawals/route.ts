import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const shopId = body.shopId || body.tenantId;
    const rawAmount = body.amount;
    const payoutDetails = body.payoutDetails || { bankDetails: body.bankDetails };

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId or tenantId' }, { status: 400 });
    }

    // Convert rawAmount to decimal mock format
    const amtNum = Number(rawAmount) || 0;

    const amount = {
      sub: (other: any) => {
        const otherVal = typeof other === 'object' && other !== null && 'toNumber' in other ? other.toNumber() : Number(other) || 0;
        const result = amtNum - otherVal;
        return {
          sub: (v: any) => result - (v?.toNumber?.() || Number(v) || 0),
          lt: (v: any) => result < (v?.toNumber?.() || Number(v) || 0),
          gt: (v: any) => result > (v?.toNumber?.() || Number(v) || 0),
          toNumber: () => result
        };
      },
      lt: (other: any) => {
        const otherVal = typeof other === 'object' && other !== null && 'toNumber' in other ? other.toNumber() : Number(other) || 0;
        return amtNum < otherVal;
      },
      gt: (other: any) => {
        const otherVal = typeof other === 'object' && other !== null && 'toNumber' in other ? other.toNumber() : Number(other) || 0;
        return amtNum > otherVal;
      },
      toNumber: () => amtNum,
      mul: (val: number) => {
        return { toNumber: () => amtNum * val };
      }
    };

    const wallet = await prisma.shopWallet.findUnique({ where: { shopId } });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const available = wallet.balance.sub(wallet.reservedBalance);
    if (amount.lt(100)) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₹100' }, { status: 400 });
    }
    if (amount.gt(available)) {
      return NextResponse.json({ error: 'Insufficient available balance' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.shopWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.withdrawalRequest.create({
        data: { shopId, amount, status: 'PENDING', ...payoutDetails },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
