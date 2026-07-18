import { BillingPlan, Subscription, Invoice } from '@sectalk/shared-types';

export const PLANS: Record<BillingPlan['tier'], BillingPlan> = {
  free: {
    tier: 'free',
    name: 'Free Starter',
    pricePerSeat: 0,
    maxSeats: 5,
    entitlements: {
      webrtcGroupMeetings: false,
      threatDetection: false,
      customRetention: false,
      advancedSOC: false
    }
  },
  pro: {
    tier: 'pro',
    name: 'SecTalk Pro',
    pricePerSeat: 12,
    maxSeats: 50,
    entitlements: {
      webrtcGroupMeetings: true,
      threatDetection: true,
      customRetention: false,
      advancedSOC: false
    }
  },
  team: {
    tier: 'team',
    name: 'SecTalk for Teams',
    pricePerSeat: 20,
    maxSeats: 250,
    entitlements: {
      webrtcGroupMeetings: true,
      threatDetection: true,
      customRetention: true,
      advancedSOC: false
    }
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise Shield',
    pricePerSeat: 35,
    maxSeats: 999999, // unlimited for practical purposes
    entitlements: {
      webrtcGroupMeetings: true,
      threatDetection: true,
      customRetention: true,
      advancedSOC: true
    }
  }
};

// Check if a specific tier is entitled to a feature
export function hasEntitlement(
  tier: BillingPlan['tier'], 
  feature: keyof BillingPlan['entitlements']
): boolean {
  const plan = PLANS[tier];
  if (!plan) return false;
  return plan.entitlements[feature];
}

// Seat-based Billing Pricing calculation (with prorated logic for adding seats mid-month)
export interface ProrationCalculation {
  originalCost: number;
  newCost: number;
  proratedDue: number;
  daysRemaining: number;
  daysInMonth: number;
}

export function calculateProratedSeatAddition(
  tier: BillingPlan['tier'],
  currentSeats: number,
  addedSeats: number,
  billingCycleStart: Date,
  billingCycleEnd: Date,
  currentDate: Date = new Date()
): ProrationCalculation {
  const plan = PLANS[tier];
  const price = plan ? plan.pricePerSeat : 0;
  
  const msInDay = 24 * 60 * 60 * 1000;
  const daysInMonth = Math.round((billingCycleEnd.getTime() - billingCycleStart.getTime()) / msInDay) || 30;
  
  // Calculate remaining days
  const remainingTime = billingCycleEnd.getTime() - currentDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(remainingTime / msInDay));
  
  const originalCost = currentSeats * price;
  const newCost = (currentSeats + addedSeats) * price;
  
  // Prorated amount for the new seats only
  const additionalSeatCost = addedSeats * price;
  const proratedDue = parseFloat(((additionalSeatCost * daysRemaining) / daysInMonth).toFixed(2));
  
  return {
    originalCost,
    newCost,
    proratedDue,
    daysRemaining,
    daysInMonth
  };
}

// Invoice Generator mock helper
export function generateInvoice(
  subscription: Subscription,
  amount: number
): Omit<Invoice, 'id' | 'date'> {
  return {
    subscriptionId: subscription.id,
    amount,
    status: amount === 0 ? 'paid' : 'unpaid'
  };
}
