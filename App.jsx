import React, { useState } from 'react';
import { Building2, Key, FileText, Wrench, CreditCard, LogOut, Upload, Camera, Calendar, DollarSign, CheckCircle, Clock, User, Mail, Home, Plus, Eye, Download, Send, X, Menu, Bell, Search, MoreVertical, Edit, Trash2, MessageSquare } from 'lucide-react';

// Mock Data
const mockLeases = [
  { id: 1, property: '742 Evergreen Terrace, Unit A', tenant: 'John Smith', startDate: '2024-01-15', endDate: '2025-01-14', rent: 1850, status: 'active', daysRemaining: 28 },
  { id: 2, property: '1428 Elm Street, Apt 3B', tenant: 'Sarah Johnson', startDate: '2024-03-01', endDate: '2025-02-28', rent: 2200, status: 'active', daysRemaining: 73 },
  { id: 3, property: '221B Baker Street', tenant: 'Mike Wilson', startDate: '2023-06-01', endDate: '2024-05-31', rent: 1650, status: 'expiring', daysRemaining: 7 },
  { id: 4, property: '350 Fifth Avenue, Unit 12', tenant: 'Emily Davis', startDate: '2024-02-15', endDate: '2025-02-14', rent: 3100, status: 'active', daysRemaining: 59 },
];

const mockMaintenanceRequests = [
  { id: 1, title: 'Leaking faucet in kitchen', property: '742 Evergreen Terrace, Unit A', status: 'pending', priority: 'medium', date: '2024-12-15', description: 'The kitchen faucet has been dripping constantly for 3 days.', tenant: 'John Smith' },
  { id: 2, title: 'AC not cooling properly', property: '1428 Elm Street, Apt 3B', status: 'in-progress', priority: 'high', date: '2024-12-14', description: 'Air conditioning unit is running but not producing cold air.', tenant: 'Sarah Johnson' },
  { id: 3, title: 'Broken window lock', property: '221B Baker Street', status: 'completed', priority: 'low', date: '2024-12-10', description: 'Lock mechanism on bedroom window is broken.', tenant: 'Mike Wilson' },
];

const mockDocuments = [
  { id: 1, name: 'Lease_Agreement_742_Evergreen.pdf', property: '742 Evergreen Terrace, Unit A', uploadDate: '2024-01-15', size: '2.4 MB', type: 'lease' },
  { id: 2, name: 'Lease_Agreement_1428_Elm.pdf', property: '1428 Elm Street, Apt 3B', uploadDate: '2024-03-01', size: '2.1 MB', type: 'lease' },
  { id: 3, name: 'Property_Inspection_221B.pdf', property: '221B Baker Street', uploadDate: '2024-11-20', size: '4.8 MB', type: 'inspection' },
  { id: 4, name: 'Insurance_Certificate.pdf', property: 'All Properties', uploadDate: '2024-06-01', size: '1.2 MB', type: 'insurance' },
];

const mockPayments = [
  { id: 1, tenant: 'John Smith', property: '742 Evergreen Terrace, Unit A', amount: 1850, date: '2024-12-01', status: 'paid', method: 'card' },
  { id: 2, tenant: 'Sarah Johnson', property: '1428 Elm Street, Apt 3B', amount: 2200, date: '2024-12-01', status: 'paid', method: 'bank' },
  { id: 3, tenant: 'Mike Wilson', property: '221B Baker Street', amount: 1650, date: '2024-12-01', status: 'pending', method: 'pending' },
  { id: 4, tenant: 'Emily Davis', property: '350 Fifth Avenue, Unit 12', amount: 3100, date: '2024-12-01', status: 'paid', method: 'card' },
];

// Payment Modal with Stripe-like UI
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

