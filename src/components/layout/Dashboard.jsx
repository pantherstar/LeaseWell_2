import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, FileText, Wrench, CreditCard, LogOut, Calendar, DollarSign,
  CheckCircle, Clock, User, Home, Plus, Eye, Download, X, Menu, Bell,
  Search, MoreVertical, Edit, Trash2, MessageSquare, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PaymentModal from '../payments/PaymentModal';
import MaintenanceModal from '../maintenance/MaintenanceModal';
import DocumentModal from '../documents/DocumentModal';
import LeaseModal from '../leases/LeaseModal';
import OfflinePaymentModal from '../payments/OfflinePaymentModal';
import logoMark from '../../assets/leasewell-mark.png';
import { useLeases } from '../../hooks/useLeases';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useDocuments } from '../../hooks/useDocuments';
import { usePayments, usePaymentStats } from '../../hooks/usePayments';
import { useProperties } from '../../hooks/useProperties';
import { useProfile } from '../../hooks/useProfile';
import { useNotifications } from '../../hooks/useNotifications';
import { useTenantLinks } from '../../hooks/useTenantLinks';
import { sendTenantInvite } from '../../services/supabase/invites.service';
import { revokeTenantAccess } from '../../services/supabase/tenantLinks.service';
import { createConnectAccountLink } from '../../services/stripe/connect.service';
import PropertyModal from '../properties/PropertyModal';
import InviteTenantModal from '../tenants/InviteTenantModal';
import LeaseRequestModal from '../leases/LeaseRequestModal';
import { requestLease } from '../../services/supabase/leases.service';

