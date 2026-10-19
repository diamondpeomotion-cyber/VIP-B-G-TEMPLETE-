import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // Secure cron with secret header
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const completedBookings = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { lte: twentyFourHoursAgo },
      escrow: { status: 'HELD' },
    },
    include: { escrow: true, shop: { include: { wallet: true } } },
  });

  for (const booking of completedBookings) {
    if (!booking.escrow || !booking.shop.wallet) continue;

    await prisma.$transaction(async (tx) => {
      // 1. Release escrow
      await tx.escrowTransaction.update({
        where: { id: booking.escrow!.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      // 2. Credit shop wallet
      await tx.shopWallet.update({
        where: { id: booking.shop.wallet!.id },
        data: {
          balance: { increment: booking.escrow!.netAmount },
          totalEarned: { increment: booking.escrow!.netAmount },
        },
      });

      // 3. Log transaction
      await tx.walletTransaction.create({
        data: {
          shopWalletId: booking.shop.wallet!.id,
          escrowId: booking.escrow!.id,
          type: 'ESCROW_RELEASE',
          amount: booking.escrow!.netAmount,
          description: `Released for booking ${booking.id}`,
        },
      });
    });
  }

  return NextResponse.json({ released: completedBookings.length });
}