// Maintenance Request Modal
const MaintenanceModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }));
    setPhotos([...photos, ...newPhotos]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ title, description, priority, photos });
      setSubmitting(false);
      setTitle(''); setDescription(''); setPriority('medium'); setPhotos([]);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">New Maintenance Request</h2>
              <p className="text-amber-100 text-sm mt-1">Describe your issue and we'll get it fixed</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Issue Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Leaking faucet in bathroom"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Priority Level</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`flex-1 py-2.5 px-4 rounded-xl border-2 capitalize transition-all ${
                    priority === p
                      ? p === 'high' ? 'border-red-500 bg-red-50 text-red-600' :
                        p === 'medium' ? 'border-amber-500 bg-amber-50 text-amber-600' :
                        'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-slate-200 text-slate-500'
                  }`}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..." rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 resize-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Photos (Optional)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-amber-400 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click to upload photos</p>
              </label>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img src={photo.url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>) 
              : (<><Send className="w-5 h-5" />Submit Request</>)}
          </button>
        </form>
      </div>
    </div>
  );
};

// Document Upload Modal
const DocumentModal = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('lease');
  const [property, setProperty] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e) => {
    e.preventDefault();
    setUploading(true);
    setTimeout(() => {
      onUpload({ file, docType, property });
      setUploading(false);
      setFile(null); setDocType('lease'); setProperty('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Upload Document</h2>
              <p className="text-violet-200 text-sm mt-1">Add lease agreements, inspections, and more</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500">
              <option value="lease">Lease Agreement</option>
              <option value="inspection">Property Inspection</option>
              <option value="insurance">Insurance Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
            <input type="text" value={property} onChange={(e) => setProperty(e.target.value)}
              placeholder="e.g., 742 Evergreen Terrace, Unit A"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-400 transition-colors">
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="doc-upload" />
              <label htmlFor="doc-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-violet-500" />
                    <span className="text-slate-700 font-medium">{file.name}</span>
                  </div>
                ) : (
                  <><Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">Click to upload PDF</p></>
                )}
              </label>
            </div>
          </div>

          <button type="submit" disabled={uploading || !file}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>) 
              : (<><Upload className="w-5 h-5" />Upload Document</>)}
          </button>
        </form>
      </div>
    </div>
  );
};

// Login Page Component
const LoginPage = ({ onLogin }) => {
  const [userType, setUserType] = useState('landlord');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onLogin(userType); setLoading(false); }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PropFlow</h1>
          <p className="text-slate-400 mt-2">Property Management Simplified</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-slate-800/50 rounded-xl p-1 mb-8">
            <button onClick={() => setUserType('landlord')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userType === 'landlord' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Key className="w-4 h-4" />Landlord
            </button>
            <button onClick={() => setUserType('tenant')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userType === 'tenant' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Home className="w-4 h-4" />Tenant
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500" required />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-emerald-500 bg-slate-800" />Remember me
              </label>
              <a href="#" className="text-emerald-400 hover:text-emerald-300">Forgot password?</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>)
                : (<>Sign in as {userType === 'landlord' ? 'Landlord' : 'Tenant'}</>)}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">Don't have an account? <a href="#" className="text-emerald-400 hover:text-emerald-300 font-medium">Create one</a></p>
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">© 2024 PropFlow. All rights reserved.</p>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ userType, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [leases] = useState(mockLeases);
  const [maintenanceRequests, setMaintenanceRequests] = useState(mockMaintenanceRequests);
  const [documents, setDocuments] = useState(mockDocuments);
  const [payments, setPayments] = useState(mockPayments);
  const [notification, setNotification] = useState(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const menuItems = userType === 'landlord' ? [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'leases', label: 'Leases', icon: FileText },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ] : [
    { id: 'overview', label: 'My Unit', icon: Home },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'payments', label: 'Pay Rent', icon: CreditCard },
  ];

  const handlePaymentSuccess = () => {
    showNotification('Payment processed successfully!');
    setPayments(prev => prev.map(p => p.tenant === 'Mike Wilson' ? { ...p, status: 'paid', method: 'card' } : p));
  };

  const handleMaintenanceSubmit = (data) => {
    const newRequest = { id: maintenanceRequests.length + 1, ...data, property: '742 Evergreen Terrace, Unit A', status: 'pending', date: new Date().toISOString().split('T')[0], tenant: 'Current Tenant' };
    setMaintenanceRequests([newRequest, ...maintenanceRequests]);
    showNotification('Maintenance request submitted!');
  };

  const handleDocumentUpload = (data) => {
    const newDoc = { id: documents.length + 1, name: data.file?.name || 'New_Document.pdf', property: data.property, uploadDate: new Date().toISOString().split('T')[0], size: '1.5 MB', type: data.docType };
    setDocuments([newDoc, ...documents]);
    showNotification('Document uploaded successfully!');
  };

  // Landlord Overview
  const LandlordOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-emerald-100 text-sm">Total Revenue</p><p className="text-3xl font-bold mt-1">$8,800</p><p className="text-emerald-200 text-sm mt-2">+12% from last month</p></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-violet-100 text-sm">Active Leases</p><p className="text-3xl font-bold mt-1">4</p><p className="text-violet-200 text-sm mt-2">1 expiring soon</p></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-amber-100 text-sm">Open Requests</p><p className="text-3xl font-bold mt-1">2</p><p className="text-amber-200 text-sm mt-2">1 high priority</p></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Wrench className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-rose-100 text-sm">Pending Payments</p><p className="text-3xl font-bold mt-1">$1,650</p><p className="text-rose-200 text-sm mt-2">1 tenant</p></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800">Expiring Leases</h3><button className="text-emerald-600 text-sm font-medium">View all</button></div>
          <div className="space-y-3">
            {leases.filter(l => l.daysRemaining <= 30).map(lease => (
              <div key={lease.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div><p className="font-medium text-slate-800">{lease.property}</p><p className="text-sm text-slate-500">{lease.tenant}</p></div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${lease.daysRemaining <= 7 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{lease.daysRemaining} days left</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800">Recent Maintenance</h3><button className="text-emerald-600 text-sm font-medium">View all</button></div>
          <div className="space-y-3">
            {maintenanceRequests.slice(0, 3).map(request => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${request.priority === 'high' ? 'bg-red-500' : request.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div><p className="font-medium text-slate-800">{request.title}</p><p className="text-sm text-slate-500">{request.property}</p></div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${request.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : request.status === 'in-progress' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{request.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Tenant Overview
  const TenantOverview = () => {
    const tenantLease = leases[0];
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-slate-400 text-sm">Your Current Residence</p>
            <h2 className="text-2xl font-bold mt-2">{tenantLease.property}</h2>
            <div className="flex flex-wrap gap-6 mt-6">
              <div><p className="text-slate-400 text-sm">Monthly Rent</p><p className="text-xl font-semibold text-emerald-400">${tenantLease.rent.toLocaleString()}</p></div>
              <div><p className="text-slate-400 text-sm">Lease Ends</p><p className="text-xl font-semibold">{new Date(tenantLease.endDate).toLocaleDateString()}</p></div>
              <div><p className="text-slate-400 text-sm">Days Remaining</p><p className="text-xl font-semibold">{tenantLease.daysRemaining}</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setSelectedLease(tenantLease); setPaymentModalOpen(true); }}
                className="p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors text-left group">
                <CreditCard className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-800 mt-2">Pay Rent</p><p className="text-sm text-slate-500">Due Jan 1</p>
              </button>
              <button onClick={() => setMaintenanceModalOpen(true)}
                className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors text-left group">
                <Wrench className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-800 mt-2">Report Issue</p><p className="text-sm text-slate-500">New request</p>
              </button>
              <button onClick={() => setActiveTab('documents')}
                className="p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors text-left group">
                <FileText className="w-6 h-6 text-violet-600 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-800 mt-2">View Lease</p><p className="text-sm text-slate-500">Documents</p>
              </button>
              <button className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left group">
                <MessageSquare className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-800 mt-2">Message</p><p className="text-sm text-slate-500">Contact landlord</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800">My Requests</h3><span className="text-sm text-slate-500">{maintenanceRequests.filter(r => r.status !== 'completed').length} active</span></div>
            <div className="space-y-3">
              {maintenanceRequests.slice(0, 2).map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div><p className="font-medium text-slate-800">{request.title}</p><p className="text-sm text-slate-500">{request.date}</p></div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${request.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : request.status === 'in-progress' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>{request.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Leases Tab
  const LeasesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Lease Management</h2><p className="text-slate-500">Track all your property leases</p></div>
        <button className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-medium"><Plus className="w-5 h-5" />Add Lease</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Property</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Tenant</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Period</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Rent</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leases.map(lease => (
                <tr key={lease.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><Home className="w-5 h-5 text-emerald-600" /></div>
                      <span className="font-medium text-slate-800">{lease.property}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{lease.tenant}</td>
                  <td className="py-4 px-6"><div className="text-sm"><p className="text-slate-800">{new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</p><p className="text-slate-500">{lease.daysRemaining} days remaining</p></div></td>
                  <td className="py-4 px-6 font-semibold text-slate-800">${lease.rent.toLocaleString()}/mo</td>
                  <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-medium ${lease.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{lease.status === 'expiring' ? `Expiring in ${lease.daysRemaining} days` : 'Active'}</span></td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="w-4 h-4 text-slate-500" /></button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg"><Edit className="w-4 h-4 text-slate-500" /></button>
                      <button className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Maintenance Tab
  const MaintenanceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Maintenance Requests</h2><p className="text-slate-500">{userType === 'landlord' ? 'Manage tenant requests' : 'Report and track issues'}</p></div>
        {userType === 'tenant' && (<button onClick={() => setMaintenanceModalOpen(true)} className="px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 flex items-center gap-2 font-medium"><Plus className="w-5 h-5" />New Request</button>)}
      </div>

      <div className="grid gap-4">
        {maintenanceRequests.map(request => (
          <div key={request.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${request.priority === 'high' ? 'bg-red-100' : request.priority === 'medium' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  <Wrench className={`w-6 h-6 ${request.priority === 'high' ? 'text-red-600' : request.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-800">{request.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${request.priority === 'high' ? 'bg-red-100 text-red-600' : request.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{request.priority}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{request.property}</p>
                  <p className="text-slate-600 mt-2">{request.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{request.date}</span>
                    {userType === 'landlord' && <span className="flex items-center gap-1"><User className="w-4 h-4" />{request.tenant}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize ${request.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : request.status === 'in-progress' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{request.status === 'in-progress' ? 'In Progress' : request.status}</span>
                {userType === 'landlord' && <button className="p-2 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-5 h-5 text-slate-400" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Documents Tab
  const DocumentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Documents</h2><p className="text-slate-500">Manage lease agreements and property documents</p></div>
        {userType === 'landlord' && (<button onClick={() => setDocumentModalOpen(true)} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 flex items-center gap-2 font-medium"><Upload className="w-5 h-5" />Upload Document</button>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.type === 'lease' ? 'bg-violet-100' : doc.type === 'inspection' ? 'bg-blue-100' : doc.type === 'insurance' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <FileText className={`w-6 h-6 ${doc.type === 'lease' ? 'text-violet-600' : doc.type === 'inspection' ? 'text-blue-600' : doc.type === 'insurance' ? 'text-emerald-600' : 'text-slate-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 truncate">{doc.name}</h3>
                <p className="text-sm text-slate-500 truncate">{doc.property}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400"><span>{doc.uploadDate}</span><span>{doc.size}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <button className="flex-1 py-2 text-sm font-medium text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg flex items-center justify-center gap-1"><Eye className="w-4 h-4" />View</button>
              <button className="flex-1 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center justify-center gap-1"><Download className="w-4 h-4" />Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Payments Tab
  const PaymentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">{userType === 'landlord' ? 'Payment History' : 'Pay Rent'}</h2><p className="text-slate-500">{userType === 'landlord' ? 'Track all rent payments' : 'Manage your rent payments'}</p></div>
      </div>

      {userType === 'tenant' && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-emerald-100">Next Payment Due</p><p className="text-3xl font-bold mt-1">${leases[0].rent.toLocaleString()}</p><p className="text-emerald-100 mt-2">Due: January 1, 2025</p></div>
            <button onClick={() => { setSelectedLease(leases[0]); setPaymentModalOpen(true); }} className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50">Pay Now</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {userType === 'landlord' && <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Tenant</th>}
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Property</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Amount</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  {userType === 'landlord' && <td className="py-4 px-6 font-medium text-slate-800">{payment.tenant}</td>}
                  <td className="py-4 px-6 text-slate-600">{payment.property}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">${payment.amount.toLocaleString()}</td>
                  <td className="py-4 px-6 text-slate-600">{new Date(payment.date).toLocaleDateString()}</td>
                  <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{payment.status === 'paid' ? 'Paid' : 'Pending'}</span></td>
                  <td className="py-4 px-6">
                    {payment.method === 'card' && <CreditCard className="w-5 h-5 text-slate-400" />}
                    {payment.method === 'bank' && <Building2 className="w-5 h-5 text-slate-400" />}
                    {payment.method === 'pending' && <Clock className="w-5 h-5 text-amber-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return userType === 'landlord' ? <LandlordOverview /> : <TenantOverview />;
      case 'leases': return <LeasesTab />;
      case 'maintenance': return <MaintenanceTab />;
      case 'documents': return <DocumentsTab />;
      case 'payments': return <PaymentsTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 bg-emerald-600 text-white animate-slide-in">
          <CheckCircle className="w-5 h-5" />{notification}
        </div>
      )}

      <aside className={`fixed left-0 top-0 h-full bg-slate-900 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
            {sidebarOpen && <span className="text-white font-bold text-lg">PropFlow</span>}
          </div>
        </div>

        <nav className="px-4 mt-4">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <LogOut className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white border-b border-slate-100 px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu className="w-5 h-5 text-slate-600" /></button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl w-64 focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-lg relative"><Bell className="w-5 h-5 text-slate-600" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /></button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">{userType === 'landlord' ? 'L' : 'T'}</div>
                <div><p className="font-medium text-slate-800 text-sm">{userType === 'landlord' ? 'Property Manager' : 'John Smith'}</p><p className="text-xs text-slate-500 capitalize">{userType}</p></div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">{renderContent()}</div>
      </main>

      <PaymentModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} lease={selectedLease} onPaymentSuccess={handlePaymentSuccess} />
      <MaintenanceModal isOpen={maintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} onSubmit={handleMaintenanceSubmit} />
      <DocumentModal isOpen={documentModalOpen} onClose={() => setDocumentModalOpen(false)} onUpload={handleDocumentUpload} />

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// Main App Component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);

  const handleLogin = (type) => { setUserType(type); setIsAuthenticated(true); };
  const handleLogout = () => { setIsAuthenticated(false); setUserType(null); };

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;
  return <Dashboard userType={userType} onLogout={handleLogout} />;
}
