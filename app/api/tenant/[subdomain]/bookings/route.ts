import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest, { params }: { params: { subdomain: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { serviceId, staffId, bookingDate, startTime } = body;

  // 1. Resolve Shop
  const shop = await prisma.shop.findUnique({ where: { subdomain: params.subdomain } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  // 2. Fetch Service
  const service = await prisma.service.findFirst({
    where: { id: serviceId, shopId: shop.id, isActive: true },
  });
  if (!service) return NextResponse.json({ error: 'Service unavailable' }, { status: 400 });

  // 3. Check for slot conflicts
  const existing = await prisma.booking.findFirst({
    where: {
      shopId: shop.id,
      staffId: staffId || undefined,
      bookingDate: new Date(bookingDate),
      startTime,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });
  if (existing) return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });

  // 4. Calculate amounts
  const totalAmount = service.price;
  const advanceAmount = totalAmount.mul(0.25); // 25% advance

  // 5. Create Razorpay Order for advance
  const order = await razorpay.orders.create({
    amount: advanceAmount.mul(100).toNumber(), // paise
    currency: 'INR',
    receipt: `adv_${Date.now()}`,
  });

  // 6. Create Booking (PENDING until payment)
  const booking = await prisma.booking.create({
    data: {
      shopId: shop.id,
      customerId: session.user.id,
      serviceId: service.id,
      staffId: staffId || null,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime: addMinutes(startTime, service.duration),
      totalAmount,
      advanceAmount,
      paymentStatus: 'PENDING',
      status: 'PENDING',
    },
  });

  return NextResponse.json({
    bookingId: booking.id,
    razorpayOrderId: order.id,
    amount: advanceAmount.toNumber(),
    currency: 'INR',
  });
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + mins);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
