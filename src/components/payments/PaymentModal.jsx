import { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { createPaymentIntent } from '../../services/stripe/payments.service';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentForm = ({ lease, onClose, onPaymentSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const rentAmount = useMemo(() => {
    const amount = lease?.monthly_rent ?? lease?.rent ?? 0;
    return Number(amount) || 0;
  }, [lease]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setProcessing(true);
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href
      },
      redirect: 'if_required'
    });

    if (confirmError) {
      setProcessing(false);
      onError(confirmError.message || 'Payment failed.');
      return;
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
      return;
    }

    setProcessing(false);
    onError('Payment did not complete.');
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">Payment Successful!</h3>
        <p className="text-slate-500 mt-2">Your rent payment is being processed.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
        <div className="w-full px-4 py-3 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-white">
          <PaymentElement />
        </div>
      </div>

      <button type="submit" disabled={processing || !stripe}
        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {processing ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
        ) : (<>Pay ${rentAmount.toLocaleString()}</>)}
      </button>

      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        Secured by Stripe
      </div>

      <p className="text-xs text-slate-400 text-center">Processing payment for {propertyLabel}</p>
    </form>
  );
};

const PaymentModal = ({ isOpen, onClose, lease, onPaymentSuccess }) => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const [clientSecret, setClientSecret] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !lease?.id || !publishableKey) return;
    let isMounted = true;
    const fetchIntent = async () => {
      setLoadingIntent(true);
      setError('');
      const { clientSecret: secret, error: intentError } = await createPaymentIntent({
        leaseId: lease.id,
        currency: 'usd'
      });
      if (!isMounted) return;
      if (intentError || !secret) {
        setError(intentError || 'Unable to start payment.');
        setClientSecret('');
      } else {
        setClientSecret(secret);
      }
      setLoadingIntent(false);
    };
    fetchIntent();
    return () => {
      isMounted = false;
    };
  }, [isOpen, lease?.id, publishableKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm">Pay Rent</p>
              <p className="text-3xl font-bold mt-1">
                ${(lease?.monthly_rent ?? lease?.rent ?? 0).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-emerald-100 text-sm mt-3">{lease?.property?.address || lease?.property}</p>
        </div>

        {!publishableKey ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Stripe is not configured. Add `VITE_STRIPE_PUBLISHABLE_KEY` to `.env.local`.
          </div>
        ) : loadingIntent ? (
          <div className="p-6 text-center text-sm text-slate-500">Preparing payment...</div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-500">{error}</div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm lease={lease} onClose={onClose} onPaymentSuccess={onPaymentSuccess} onError={setError} />
          </Elements>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentModal;
