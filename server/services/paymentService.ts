import Stripe from 'stripe';

let stripe: Stripe | null = null;

// Initialize Stripe lazily when needed
const getStripe = (): Stripe => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required for payment processing');
    }
    
    stripe = new Stripe(secretKey);
    
    console.log('💳 Stripe payment service initialized');
  }
  return stripe;
};

export interface PaymentIntentData {
  amount: number; // Amount in cents
  currency: string;
  bookingReference: string;
  customerEmail: string;
  description: string;
}

export class PaymentService {
  static async createPaymentIntent(data: PaymentIntentData): Promise<{
    success: boolean;
    clientSecret?: string;
    paymentIntentId?: string;
    error?: string;
  }> {
    try {
      const stripeInstance = getStripe();
      
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          bookingReference: data.bookingReference,
          customerEmail: data.customerEmail,
        },
        description: data.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(`💳 Payment intent created: ${paymentIntent.id} for booking ${data.bookingReference}`);
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  static async confirmPayment(paymentIntentId: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const stripeInstance = getStripe();
      
      const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
      
      console.log(`💳 Payment status check: ${paymentIntent.id} - ${paymentIntent.status}`);
      
      return {
        success: true,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }

  static async handleWebhookEvent(event: Stripe.Event): Promise<{
    success: boolean;
    bookingReference?: string;
    paymentStatus?: string;
    error?: string;
  }> {
    try {
      console.log(`🔔 Processing webhook event: ${event.type}`);
      
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const bookingReference = paymentIntent.metadata?.bookingReference;
          
          console.log(`✅ Payment succeeded for booking: ${bookingReference}`);
          
          return {
            success: true,
            bookingReference,
            paymentStatus: 'succeeded',
          };
        }
        
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const bookingReference = paymentIntent.metadata?.bookingReference;
          
          console.log(`❌ Payment failed for booking: ${bookingReference}`);
          
          return {
            success: true,
            bookingReference,
            paymentStatus: 'failed',
          };
        }
        
        default:
          console.log(`ℹ️ Unhandled webhook event type: ${event.type}`);
          return {
            success: true,
          };
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      };
    }
  }
}