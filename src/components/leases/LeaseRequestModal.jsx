import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';

const LeaseRequestModal = ({ isOpen, onClose, onSubmit, property }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await onSubmit({ message });
    setSubmitting(false);
    if (result?.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Request Lease Details</h2>
              <p className="text-emerald-100 text-sm mt-1">Ask your landlord to finalize the lease.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
            <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm">
              {property?.address || 'Your property'}
              {property?.unit_number ? `, ${property.unit_number}` : ''}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Let your landlord know you’re ready to finalize the lease."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />Send Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaseRequestModal;
