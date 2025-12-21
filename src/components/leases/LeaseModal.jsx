import { useEffect, useState } from 'react';
import { X, FileText, Mail, Calendar, DollarSign } from 'lucide-react';

const LeaseModal = ({ isOpen, onClose, onCreate, onUpdate, properties = [], mode = 'create', lease = null }) => {
  const [propertyId, setPropertyId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    if (lease) {
      setPropertyId(lease.property_id || lease.property?.id || '');
      setTenantName(lease.tenant?.full_name || lease.tenant_name || '');
      setTenantEmail(lease.tenant?.email || lease.tenant_email || '');
      setStartDate(lease.start_date || lease.startDate || '');
      setEndDate(lease.end_date || lease.endDate || '');
      setMonthlyRent(String(lease.monthly_rent ?? lease.rent ?? ''));
      setSecurityDeposit(lease.security_deposit != null ? String(lease.security_deposit) : '');
      setStatus(lease.status || 'active');
    } else {
      if (properties.length === 1) {
        setPropertyId(properties[0].id);
      } else {
        setPropertyId('');
      }
      setTenantName('');
      setTenantEmail('');
      setStartDate('');
      setEndDate('');
      setMonthlyRent('');
      setSecurityDeposit('');
      setStatus('active');
    }
    setError('');
  }, [isOpen, properties, lease]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      propertyId,
      tenantName: tenantName?.trim() || null,
      tenantEmail,
      startDate,
      endDate,
      monthlyRent: monthlyRent ? Number(monthlyRent) : 0,
      securityDeposit: securityDeposit ? Number(securityDeposit) : null,
      status
    };

    const result = isEdit
          ? await onUpdate?.(lease?.id, {
          start_date: payload.startDate,
          end_date: payload.endDate,
          monthly_rent: payload.monthlyRent,
          security_deposit: payload.securityDeposit,
          status: payload.status
        })
      : await onCreate(payload);
    setSaving(false);
    if (result?.success) {
      onClose();
    } else {
      const message = result?.error?.message || result?.error || 'Unable to create lease.';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">
                {isView ? 'Lease Details' : isEdit ? 'Edit Lease' : 'Create Lease'}
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {isView ? 'Review lease information' : 'Link a tenant to a property'}
              </p>
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
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
              disabled={isView || isEdit}
            >
              <option value="" disabled>Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}{property.unit_number ? `, ${property.unit_number}` : ''} ({property.city})
                </option>
              ))}
            </select>
            {properties.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">Add a property before creating leases.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tenant Name</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Tenant full name"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                disabled={isView || isEdit}
              />
            </div>
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
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
                disabled={isView || isEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={isView}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={isView}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Rent</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={isView}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Security Deposit</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  disabled={isView}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                disabled={isView}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="terminated">Terminated</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {!isView && (
            <button
              type="submit"
              disabled={saving || !propertyId}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEdit ? 'Saving changes...' : 'Creating lease...'}
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  {isEdit ? 'Save Changes' : 'Create Lease'}
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default LeaseModal;
