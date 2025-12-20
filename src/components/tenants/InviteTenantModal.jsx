import { useEffect, useState } from 'react';
import { X, Mail, User } from 'lucide-react';

const InviteTenantModal = ({ isOpen, onClose, onInvite, properties = [], defaultPropertyId = '' }) => {
  const [propertyId, setPropertyId] = useState(defaultPropertyId);
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultPropertyId) {
      setPropertyId(defaultPropertyId);
    } else if (properties.length === 1) {
      setPropertyId(properties[0].id);
    } else {
      setPropertyId('');
    }
  }, [isOpen, defaultPropertyId, properties]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    const result = await onInvite({
      propertyId,
      tenantEmail,
      tenantName
    });
    setSending(false);
    if (result?.success) {
      setTenantEmail('');
      setTenantName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Invite Tenant</h2>
              <p className="text-amber-100 text-sm mt-1">Send an email invitation to join a property</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="" disabled>Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}{property.unit_number ? `, ${property.unit_number}` : ''} ({property.city})
                </option>
              ))}
            </select>
            {properties.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">Create a property before inviting tenants.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tenant Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                placeholder="tenant@example.com"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tenant Name (optional)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !propertyId}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending invite...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Send Invite
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteTenantModal;
