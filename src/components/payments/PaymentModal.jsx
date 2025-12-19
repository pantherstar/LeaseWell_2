import { useState } from 'react';
import { Building2, CreditCard, X, CheckCircle } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, lease, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
        setSuccess(false);
      }, 2000);
    }, 2500);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm">Pay Rent</p>
              <p className="text-3xl font-bold mt-1">${lease?.rent?.toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-emerald-100 text-sm mt-3">{lease?.property}</p>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Payment Successful!</h3>
            <p className="text-slate-500 mt-2">Your rent payment has been processed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="flex gap-3">
              <button type="button" onClick={() => setPaymentMethod('card')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                <CreditCard className={`w-5 h-5 mx-auto ${paymentMethod === 'card' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className={`text-sm mt-1 ${paymentMethod === 'card' ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>Card</p>
              </button>
              <button type="button" onClick={() => setPaymentMethod('bank')}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'bank' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                <Building2 className={`w-5 h-5 mx-auto ${paymentMethod === 'bank' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className={`text-sm mt-1 ${paymentMethod === 'bank' ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>Bank</p>
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
                  <input type="text" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242" maxLength={19}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expiry</label>
                    <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY" maxLength={5}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">CVC</label>
                    <input type="text" value={cvc} onChange={(e) => setCvc(e.target.value)}
                      placeholder="123" maxLength={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">You'll be redirected to securely connect your bank via Plaid.</p>
              </div>
            )}

            <button type="submit" disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              ) : (<>Pay ${lease?.rent?.toLocaleString()}</>)}
            </button>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
              Secured by Stripe
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
