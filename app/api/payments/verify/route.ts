import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = await req.json();

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Update booking and create escrow
  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'ADVANCE_PAID', status: 'CONFIRMED' },
    });

    const escrow = await tx.escrowTransaction.create({
      data: {
        bookingId: booking.id,
        amount: booking.advanceAmount,
        platformFee: booking.advanceAmount.mul(0.1), // 10% platform fee example
        netAmount: booking.advanceAmount.mul(0.9),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: 'HELD',
      },
    });

    return { booking, escrow };
  });

  return Response.json({ success: true, result });
}