const Dashboard = () => {
  const navigate = useNavigate();
  const { userType, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitePropertyId, setInvitePropertyId] = useState('');
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [leaseModalMode, setLeaseModalMode] = useState('create');
  const [activeLease, setActiveLease] = useState(null);
  const [defaultLeasePropertyId, setDefaultLeasePropertyId] = useState('');
  const [leaseRequestModalOpen, setLeaseRequestModalOpen] = useState(false);
  const [offlinePaymentModalOpen, setOfflinePaymentModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const faviconUrl = '/favicon.png?v=2';

  // Use custom hooks for data fetching
  const { leases, loading: leasesLoading, error: leasesError, create: createLease, update: updateLease, delete: deleteLease, refetch: refetchLeases } = useLeases();
  const { requests: maintenanceRequests, loading: maintenanceLoading, error: maintenanceError, create: createMaintenance, update: updateMaintenance, refetch: refetchMaintenance } = useMaintenance();
  const { documents, loading: documentsLoading, error: documentsError, upload: uploadDocument, download: downloadDocument, refetch: refetchDocuments } = useDocuments();
  const { payments, loading: paymentsLoading, error: paymentsError, update: updatePayment, refetch: refetchPayments } = usePayments();
  const { properties, loading: propertiesLoading, error: propertiesError, create: createProperty, refetch: refetchProperties } = useProperties();
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { links: tenantLinks, refetch: refetchTenantLinks } = useTenantLinks();
  const {
    notifications,
    unreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead
  } = useNotifications();
  const paymentStats = usePaymentStats(payments);
  const [skipLoading, setSkipLoading] = useState(false);
  const [ignoreLoading, setIgnoreLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'connected') {
      refetchProfile();
      showNotification('Stripe connected successfully!');
      params.delete('stripe');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [refetchProfile]);

  useEffect(() => {
    if (userType === 'landlord' && activeTab === 'leases') {
      setActiveTab('properties');
    }
  }, [userType, activeTab]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Show loading state while data is being fetched
  // Only show loading for initial load, not if all are still loading (which might indicate an error)
  const isLoading = leasesLoading && maintenanceLoading && documentsLoading && paymentsLoading && propertiesLoading && profileLoading;

  useEffect(() => {
    const timer = setTimeout(() => setSkipLoading(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Debug: Log loading states
  console.log('Dashboard loading states:', {
    leasesLoading,
    maintenanceLoading,
    documentsLoading,
    paymentsLoading,
    propertiesLoading,
    profileLoading,
    userType
  });

  if (isLoading && !skipLoading && !ignoreLoading) {
    return (
      <div className="min-h-screen bg-[#0b1513] text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_55%)]" />
        <div className="absolute -top-24 -right-20 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 -left-24 w-96 h-96 bg-amber-400/15 blur-[120px] rounded-full" />
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25">
            <img src={faviconUrl} alt="LeaseWell" className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading LeaseWell...</h2>
          <div className="w-48 h-1 bg-emerald-900/40 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-emerald-100/60 text-sm mt-4">If this takes too long, check your browser console for errors</p>
        </div>
      </div>
    );
  }

  if (isLoading && skipLoading && !ignoreLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-slate-100 shadow-sm rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-slate-800">We’re still loading your dashboard</h2>
          <p className="text-slate-500 text-sm mt-2">
            Some data is taking too long to load. You can retry or refresh the page.
          </p>
          <div className="mt-4 text-left text-xs text-slate-500 space-y-1">
            {leasesError && <p>Leases: {leasesError}</p>}
            {propertiesError && <p>Properties: {propertiesError}</p>}
            {paymentsError && <p>Payments: {paymentsError}</p>}
            {documentsError && <p>Documents: {documentsError}</p>}
            {maintenanceError && <p>Maintenance: {maintenanceError}</p>}
            {profileError && <p>Profile: {profileError}</p>}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                refetchLeases();
                refetchMaintenance();
                refetchDocuments();
                refetchPayments();
                refetchProperties();
                refetchProfile();
                setSkipLoading(false);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Retry
            </button>
            <button
              onClick={() => setIgnoreLoading(true)}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
            >
              Continue anyway
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = userType === 'landlord' ? [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ] : [
    { id: 'overview', label: 'My Unit', icon: Home },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'payments', label: 'Pay Rent', icon: CreditCard },
  ];

  const handlePaymentSuccess = async () => {
    showNotification('Payment processed successfully!');
    // Refetch payments to get updated data
    await refetchPayments();
  };

  const handleOfflinePayment = async ({ amount, method, paymentDate, notes }) => {
    if (!leases[0]?.id) {
      return { success: false, error: 'No active lease found.' };
    }

    const { recordOfflinePayment } = await import('../../services/payments/offline.service');
    const result = await recordOfflinePayment({
      leaseId: leases[0].id,
      amount,
      method,
      paymentDate,
      notes
    });

    if (result.success) {
      showNotification('Payment recorded! Your landlord will confirm it.');
      await refetchPayments();
    } else {
      showNotification(`Error: ${result.error}`);
    }

    return result;
  };

  const handleMarkPaymentPaid = async (paymentId) => {
    const result = await updatePayment(paymentId, { status: 'paid' });
    if (result.success) {
      showNotification('Payment marked as paid.');
      await refetchPayments();
    } else {
      showNotification(`Error: ${result.error}`);
    }
  };

  const handleConnectStripe = async () => {
    const { url, error } = await createConnectAccountLink({
      refreshUrl: window.location.href,
      returnUrl: `${window.location.origin}/dashboard?stripe=connected`
    });

    if (error) {
      showNotification(`Error: ${error}`);
      return;
    }

    if (url) {
      window.location.href = url;
    }
  };

  const handleCreateLease = async (data) => {
    const result = await createLease(data);
    if (result.success) {
      showNotification('Lease created!');
      await refetchLeases();
      setLeaseModalOpen(false);
    } else {
      showNotification(`Error: ${result.error}`);
    }
    return result;
  };

  const openLeaseModal = (mode, lease, propertyId = '') => {
    setLeaseModalMode(mode);
    setActiveLease(lease || null);
    setDefaultLeasePropertyId(propertyId || '');
    setLeaseModalOpen(true);
  };

  const handleUpdateLease = async (leaseId, updates) => {
    const result = await updateLease(leaseId, updates);
    if (result.success) {
      showNotification('Lease updated!');
      await refetchLeases();
      setLeaseModalOpen(false);
    } else {
      showNotification(`Error: ${result.error}`);
    }
    return result;
  };

  const handleDeleteLease = async (leaseId) => {
    const result = await deleteLease(leaseId);
    if (result.success) {
      showNotification('Lease deleted.');
      await refetchLeases();
    } else {
      showNotification(`Error: ${result.error}`);
    }
    return result;
  };

  const handleMaintenanceSubmit = async (data) => {
    const createResult = await createMaintenance({
      property_id: data.propertyId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      category: data.category,
      photos: []
    });

    if (!createResult.success) {
      showNotification(`Error: ${createResult.error}`);
      return createResult;
    }

    let uploadedUrls = [];
    if (data.photos?.length) {
      const { uploadMaintenancePhoto } = await import('../../services/supabase/database.service');
      const uploads = await Promise.all(
        data.photos.map(async (file) => {
          const { data: uploadData, error: uploadError } = await uploadMaintenancePhoto(file, createResult.data.id);
          if (uploadError) {
            return { error: uploadError.message || 'Upload failed' };
          }
          return { url: uploadData.publicUrl };
        })
      );
      const errors = uploads.filter((item) => item.error);
      if (errors.length) {
        showNotification(`Warning: ${errors[0].error}`);
      }
      uploadedUrls = uploads.filter((item) => item.url).map((item) => item.url);
    }

    if (uploadedUrls.length) {
      await updateMaintenance(createResult.data.id, { photos: uploadedUrls });
    }

    showNotification('Maintenance request submitted!');
    setMaintenanceModalOpen(false);
    await refetchMaintenance();
    return { success: true };
  };

  const handleDocumentUpload = async (data) => {
    if (!data.file) {
      showNotification('Please select a file to upload');
      return { success: false };
    }

    const result = await uploadDocument(data.file, {
      propertyId: data.propertyId,
      leaseId: data.leaseId,
      documentType: data.docType,
      description: data.description
    });

    if (result.success) {
      showNotification('Document uploaded successfully!');
    } else {
      const message = result.error?.message || result.error || 'Upload failed';
      showNotification(`Error: ${message}`);
    }
    return result;
  };

  const handleCreateProperty = async (data) => {
    const result = await createProperty(data);
    if (result.success) {
      showNotification('Property created!');
      await refetchProperties();
    } else {
      showNotification(`Error: ${result.error}`);
    }
    return result;
  };

  const handleRequestLease = async ({ message }) => {
    const propertyId = properties[0]?.id;
    if (!propertyId) {
      showNotification('No property found for your account yet.');
      return { success: false };
    }

    const result = await requestLease({ propertyId, message });
    if (result.error) {
      showNotification(`Error: ${result.error.message || result.error}`);
      return { success: false, error: result.error };
    }

    showNotification('Lease request sent to your landlord.');
    return { success: true };
  };

  const handleInviteTenant = async ({ propertyId, tenantEmail, tenantName }) => {
    const result = await sendTenantInvite({ propertyId, tenantEmail, tenantName, appUrl: window.location.origin });
    if (result.error) {
      showNotification(`Error: ${result.error.message || result.error}`);
      return { success: false };
    }
    showNotification('Invite sent successfully!');
    return { success: true };
  };

  const handleRemoveTenant = async ({ propertyId, tenantId }) => {
    const result = await revokeTenantAccess({ propertyId, tenantId });
    if (result.error) {
      showNotification(`Error: ${result.error.message || result.error}`);
      return { success: false };
    }
    showNotification('Tenant access removed.');
    await refetchTenantLinks();
    return { success: true };
  };

  const handleDocumentView = async (filePath) => {
    const result = await downloadDocument(filePath);
    if (result.success) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } else {
      showNotification(`Error: ${result.error}`);
    }
  };

  const handleDocumentDownload = async (filePath) => {
    const result = await downloadDocument(filePath);
    if (result.success) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } else {
      showNotification(`Error: ${result.error}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Landlord Overview
  const LandlordOverview = () => {
    const activeLeases = leases.filter(l => l.status === 'active');
    const expiringLeases = activeLeases.filter(l => {
      const endDate = new Date(l.end_date);
      const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 30;
    });
    const openRequests = maintenanceRequests.filter(r => r.status === 'pending' || r.status === 'in_progress');
    const highPriorityRequests = openRequests.filter(r => r.priority === 'high' || r.priority === 'emergency');

    return (
      <div className="space-y-6">
        {!profile?.stripe_account_id && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-slate-800 font-semibold">Connect Stripe to receive payments</h3>
              <p className="text-sm text-slate-600 mt-1">Landlords must connect a Stripe account before tenants can pay rent.</p>
            </div>
            <button onClick={handleConnectStripe} className="px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium">
              Connect Stripe
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div><p className="text-emerald-100 text-sm">Total Revenue</p><p className="text-3xl font-bold mt-1">${paymentStats.totalPaid.toLocaleString()}</p><p className="text-emerald-200 text-sm mt-2">{paymentStats.paidCount} paid this month</p></div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div><p className="text-violet-100 text-sm">Active Leases</p><p className="text-3xl font-bold mt-1">{activeLeases.length}</p><p className="text-violet-200 text-sm mt-2">{expiringLeases.length} expiring soon</p></div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div><p className="text-amber-100 text-sm">Open Requests</p><p className="text-3xl font-bold mt-1">{openRequests.length}</p><p className="text-amber-200 text-sm mt-2">{highPriorityRequests.length} high priority</p></div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Wrench className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div><p className="text-rose-100 text-sm">Pending Payments</p><p className="text-3xl font-bold mt-1">${paymentStats.totalPending.toLocaleString()}</p><p className="text-rose-200 text-sm mt-2">{paymentStats.pendingCount} tenant{paymentStats.pendingCount !== 1 ? 's' : ''}</p></div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800">Expiring Leases</h3><button className="text-emerald-600 text-sm font-medium">View all</button></div>
          <div className="space-y-3">
            {expiringLeases.length > 0 ? (
              expiringLeases.map(lease => {
                const daysRemaining = Math.ceil((new Date(lease.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={lease.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div><p className="font-medium text-slate-800">{lease.property?.address || 'Property'}</p><p className="text-sm text-slate-500">{lease.tenant?.full_name || 'Tenant'}</p></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${daysRemaining <= 7 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{daysRemaining} days left</span>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">No expiring leases</p>
            )}
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
  };

  // Tenant Overview
  const TenantOverview = () => {
    const tenantLease = leases[0];
    const tenantProperty = properties[0];
    const propertyLabel = tenantLease?.property?.address || tenantLease?.property || tenantProperty?.address || 'Your Property';
    const cityState = tenantLease?.property
      ? `${tenantLease.property.city || ''} ${tenantLease.property.state || ''} ${tenantLease.property.zip_code || ''}`.trim()
      : tenantProperty
        ? `${tenantProperty.city || ''} ${tenantProperty.state || ''} ${tenantProperty.zip_code || ''}`.trim()
        : '';
    const hasLease = Boolean(tenantLease);

    if (!hasLease) {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-slate-400 text-sm">Invite Accepted</p>
              <h2 className="text-2xl font-bold mt-2">{propertyLabel}</h2>
              {cityState && <p className="text-slate-300 mt-2">{cityState}</p>}
              <p className="text-slate-300 mt-4">
                Your landlord will add your lease details shortly. You’ll see rent and documents here once the lease is created.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2">What’s next?</h3>
            <p className="text-slate-500 text-sm">
              Wait for your landlord to activate the lease. If this takes too long, reach out to them to finalize setup.
            </p>
            <button
              onClick={() => setLeaseRequestModalOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Request Lease
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-slate-400 text-sm">Your Current Residence</p>
            <h2 className="text-2xl font-bold mt-2">{propertyLabel}</h2>
            {cityState && <p className="text-slate-300 mt-2">{cityState}</p>}
            <div className="flex flex-wrap gap-6 mt-6">
              <div><p className="text-slate-400 text-sm">Monthly Rent</p><p className="text-xl font-semibold text-emerald-400">${Number(tenantLease.monthly_rent ?? tenantLease.rent ?? 0).toLocaleString()}</p></div>
              <div><p className="text-slate-400 text-sm">Lease Ends</p><p className="text-xl font-semibold">{new Date(tenantLease.end_date ?? tenantLease.endDate).toLocaleDateString()}</p></div>
              <div><p className="text-slate-400 text-sm">Days Remaining</p><p className="text-xl font-semibold">{tenantLease.daysRemaining ?? Math.ceil((new Date(tenantLease.end_date ?? tenantLease.endDate) - new Date()) / (1000 * 60 * 60 * 24))}</p></div>
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
        {userType === 'landlord' ? (
          <button
            onClick={() => {
              if (properties.length === 0) {
                showNotification('Add a property before creating a lease.');
                return;
              }
              openLeaseModal('create', null);
            }}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />Add Lease
          </button>
        ) : (
          <button
            onClick={() => setLeaseRequestModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />Request Lease
          </button>
        )}
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
              {leases.map(lease => {
                const propertyLabel = lease.property?.address || lease.property || 'Property';
                const tenantLabel = lease.tenant?.full_name || lease.tenant || 'Tenant';
                const startDate = lease.start_date || lease.startDate;
                const endDate = lease.end_date || lease.endDate;
                const monthlyRent = lease.monthly_rent ?? lease.rent ?? 0;
                const daysRemaining = endDate ? Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <tr key={lease.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><Home className="w-5 h-5 text-emerald-600" /></div>
                        <span className="font-medium text-slate-800">{propertyLabel}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{tenantLabel}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p className="text-slate-800">
                          {startDate ? new Date(startDate).toLocaleDateString() : '—'} - {endDate ? new Date(endDate).toLocaleDateString() : '—'}
                        </p>
                        <p className="text-slate-500">{daysRemaining != null ? `${daysRemaining} days remaining` : '—'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">${Number(monthlyRent).toLocaleString()}/mo</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${lease.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {lease.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            openLeaseModal('view', lease);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => {
                            openLeaseModal('edit', lease);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = window.confirm('Delete this lease?');
                            if (!confirmed) return;
                            await handleDeleteLease(lease.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const PropertiesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Properties</h2><p className="text-slate-500">Manage your rental properties</p></div>
        <button onClick={() => setPropertyModalOpen(true)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-medium"><Plus className="w-5 h-5" />Add Property</button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <p className="text-slate-500">No properties yet. Add your first property to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {properties.map((property) => {
            const link = tenantLinks.find((entry) => entry.property_id === property.id && entry.status !== 'removed');
            const tenantName = link?.tenant?.full_name || link?.tenant?.email;
            const handleTenantAction = async () => {
              if (link) {
                const confirmed = window.confirm(`Remove ${tenantName || 'this tenant'} from ${property.address}?`);
                if (!confirmed) {
                  return;
                }
                await handleRemoveTenant({ propertyId: property.id, tenantId: link.tenant_id });
                return;
              }
              setInvitePropertyId(property.id);
              setInviteModalOpen(true);
            };
            return (
            <div key={property.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-800">{property.address}{property.unit_number ? `, ${property.unit_number}` : ''}</h3>
                  <p className="text-sm text-slate-500">{property.city}, {property.state} {property.zip_code}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>{property.property_type || 'Property'}</span>
                    {property.bedrooms != null && <span>{property.bedrooms} bd</span>}
                    {property.bathrooms != null && <span>{property.bathrooms} ba</span>}
                    {property.square_feet != null && <span>{property.square_feet} sqft</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    {tenantName ? (
                      <span className="text-emerald-700">Tenant: {tenantName}</span>
                    ) : (
                      <>
                        <span className="text-slate-500">No tenant yet.</span>
                        <button
                          onClick={handleTenantAction}
                          className="text-xs font-medium text-amber-600 hover:text-amber-700"
                        >
                          Invite tenant
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openLeaseModal('create', null, property.id)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Add Lease
                  </button>
                </div>
              </div>
              {property.description && <p className="text-sm text-slate-600 mt-4">{property.description}</p>}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Leases</p>
                  <button
                    onClick={() => openLeaseModal('create', null, property.id)}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Create lease
                  </button>
                </div>
                {leases.filter((lease) => lease.property_id === property.id).length === 0 ? (
                  <p className="text-sm text-slate-500">No leases yet for this property.</p>
                ) : (
                  <div className="space-y-3">
                    {leases
                      .filter((lease) => lease.property_id === property.id)
                      .map((lease) => {
                        const tenantLabel = lease.tenant?.full_name || lease.tenant || 'Tenant';
                        const startDate = lease.start_date || lease.startDate;
                        const endDate = lease.end_date || lease.endDate;
                        const monthlyRent = lease.monthly_rent ?? lease.rent ?? 0;
                        return (
                          <div key={lease.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{tenantLabel}</p>
                              <p className="text-xs text-slate-500">
                                {startDate ? new Date(startDate).toLocaleDateString() : '—'} - {endDate ? new Date(endDate).toLocaleDateString() : '—'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-800">${Number(monthlyRent).toLocaleString()}/mo</span>
                              <button
                                onClick={() => openLeaseModal('view', lease)}
                                className="p-2 hover:bg-white rounded-lg"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                              </button>
                              <button
                                onClick={() => openLeaseModal('edit', lease)}
                                className="p-2 hover:bg-white rounded-lg"
                              >
                                <Edit className="w-4 h-4 text-slate-500" />
                              </button>
                              <button
                                onClick={async () => {
                                  const confirmed = window.confirm('Delete this lease?');
                                  if (!confirmed) return;
                                  await handleDeleteLease(lease.id);
                                }}
                                className="p-2 hover:bg-white rounded-lg"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
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
                  <p className="text-slate-500 text-sm mt-1">{request.property?.address || request.property || 'Property'}</p>
                  <p className="text-slate-600 mt-2">{request.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}</span>
                    {userType === 'landlord' && <span className="flex items-center gap-1"><User className="w-4 h-4" />{request.tenant?.full_name || request.tenant || 'Tenant'}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {userType === 'landlord' ? (
                  <select
                    value={request.status || 'pending'}
                    onChange={async (e) => {
                      const nextStatus = e.target.value;
                      const result = await updateMaintenance(request.id, { status: nextStatus });
                      if (result.success) {
                        showNotification('Status updated.');
                        await refetchMaintenance();
                      } else {
                        showNotification(`Error: ${result.error}`);
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-700"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize ${request.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : request.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                    {request.status === 'in_progress' ? 'In Progress' : request.status}
                  </span>
                )}
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

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <p className="text-slate-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const createdAt = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—';
            const sizeMb = doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : '—';
            const docType = doc.document_type || 'other';
            return (
              <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${docType === 'lease' ? 'bg-violet-100' : docType === 'inspection' ? 'bg-blue-100' : docType === 'insurance' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <FileText className={`w-6 h-6 ${docType === 'lease' ? 'text-violet-600' : docType === 'inspection' ? 'text-blue-600' : docType === 'insurance' ? 'text-emerald-600' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 truncate">{doc.file_name}</h3>
                    <p className="text-sm text-slate-500 truncate">{doc.property?.address || 'General'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400"><span>{createdAt}</span><span>{sizeMb}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => handleDocumentView(doc.file_path)} className="flex-1 py-2 text-sm font-medium text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg flex items-center justify-center gap-1"><Eye className="w-4 h-4" />View</button>
                  <button onClick={() => handleDocumentDownload(doc.file_path)} className="flex-1 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center justify-center gap-1"><Download className="w-4 h-4" />Download</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
            <div>
              <p className="text-emerald-100">Next Payment Due</p>
              <p className="text-3xl font-bold mt-1">
                ${Number(leases[0]?.monthly_rent ?? leases[0]?.rent ?? 0).toLocaleString()}
              </p>
              <p className="text-emerald-100 mt-2">
                {leases[0]?.id ? 'Due: January 1, 2025' : 'No active lease yet'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedLease(leases[0]); setPaymentModalOpen(true); }}
                disabled={!leases[0]?.id}
                className={`px-6 py-3 font-semibold rounded-xl ${
                  leases[0]?.id ? 'bg-white text-emerald-600 hover:bg-emerald-50' : 'bg-white/40 text-emerald-200 cursor-not-allowed'
                }`}
              >
                Pay Now
              </button>
              <button
                onClick={() => setOfflinePaymentModalOpen(true)}
                disabled={!leases[0]?.id}
                className={`px-6 py-3 font-semibold rounded-xl ${
                  leases[0]?.id ? 'bg-emerald-800 text-white hover:bg-emerald-700' : 'bg-emerald-900/40 text-emerald-200 cursor-not-allowed'
                }`}
              >
                Record Zelle/Cash
              </button>
            </div>
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
                {userType === 'landlord' && <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  {userType === 'landlord' && <td className="py-4 px-6 font-medium text-slate-800">{payment.tenant?.full_name || payment.tenant || 'Tenant'}</td>}
                  <td className="py-4 px-6 text-slate-600">{payment.lease?.property?.address || payment.property || 'Property'}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">${Number(payment.amount).toLocaleString()}</td>
                  <td className="py-4 px-6 text-slate-600">{new Date(payment.payment_date || payment.date).toLocaleDateString()}</td>
                  <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{payment.status === 'paid' ? 'Paid' : 'Pending'}</span></td>
                  <td className="py-4 px-6">
                    {payment.payment_method === 'card' && <CreditCard className="w-5 h-5 text-slate-400" />}
                    {payment.payment_method === 'bank_transfer' && <Building2 className="w-5 h-5 text-slate-400" />}
                    {payment.payment_method === 'check' && <FileText className="w-5 h-5 text-slate-400" />}
                    {payment.payment_method === 'cash' && <Clock className="w-5 h-5 text-amber-500" />}
                  </td>
                  {userType === 'landlord' && (
                    <td className="py-4 px-6">
                      {payment.status === 'pending' && payment.payment_method !== 'card' && (
                        <button
                          onClick={() => handleMarkPaymentPaid(payment.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  )}
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
      case 'properties': return <PropertiesTab />;
      case 'leases': return <PropertiesTab />;
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
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center">
            <img src={logoMark} alt="LeaseWell" className="w-7 h-7 object-contain" />
          </div>
          {sidebarOpen && <span className="text-white font-bold text-lg">LeaseWell</span>}
        </button>
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
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
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
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="p-2 hover:bg-slate-100 rounded-lg relative"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-lg p-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-800">Alerts</p>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs text-emerald-600 hover:text-emerald-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p>No new alerts yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-auto">
                        {notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`w-full text-left p-3 rounded-lg border transition ${
                              notif.read ? 'border-slate-100 bg-slate-50' : 'border-emerald-200 bg-emerald-50/40'
                            }`}
                          >
                            <p className="font-medium text-slate-800">{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
      <OfflinePaymentModal
        isOpen={offlinePaymentModalOpen}
        onClose={() => setOfflinePaymentModalOpen(false)}
        onSubmit={handleOfflinePayment}
        defaultAmount={leases[0]?.monthly_rent ?? leases[0]?.rent ?? ''}
      />
      <MaintenanceModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        onSubmit={handleMaintenanceSubmit}
        properties={properties}
      />
      <DocumentModal isOpen={documentModalOpen} onClose={() => setDocumentModalOpen(false)} onUpload={handleDocumentUpload} properties={properties} />
      <PropertyModal isOpen={propertyModalOpen} onClose={() => setPropertyModalOpen(false)} onCreate={handleCreateProperty} />
      <LeaseModal
        isOpen={leaseModalOpen}
        onClose={() => setLeaseModalOpen(false)}
        onCreate={handleCreateLease}
        onUpdate={handleUpdateLease}
        properties={properties}
        mode={leaseModalMode}
        lease={activeLease}
        defaultPropertyId={defaultLeasePropertyId}
      />
      <LeaseRequestModal
        isOpen={leaseRequestModalOpen}
        onClose={() => setLeaseRequestModalOpen(false)}
        onSubmit={handleRequestLease}
        property={properties[0]}
      />
      <InviteTenantModal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInvitePropertyId('');
        }}
        onInvite={handleInviteTenant}
        properties={properties}
        defaultPropertyId={invitePropertyId}
      />

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Dashboard;
