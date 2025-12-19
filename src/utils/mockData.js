// Mock Data for development
export const mockLeases = [
  { id: 1, property: '742 Evergreen Terrace, Unit A', tenant: 'John Smith', startDate: '2024-01-15', endDate: '2025-01-14', rent: 1850, status: 'active', daysRemaining: 28 },
  { id: 2, property: '1428 Elm Street, Apt 3B', tenant: 'Sarah Johnson', startDate: '2024-03-01', endDate: '2025-02-28', rent: 2200, status: 'active', daysRemaining: 73 },
  { id: 3, property: '221B Baker Street', tenant: 'Mike Wilson', startDate: '2023-06-01', endDate: '2024-05-31', rent: 1650, status: 'expiring', daysRemaining: 7 },
  { id: 4, property: '350 Fifth Avenue, Unit 12', tenant: 'Emily Davis', startDate: '2024-02-15', endDate: '2025-02-14', rent: 3100, status: 'active', daysRemaining: 59 },
];

export const mockMaintenanceRequests = [
  { id: 1, title: 'Leaking faucet in kitchen', property: '742 Evergreen Terrace, Unit A', status: 'pending', priority: 'medium', date: '2024-12-15', description: 'The kitchen faucet has been dripping constantly for 3 days.', tenant: 'John Smith' },
  { id: 2, title: 'AC not cooling properly', property: '1428 Elm Street, Apt 3B', status: 'in-progress', priority: 'high', date: '2024-12-14', description: 'Air conditioning unit is running but not producing cold air.', tenant: 'Sarah Johnson' },
  { id: 3, title: 'Broken window lock', property: '221B Baker Street', status: 'completed', priority: 'low', date: '2024-12-10', description: 'Lock mechanism on bedroom window is broken.', tenant: 'Mike Wilson' },
];

export const mockDocuments = [
  { id: 1, name: 'Lease_Agreement_742_Evergreen.pdf', property: '742 Evergreen Terrace, Unit A', uploadDate: '2024-01-15', size: '2.4 MB', type: 'lease' },
  { id: 2, name: 'Lease_Agreement_1428_Elm.pdf', property: '1428 Elm Street, Apt 3B', uploadDate: '2024-03-01', size: '2.1 MB', type: 'lease' },
  { id: 3, name: 'Property_Inspection_221B.pdf', property: '221B Baker Street', uploadDate: '2024-11-20', size: '4.8 MB', type: 'inspection' },
  { id: 4, name: 'Insurance_Certificate.pdf', property: 'All Properties', uploadDate: '2024-06-01', size: '1.2 MB', type: 'insurance' },
];

export const mockPayments = [
  { id: 1, tenant: 'John Smith', property: '742 Evergreen Terrace, Unit A', amount: 1850, date: '2024-12-01', status: 'paid', method: 'card' },
  { id: 2, tenant: 'Sarah Johnson', property: '1428 Elm Street, Apt 3B', amount: 2200, date: '2024-12-01', status: 'paid', method: 'bank' },
  { id: 3, tenant: 'Mike Wilson', property: '221B Baker Street', amount: 1650, date: '2024-12-01', status: 'pending', method: 'pending' },
  { id: 4, tenant: 'Emily Davis', property: '350 Fifth Avenue, Unit 12', amount: 3100, date: '2024-12-01', status: 'paid', method: 'card' },
];
