import { useEffect, useMemo, useState } from 'react';
import {
  acceptInvite,
  AuthError,
  getSettings,
  getUser,
  handleAuthCallback,
  login as identityLogin,
  logout as identityLogout,
  MissingIdentityError,
  onAuthChange,
  requestPasswordRecovery,
  signup as identitySignup,
  updateUser,
} from '@netlify/identity';
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Container,
  CreditCard,
  Edit3,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  PackageCheck,
  PackagePlus,
  Plus,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Truck,
  UploadCloud,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

const roles = ['Admin', 'Staff', 'Warehouse staff', 'Customs staff', 'Client'];
const useMockAuth = true;

// Backend integration point: replace these session-scoped mocks with API calls
// backed by Netlify Functions and a server-side PostgreSQL connection.
const demoUsers = [
  { id: 1, name: 'Mina Zhang', email: 'admin@chinalink24.com', phone: '+86 755 4108 2201', role: 'Admin', active: true, code: 'HQ', clientId: '', notes: 'Primary system administrator', password: 'demo1234' },
  { id: 2, name: 'David Mensah', email: 'staff@chinalink24.com', phone: '+233 24 612 7048', role: 'Staff', active: true, code: 'OPS', clientId: '', notes: 'Operations coordinator', password: 'demo1234' },
  { id: 3, name: 'Lin Wei', email: 'warehouse@chinalink24.com', phone: '+86 20 5418 9204', role: 'Warehouse staff', active: true, code: 'WH', clientId: '', notes: 'Guangzhou warehouse receiving', password: 'demo1234' },
  { id: 4, name: 'Amara Okafor', email: 'customs@chinalink24.com', phone: '+234 802 118 3320', role: 'Customs staff', active: true, code: 'CUS', clientId: '', notes: 'Customs document review', password: 'demo1234' },
  { id: 5, name: 'TechNova Imports', email: 'client@technova.example', phone: '+233 24 410 8821', role: 'Client', active: true, code: 'TECH', clientId: 'CUS-001', notes: 'Linked to TechNova Imports customer account', password: 'demo1234' },
];

const initialCustomers = [
  { id: 'CUS-001', name: 'TechNova Imports', code: 'TECH', companyName: 'TechNova Imports Ltd', destination: 'Ghana', contact: 'Adjoa Mensah', email: 'client@technova.example', phone: '+233 24 410 8821', address: 'Airport Industrial Area, Accra', country: 'Ghana', taxId: 'GH-TIN-23814', notes: 'Priority electronics importer', status: 'Active' },
  { id: 'CUS-002', name: 'Blue Harbor Retail', code: 'BHR', companyName: 'Blue Harbor Retail Co.', destination: 'Nigeria', contact: 'Chinedu Okoro', email: 'ops@blueharbor.example', phone: '+234 802 410 5901', address: 'Apapa Commercial Road, Lagos', country: 'Nigeria', taxId: 'NG-VAT-88310', notes: 'Consolidates weekly mixed retail parcels', status: 'Active' },
  { id: 'CUS-003', name: 'Northline Parts', code: 'NLP', companyName: 'Northline Auto Parts', destination: 'Kenya', contact: 'Grace Wanjiku', email: 'imports@northline.example', phone: '+254 712 330 482', address: 'Mombasa Road, Nairobi', country: 'Kenya', taxId: 'KE-PIN-77542', notes: 'Requires customs document review before release', status: 'Customs review' },
];

const initialShipments = [
  {
    id: 'SHP-1048',
    customer: 'TechNova Imports',
    clientCode: 'TECH',
    status: 'Partially received',
    expected: 8,
    parcels: ['YT923847510CN', 'SF109384720CN', 'ZTO493827104CN'],
    destination: 'Ghana',
    customs: 'Awaiting invoices',
    delivery: 'Warehouse phase',
  },
  {
    id: 'SHP-1049',
    customer: 'Blue Harbor Retail',
    clientCode: 'BHR',
    status: 'Loaded into shipping container',
    expected: 12,
    parcels: ['JD394857201CN', 'YT203948571CN', 'SF918273645CN', 'STO564738291CN'],
    destination: 'Nigeria',
    customs: 'Pending review',
    delivery: 'Ocean freight',
  },
  {
    id: 'SHP-1050',
    customer: 'Northline Parts',
    clientCode: 'NLP',
    status: 'In customs clearance',
    expected: 5,
    parcels: ['DHL883746210CN', 'YT302948571CN'],
    destination: 'Kenya',
    customs: 'Review in progress',
    delivery: 'Port arrival',
  },
];

const initialParcels = [
  { tracking: 'YT923847510CN', shipment: 'SHP-1048', client: 'TechNova Imports', status: 'Received', weight: '7.4 kg', dimensions: '42 x 34 x 26 cm', invoice: true, payment: false, notes: 'Outer carton intact' },
  { tracking: 'SF109384720CN', shipment: 'SHP-1048', client: 'TechNova Imports', status: 'Ready for packing', weight: '4.8 kg', dimensions: '36 x 20 x 18 cm', invoice: true, payment: true, notes: 'Ready shelf B2' },
  { tracking: 'ZTO493827104CN', shipment: 'SHP-1048', client: 'TechNova Imports', status: 'In transit to warehouse', weight: 'Pending', dimensions: 'Pending', invoice: false, payment: false, notes: 'Awaiting warehouse scan' },
  { tracking: 'JD394857201CN', shipment: 'SHP-1049', client: 'Blue Harbor Retail', status: 'Packed into containment', weight: '11.2 kg', dimensions: '54 x 38 x 32 cm', invoice: true, payment: true, notes: 'Packed in CL24-BHR-0001' },
];

const initialContainments = [
  {
    number: 'CL24-TECH-0001',
    name: 'Standard Box',
    client: 'TechNova Imports',
    clientId: 'CUS-001',
    code: 'TECH',
    boxTypeId: 'BOX-STD',
    boxTypeName: 'Standard Box',
    width: 60,
    height: 50,
    length: 90,
    unit: 'cm',
    status: 'Packing in progress',
    parcels: 2,
    weight: '12.2 kg',
    destination: 'Ghana',
    container: 'Pending',
    closed: 'Not closed',
  },
  {
    number: 'CL24-BHR-0001',
    name: 'Standard Box',
    client: 'Blue Harbor Retail',
    clientId: 'CUS-002',
    code: 'BHR',
    boxTypeId: 'BOX-STD',
    boxTypeName: 'Standard Box',
    width: 60,
    height: 50,
    length: 90,
    unit: 'cm',
    status: 'Locked',
    parcels: 9,
    weight: '86.7 kg',
    destination: 'Nigeria',
    container: 'CMAU-482913-7',
    closed: '2026-04-24',
  },
];

const initialShippingContainers = [
  { id: 'CMAU-482913-7', number: 'CMAU-482913-7', sealNumber: 'SL-48922', carrier: 'CMA CGM', vessel: 'CMA Grandeur', originPort: 'Shenzhen', destinationPort: 'Tema', destination: 'Ghana', status: 'In transit', containments: 6, eta: '2026-05-18', departureDate: '2026-04-26', notes: 'Ocean freight' },
  { id: 'MSCU-771204-3', number: 'MSCU-771204-3', sealNumber: 'SL-77144', carrier: 'MSC', vessel: 'MSC Jasmine', originPort: 'Ningbo', destinationPort: 'Lagos', destination: 'Nigeria', status: 'Loading', containments: 4, eta: '2026-05-22', departureDate: '2026-05-02', notes: 'Loading at warehouse' },
  { id: 'OOLU-319872-6', number: 'OOLU-319872-6', sealNumber: 'SL-31877', carrier: 'OOCL', vessel: 'OOCL Horizon', originPort: 'Shanghai', destinationPort: 'Mombasa', destination: 'Kenya', status: 'Closed', containments: 3, eta: '2026-05-09', departureDate: '2026-04-18', notes: 'Port arrival' },
];

const initialContainmentSizes = [
  { id: 'BOX-STD', name: 'Standard Box', width: 60, height: 50, length: 90, unit: 'cm', maxWeight: '', active: true, default: true, notes: 'Default ChinaLink24 export carton' },
  { id: 'BOX-LRG', name: 'Large Box', width: 80, height: 60, length: 110, unit: 'cm', maxWeight: '120 kg', active: true, default: false, notes: 'Oversized parcel consolidation' },
  { id: 'BOX-SML', name: 'Small Box', width: 45, height: 35, length: 55, unit: 'cm', maxWeight: '45 kg', active: true, default: false, notes: 'Small mixed parcel runs' },
];

const initialDocuments = [
  { id: 'DOC-2041', title: 'Commercial invoice', owner: 'TechNova Imports', shipment: 'SHP-1048', status: 'Uploaded' },
  { id: 'DOC-2042', title: 'Payment proof', owner: 'Blue Harbor Retail', shipment: 'SHP-1049', status: 'Under review' },
  { id: 'DOC-2043', title: 'Packing list', owner: 'Northline Parts', shipment: 'SHP-1050', status: 'Requested' },
];

const initialPayments = [
  { id: 'PAY-8801', customer: 'TechNova Imports', shipment: 'SHP-1048', amount: '$420.00', status: 'Awaiting validation' },
  { id: 'PAY-8802', customer: 'Blue Harbor Retail', shipment: 'SHP-1049', amount: '$1,140.00', status: 'Cleared for packing' },
  { id: 'PAY-8803', customer: 'Northline Parts', shipment: 'SHP-1050', amount: '$360.00', status: 'Proof uploaded' },
];

const initialTrackingEvents = [
  { id: 'EVT-5101', tracking: 'YT923847510CN', shipment: 'SHP-1048', status: 'Received', location: 'Guangzhou warehouse' },
  { id: 'EVT-5102', tracking: 'SF109384720CN', shipment: 'SHP-1048', status: 'Ready for packing', location: 'Shelf B2' },
  { id: 'EVT-5103', tracking: 'JD394857201CN', shipment: 'SHP-1049', status: 'Packed into containment', location: 'CL24-BHR-0001' },
  { id: 'EVT-5104', tracking: 'YT302948571CN', shipment: 'SHP-1050', status: 'In customs clearance', location: 'Mombasa port' },
];

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: roles },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['Admin', 'Staff'] },
  { id: 'shipments', label: 'Shipments', icon: Truck, roles: roles },
  { id: 'parcels', label: 'Incoming Parcels', icon: PackagePlus, roles: roles },
  { id: 'receiving', label: 'Warehouse Receiving', icon: PackageCheck, roles: ['Admin', 'Staff', 'Warehouse staff'] },
  { id: 'packing', label: 'Packing / Containments', icon: Boxes, roles: ['Admin', 'Staff', 'Warehouse staff', 'Client'] },
  { id: 'containers', label: 'Shipping Containers', icon: Container, roles: ['Admin', 'Staff', 'Warehouse staff', 'Customs staff', 'Client'] },
  { id: 'customs', label: 'Customs Clearance', icon: ShieldCheck, roles: ['Admin', 'Staff', 'Customs staff', 'Client'] },
  { id: 'documents', label: 'Documents', icon: FileText, roles: roles },
  { id: 'payments', label: 'Payments', icon: CreditCard, roles: roles },
  { id: 'profile', label: 'Profile', icon: UserCog, roles: roles },
  { id: 'users', label: 'Users', icon: UserPlus, roles: ['Admin'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Staff'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Staff'] },
];

const statusTone = {
  Received: 'green',
  'Ready for packing': 'blue',
  'In transit to warehouse': 'amber',
  'Packed into containment': 'blue',
  'Packing in progress': 'amber',
  Locked: 'green',
  'Partially received': 'amber',
  'Loaded into shipping container': 'blue',
  'In customs clearance': 'red',
  'Parcels in transit to warehouse': 'amber',
  'Waiting for parcel tracking numbers': 'neutral',
  'Customs cleared': 'green',
  Active: 'green',
  Default: 'blue',
  Inactive: 'neutral',
  Open: 'amber',
  Ready: 'blue',
  'Customs review': 'red',
  'Under review': 'amber',
  Requested: 'neutral',
  'Awaiting validation': 'amber',
  'Cleared for packing': 'green',
  'Proof uploaded': 'blue',
  'Ocean freight': 'blue',
  Created: 'blue',
  Loading: 'amber',
  Loaded: 'green',
  Shipped: 'blue',
  Arrived: 'amber',
  'In customs': 'red',
  'In transit': 'blue',
  Closed: 'neutral',
  Cleared: 'green',
  Unloaded: 'neutral',
  'Port arrival': 'red',
};

const availableContainerStatuses = ['Created', 'Loading', 'Loaded', 'In transit'];
const allContainerStatuses = ['Created', 'Loading', 'Loaded', 'In transit', 'Shipped', 'Arrived', 'In customs', 'Cleared', 'Unloaded', 'Closed'];
const protectedContainmentStatuses = ['Closed', 'Locked', 'Assigned to shipping container', 'Loaded', 'Shipped', 'Delivered'];
const protectedContainerStatuses = ['Shipped', 'Arrived', 'In customs', 'Cleared', 'Unloaded', 'Closed'];
const mockStateKey = 'chinalink24_mock_state_v2';

function createInitialMockState() {
  return {
    users: demoUsers,
    customers: initialCustomers,
    shipments: initialShipments,
    parcels: initialParcels,
    containmentSizes: initialContainmentSizes,
    containments: initialContainments,
    shippingContainers: initialShippingContainers,
  };
}

function loadMockState() {
  if (typeof window === 'undefined') return createInitialMockState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(mockStateKey) || 'null');
    if (!parsed) return createInitialMockState();
    return {
      ...createInitialMockState(),
      ...parsed,
      users: (parsed.users || demoUsers).map((user) => ({ password: 'demo1234', ...user })),
      customers: (parsed.customers || initialCustomers).map(normalizeCustomer),
      containmentSizes: parsed.containmentSizes || initialContainmentSizes,
      shippingContainers: parsed.shippingContainers || initialShippingContainers,
    };
  } catch {
    return createInitialMockState();
  }
}

function App() {
  const [mockState] = useState(loadMockState);
  const [screen, setScreen] = useState('login');
  const [users, setUsers] = useState(mockState.users);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [authSettings, setAuthSettings] = useState({ disableSignup: false });
  const [inviteToken, setInviteToken] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [shipments, setShipments] = useState(mockState.shipments);
  const [parcels, setParcels] = useState(mockState.parcels);
  const [containments, setContainments] = useState(mockState.containments);
  const [customers, setCustomers] = useState(mockState.customers);
  const [containmentSizes, setContainmentSizes] = useState(mockState.containmentSizes);
  const [shippingContainers, setShippingContainers] = useState(mockState.shippingContainers);
  const [documents] = useState(initialDocuments);
  const [payments] = useState(initialPayments);
  const [trackingEvents] = useState(initialTrackingEvents);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scoped = useMemo(
    () => scopeRecords(currentUser, shipments, parcels, containments, documents, payments, trackingEvents),
    [currentUser, shipments, parcels, containments, documents, payments, trackingEvents],
  );

  useEffect(() => {
    if (!useMockAuth || typeof window === 'undefined') return;
    window.localStorage.setItem(
      mockStateKey,
      JSON.stringify({ users, customers, shipments, parcels, containmentSizes, containments, shippingContainers }),
    );
  }, [users, customers, shipments, parcels, containmentSizes, containments, shippingContainers]);

  useEffect(() => {
    if (useMockAuth) {
      setAuthSettings({ disableSignup: false });
      setAuthLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadIdentitySession() {
      try {
        const callback = await handleAuthCallback();
        if (!isMounted) return;

        if (callback?.type === 'invite') {
          setInviteToken(callback.token || '');
          setScreen('accept-invite');
          setAuthMessage('Set a password to activate this account.');
        } else if (callback?.type === 'recovery') {
          setCurrentUser(mapIdentityUser(callback.user, users));
          setScreen('reset-password');
          setAuthMessage('Enter a new password to finish account recovery.');
        } else if (callback?.user) {
          enterAuthenticatedApp(callback.user);
          setAuthMessage(callback.type === 'confirmation' ? 'Email confirmed. The account is ready.' : '');
        }

        const [settingsResult, userResult] = await Promise.allSettled([getSettings(), getUser()]);
        if (!isMounted) return;

        if (settingsResult.status === 'fulfilled') {
          setAuthSettings(settingsResult.value);
        }

        if (!callback && userResult.status === 'fulfilled' && userResult.value) {
          enterAuthenticatedApp(userResult.value);
        }
      } catch (error) {
        if (isMounted) {
          setAuthMessage(toAuthMessage(error));
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    const unsubscribe = onAuthChange((event, user) => {
      if (!isMounted) return;
      if (event === 'logout') {
        setCurrentUser(null);
        setScreen('login');
        return;
      }
      if (user && event !== 'recovery') {
        enterAuthenticatedApp(user);
      }
    });

    loadIdentitySession();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  function enterAuthenticatedApp(identityUser, section = 'dashboard') {
    const appUser = mapIdentityUser(identityUser, users);
    setCurrentUser(appUser);
    setScreen('app');
    setActiveSection(section);
  }

  async function handleLogin(credentials) {
    setAuthMessage('');
    if (useMockAuth) {
      const user = users.find((item) => item.active && item.email.toLowerCase() === credentials.email.toLowerCase());
      if (!user || user.password !== credentials.password) {
        setAuthMessage('Invalid email or password.');
        return;
      }
      setCurrentUser(user);
      setScreen('app');
      setActiveSection('dashboard');
      return;
    }

    try {
      const identityUser = await identityLogin(credentials.email, credentials.password);
      enterAuthenticatedApp(identityUser);
    } catch (error) {
      setAuthMessage(toAuthMessage(error));
    }
  }

  async function handleRegister(profile) {
    const code = profile.company
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();
    const newUser = {
      id: Date.now(),
      name: profile.company,
      email: profile.email,
      role: 'Client',
      active: true,
      code: code || 'NEW',
      password: profile.password,
    };
    setAuthMessage('');
    if (useMockAuth) {
      setUsers((existing) => [...existing.filter((user) => user.email !== newUser.email), newUser]);
      setCustomers((existing) => [
        ...existing.filter((customer) => customer.code !== newUser.code),
        normalizeCustomer({ id: `CUS-${Date.now()}`, name: newUser.name, code: newUser.code, companyName: newUser.name, destination: profile.country, country: profile.country, contact: profile.contact, email: profile.email, status: 'Active' }),
      ]);
      setCurrentUser(newUser);
      setScreen('app');
      setActiveSection('shipments');
      return;
    }

    try {
      const identityUser = await identitySignup(profile.email, profile.password, {
        full_name: profile.company,
        company_name: profile.company,
        contact_person: profile.contact,
        destination_country: profile.country,
        client_code: newUser.code,
      });
      setUsers((existing) => [...existing.filter((user) => user.email !== newUser.email), newUser]);
      if (identityUser.confirmedAt) {
        enterAuthenticatedApp(identityUser, 'shipments');
      } else {
        setScreen('login');
        setAuthMessage('Account created. Check the registered email address to confirm it before signing in.');
      }
    } catch (error) {
      setAuthMessage(toAuthMessage(error));
    }
  }

  async function handlePasswordRecovery(email) {
    setAuthMessage('');
    if (useMockAuth) {
      setAuthMessage(`Password recovery is disabled for the mock account ${email}.`);
      return;
    }

    try {
      await requestPasswordRecovery(email);
      setAuthMessage('Password recovery email sent. Use the link in that email to set a new password.');
    } catch (error) {
      setAuthMessage(toAuthMessage(error));
    }
  }

  async function handlePasswordReset(password) {
    setAuthMessage('');
    try {
      const identityUser = await updateUser({ password });
      enterAuthenticatedApp(identityUser);
      setAuthMessage('Password updated.');
    } catch (error) {
      setAuthMessage(toAuthMessage(error));
    }
  }

  async function handleInviteAccept(password) {
    setAuthMessage('');
    try {
      const identityUser = await acceptInvite(inviteToken, password);
      enterAuthenticatedApp(identityUser);
      setAuthMessage('Account activated.');
    } catch (error) {
      setAuthMessage(toAuthMessage(error));
    }
  }

  async function handleLogout() {
    setAuthMessage('');
    if (useMockAuth) {
      setCurrentUser(null);
      setScreen('login');
      setActiveSection('dashboard');
      return;
    }

    try {
      await identityLogout();
    } catch (error) {
      setAuthMessage(toAuthMessage(error));
    } finally {
      setCurrentUser(null);
      setScreen('login');
      setActiveSection('dashboard');
    }
  }

  function createShipment(form) {
    const trackingNumbers = form.parcels.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    const nextShipmentNumber = Math.max(...shipments.map((shipment) => Number(shipment.id.replace('SHP-', '')))) + 1;
    const id = `SHP-${nextShipmentNumber}`;
    const shipment = {
      id,
      customer: currentUser.name,
      clientCode: currentUser.code,
      status: trackingNumbers.length ? 'Parcels in transit to warehouse' : 'Waiting for parcel tracking numbers',
      expected: Number(form.expected || 1),
      parcels: trackingNumbers,
      destination: form.destination,
      customs: 'Not submitted',
      delivery: 'Request created',
    };
    setShipments((existing) => [shipment, ...existing]);
    if (trackingNumbers.length) {
      setParcels((existing) => [
        ...trackingNumbers.map((tracking) => ({
          tracking,
          shipment: id,
          client: currentUser.name,
          status: 'Tracking number submitted',
          weight: 'Pending',
          dimensions: 'Pending',
          invoice: false,
          payment: false,
          notes: 'Client submitted tracking number',
        })),
        ...existing,
      ]);
    }
    setActiveSection('shipments');
  }

  function addParcelToShipment(shipmentId, trackingNumber) {
    const tracking = trackingNumber.trim().toUpperCase();
    if (!tracking || parcels.some((parcel) => parcel.tracking === tracking)) return;
    const shipment = shipments.find((item) => item.id === shipmentId);
    if (!shipment) return;

    setShipments((existing) =>
      existing.map((item) =>
        item.id === shipmentId
          ? {
              ...item,
              parcels: [...item.parcels, tracking],
              status: 'Parcels in transit to warehouse',
            }
          : item,
      ),
    );
    setParcels((existing) => [
      {
        tracking,
        shipment: shipmentId,
        client: shipment.customer,
        status: 'Tracking number submitted',
        weight: 'Pending',
        dimensions: 'Pending',
        invoice: false,
        payment: false,
        notes: 'Added before packing was closed',
      },
      ...existing,
    ]);
  }

  function addUser(form) {
    const clientRecord = customers.find((customer) => customer.id === form.clientId);
    const name = form.name.trim();
    const email = form.email.trim();
    const role = form.role;
    if (!name) return 'Full name is required.';
    if (!email) return 'Email / username is required.';
    if (!roles.includes(role)) return 'Role is required.';
    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return 'Another user already uses this email / username.';
    if (role === 'Client' && !clientRecord) return 'Linked client/customer is required for Client users.';
    if (!form.password || form.password.length < 8) return 'Temporary password must be at least 8 characters.';

    const newUser = {
      id: Date.now(),
      name,
      email,
      phone: form.phone || '',
      role,
      active: true,
      code: role === 'Client' && clientRecord ? clientRecord.code : form.code.toUpperCase(),
      clientId: role === 'Client' ? clientRecord.id : '',
      notes: form.notes || '',
      password: form.password,
    };
    setUsers((existing) => [
      ...existing,
      newUser,
    ]);
    return `${newUser.name} created.`;
  }

  function editUser(userId, form) {
    if (currentUser?.role !== 'Admin') return 'Only Admin users can edit user accounts.';
    const current = users.find((user) => user.id === userId);
    if (!current) return 'User account was not found.';

    const name = form.name.trim();
    const email = form.email.trim();
    const role = form.role;
    const active = Boolean(form.active);
    const selectedClient = customers.find((customer) => customer.id === form.clientId);
    if (!name) return 'Full name is required.';
    if (!email) return 'Email / username is required.';
    if (!roles.includes(role)) return 'Role is required.';
    if (users.some((user) => user.id !== userId && user.email.toLowerCase() === email.toLowerCase())) {
      return 'Another user already uses this email / username.';
    }
    if (role === 'Client' && !selectedClient) return 'Linked client/customer is required for Client users.';

    const activeAdmins = users.filter((user) => user.role === 'Admin' && user.active);
    const isLastActiveAdmin = current.role === 'Admin' && current.active && activeAdmins.length === 1;
    if (isLastActiveAdmin && role !== 'Admin') {
      return 'The last active Admin user cannot be changed to a non-admin role.';
    }
    if (isLastActiveAdmin && !active) {
      return 'The last active Admin user cannot be disabled.';
    }
    if (
      current.role === 'Admin'
      && (role !== 'Admin' || (!active && current.active))
      && typeof window !== 'undefined'
      && !window.confirm(`${current.name} is an Admin user. Save this sensitive account change?`)
    ) {
      return 'User edit cancelled.';
    }

    const saved = {
      ...current,
      name,
      email,
      phone: String(form.phone || '').trim(),
      role,
      active,
      clientId: role === 'Client' ? selectedClient.id : '',
      code: role === 'Client' ? selectedClient.code : current.code,
      notes: String(form.notes || '').trim(),
    };
    setUsers((existing) => existing.map((user) => (user.id === userId ? saved : user)));
    if (currentUser?.id === userId) {
      setCurrentUser(saved);
    }
    return `${saved.name} saved.`;
  }

  function editCustomer(customerId, form) {
    const current = customers.find((customer) => customer.id === customerId);
    if (!current) return 'Client record was not found.';
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!name || !code) return 'Client name and client code are required.';
    if (customers.some((customer) => customer.id !== customerId && customer.code.toUpperCase() === code)) {
      return 'Another client already uses this client code.';
    }

    const saved = normalizeCustomer({
      ...current,
      ...form,
      name,
      code,
      companyName: form.companyName.trim(),
      contact: form.contact.trim(),
      status: form.active ? 'Active' : 'Inactive',
      destination: form.country.trim() || form.destination || current.destination,
      country: form.country.trim(),
    });
    const oldName = current.name;
    const oldCode = current.code;

    setCustomers((existing) => existing.map((customer) => (customer.id === customerId ? saved : customer)));
    setUsers((existing) =>
      existing.map((user) =>
        user.role === 'Client' && (user.code === oldCode || user.name === oldName)
          ? { ...user, name: saved.name, code: saved.code, active: saved.status === 'Active' }
          : user,
      ),
    );
    setCurrentUser((existing) =>
      existing?.role === 'Client' && (existing.code === oldCode || existing.name === oldName)
        ? { ...existing, name: saved.name, code: saved.code, active: saved.status === 'Active' }
        : existing,
    );
    setShipments((existing) =>
      existing.map((shipment) =>
        shipment.customer === oldName || shipment.clientCode === oldCode
          ? { ...shipment, customer: saved.name, clientCode: saved.code, destination: saved.country || shipment.destination }
          : shipment,
      ),
    );
    setParcels((existing) =>
      existing.map((parcel) =>
        parcel.client === oldName ? { ...parcel, client: saved.name } : parcel,
      ),
    );
    setContainments((existing) =>
      existing.map((box) =>
        box.clientId === customerId || box.client === oldName || box.code === oldCode
          ? { ...box, client: saved.name, clientId: saved.id, code: saved.code, destination: saved.country || box.destination }
          : box,
      ),
    );
    return `${saved.name} saved. Existing containment numbers were left unchanged.`;
  }

  async function changeOwnPassword(form) {
    setAuthMessage('');
    const validation = validatePasswordChange(form.newPassword, form.confirmPassword);
    if (validation) return validation;

    if (useMockAuth) {
      const user = users.find((item) => item.id === currentUser.id);
      if (!user || user.password !== form.currentPassword) return 'Current password is incorrect.';
      const updatedUser = { ...user, password: form.newPassword };
      setUsers((existing) => existing.map((item) => (item.id === user.id ? updatedUser : item)));
      setCurrentUser(updatedUser);
      return 'Password updated successfully.';
    }

    try {
      const identityUser = await updateUser({ password: form.newPassword });
      enterAuthenticatedApp(identityUser, 'profile');
      return 'Password updated successfully.';
    } catch (error) {
      return toAuthMessage(error);
    }
  }

  function resetUserPassword(userId, form) {
    const validation = validatePasswordChange(form.newPassword, form.confirmPassword);
    if (validation) return validation;
    setUsers((existing) => existing.map((user) => (user.id === userId ? { ...user, password: form.newPassword } : user)));
    if (currentUser?.id === userId) {
      setCurrentUser((existing) => (existing ? { ...existing, password: form.newPassword } : existing));
    }
    return 'Password reset successfully.';
  }

  function receiveParcel(tracking) {
    setParcels((existing) =>
      existing.map((parcel) =>
        parcel.tracking === tracking
          ? {
              ...parcel,
              status: 'Received',
              weight: parcel.weight === 'Pending' ? '3.6 kg' : parcel.weight,
              dimensions: parcel.dimensions === 'Pending' ? '38 x 28 x 22 cm' : parcel.dimensions,
              notes: 'Received and measured at warehouse',
            }
          : parcel,
      ),
    );
  }

  function uploadParcelDocument(tracking, field) {
    setParcels((existing) =>
      existing.map((parcel) =>
        parcel.tracking === tracking
          ? {
              ...parcel,
              [field]: true,
              status: parcel.status === 'Received' && field === 'payment' ? 'Ready for packing' : parcel.status,
            }
          : parcel,
      ),
    );
  }

  function openContainment(form = {}) {
    if (currentUser.role !== 'Client' && !form.clientId) {
      setActiveSection('packing');
      return 'Select a client before opening a containment.';
    }
    const clientRecord = currentUser.role === 'Client'
      ? customers.find((customer) => customer.code === currentUser.code) || { id: currentUser.id, name: currentUser.name, code: currentUser.code, destination: 'Pending' }
      : customers.find((customer) => customer.id === form.clientId);
    const boxType = containmentSizes.find((size) => size.id === form.boxTypeId) || containmentSizes.find((size) => size.default && size.active);
    if (!clientRecord || !boxType) return 'Select a client and active box type before opening a containment.';
    const code = clientRecord.code;
    const next = String(containments.filter((box) => box.code === code).length + 1).padStart(4, '0');
    setContainments((existing) => [
      {
        number: `CL24-${code}-${next}`,
        name: form.name || boxType.name,
        client: clientRecord.name,
        clientId: clientRecord.id,
        code,
        boxTypeId: boxType.id,
        boxTypeName: boxType.name,
        width: Number(boxType.width),
        height: Number(boxType.height),
        length: Number(boxType.length),
        unit: boxType.unit || 'cm',
        status: 'Open',
        parcels: 0,
        weight: '0 kg',
        destination: clientRecord.destination || 'Pending',
        container: 'Pending',
        closed: 'Not closed',
      },
      ...existing,
    ]);
    setActiveSection('packing');
    return `Containment CL24-${code}-${next} opened for ${clientRecord.name}.`;
  }

  function closeContainment(number) {
    setContainments((existing) =>
      existing.map((box) =>
        box.number === number
          ? {
              ...box,
              status: 'Locked',
              closed: new Date().toISOString().slice(0, 10),
            }
          : box,
      ),
    );
  }

  function assignContainer(numbers, containerNumber) {
    const selectedNumbers = Array.isArray(numbers) ? numbers : [numbers];
    const container = shippingContainers.find((item) => item.number === containerNumber || item.id === containerNumber);
    if (!container || !availableContainerStatuses.includes(container.status)) return 'Select an available shipping container.';
    const assignable = containments.filter((box) => selectedNumbers.includes(box.number) && ['Locked', 'Closed'].includes(box.status));
    if (!assignable.length) return 'Select at least one locked containment.';
    setContainments((existing) =>
      existing.map((box) =>
        selectedNumbers.includes(box.number)
          ? {
              ...box,
              container: container.number,
            }
          : box,
      ),
    );
    setShippingContainers((existing) =>
      existing.map((item) =>
        item.id === container.id
          ? { ...item, containments: containments.filter((box) => box.container === item.number).length + assignable.length }
          : item,
      ),
    );
    return `${assignable.length} containment${assignable.length === 1 ? '' : 's'} assigned to ${container.number}.`;
  }

  function deleteContainment(number) {
    const box = containments.find((item) => item.number === number);
    if (!box) return 'Containment was not found.';
    const isAdmin = currentUser.role === 'Admin';
    const hasContainer = box.container && box.container !== 'Pending';
    const hasParcels = Number(box.parcels) > 0;
    if (!isAdmin && (protectedContainmentStatuses.includes(box.status) || hasContainer)) {
      return 'Only Admin can delete closed, locked, assigned, loaded, shipped, or delivered containments.';
    }
    const warning = hasParcels
      ? `${box.number} has ${box.parcels} parcel${box.parcels === 1 ? '' : 's'} assigned. Deleting it will release those parcels back to packing. Continue?`
      : `Delete containment ${box.number}? This cannot be undone.`;
    if (typeof window !== 'undefined' && !window.confirm(isAdmin && hasParcels ? `Admin warning: ${warning}` : warning)) {
      return 'Containment deletion cancelled.';
    }

    setContainments((existing) => existing.filter((item) => item.number !== number));
    setParcels((existing) => existing.map((parcel) => releaseParcelFromContainment(parcel, number)));
    setShippingContainers((existing) =>
      existing.map((container) =>
        container.number === box.container || container.id === box.container
          ? { ...container, containments: Math.max(0, Number(container.containments || 0) - 1) }
          : container,
      ),
    );
    return `${box.number} deleted. Assigned parcels were returned to packing.`;
  }

  function addShippingContainer(form) {
    const number = form.number.trim().toUpperCase();
    if (!number) return 'Container number is required.';
    if (shippingContainers.some((container) => container.number === number)) return 'A container with this number already exists.';
    setShippingContainers((existing) => [
      {
        id: number,
        number,
        sealNumber: form.sealNumber,
        carrier: form.carrier,
        vessel: form.vessel,
        originPort: form.originPort,
        destinationPort: form.destinationPort,
        destination: form.destinationPort,
        departureDate: form.departureDate,
        eta: form.eta,
        status: form.status || 'Created',
        notes: form.notes,
        containments: 0,
      },
      ...existing,
    ]);
    return `Shipping container ${number} created.`;
  }

  function editShippingContainer(containerId, form) {
    const current = shippingContainers.find((container) => container.id === containerId);
    if (!current) return 'Shipping container was not found.';
    const number = form.number.trim().toUpperCase();
    if (!number) return 'Container number is required.';
    if (shippingContainers.some((container) => container.id !== containerId && container.number === number)) {
      return 'A container with this number already exists.';
    }
    const saved = {
      ...current,
      id: number,
      number,
      sealNumber: form.sealNumber,
      carrier: form.carrier,
      vessel: form.vessel,
      originPort: form.originPort,
      destinationPort: form.destinationPort,
      destination: form.destinationPort,
      departureDate: form.departureDate,
      eta: form.eta,
      status: form.status,
      notes: form.notes,
    };
    setShippingContainers((existing) => existing.map((container) => (container.id === containerId ? saved : container)));
    if (current.number !== number) {
      setContainments((existing) =>
        existing.map((box) => (box.container === current.number ? { ...box, container: number } : box)),
      );
    }
    return `Shipping container ${number} saved.`;
  }

  function deleteShippingContainer(containerId) {
    const container = shippingContainers.find((item) => item.id === containerId);
    if (!container) return 'Shipping container was not found.';
    const isAdmin = currentUser.role === 'Admin';
    const assignedContainments = containments.filter((box) => box.container === container.number);
    if (!isAdmin && assignedContainments.length) {
      return 'Only Admin can delete containers that have containments assigned.';
    }
    if (!isAdmin && protectedContainerStatuses.includes(container.status)) {
      return 'Only Admin can delete shipped, arrived, customs, cleared, unloaded, or closed containers.';
    }
    const warning = assignedContainments.length
      ? `Admin warning: ${container.number} has ${assignedContainments.length} containment${assignedContainments.length === 1 ? '' : 's'} assigned. Deleting it will unassign them and return them to closed or locked status. Continue?`
      : `Delete shipping container ${container.number}? This cannot be undone.`;
    if (typeof window !== 'undefined' && !window.confirm(warning)) {
      return 'Container deletion cancelled.';
    }
    setShippingContainers((existing) => existing.filter((item) => item.id !== containerId));
    setContainments((existing) =>
      existing.map((box) =>
        box.container === container.number
          ? { ...box, container: 'Pending', status: restoredContainmentStatus(box) }
          : box,
      ),
    );
    return `${container.number} deleted. Assigned containments were unassigned.`;
  }

  function saveContainmentSize(form) {
    const validation = validateContainmentSize(form);
    if (validation) return validation;
    const id = form.id || `BOX-${Date.now()}`;
    const saved = {
      id,
      name: form.name.trim(),
      width: Number(form.width),
      height: Number(form.height),
      length: Number(form.length),
      unit: form.unit || 'cm',
      maxWeight: form.maxWeight,
      active: Boolean(form.active),
      default: Boolean(form.default),
      notes: form.notes,
    };
    setContainmentSizes((existing) => {
      const next = existing.some((size) => size.id === id)
        ? existing.map((size) => (size.id === id ? saved : size))
        : [saved, ...existing];
      return saved.default ? next.map((size) => ({ ...size, default: size.id === id })) : next;
    });
    return `${saved.name} saved.`;
  }

  function toggleContainmentSize(id) {
    setContainmentSizes((existing) => existing.map((size) => (size.id === id ? { ...size, active: !size.active, default: size.default && !size.active } : size)));
  }

  function setDefaultContainmentSize(id) {
    setContainmentSizes((existing) => existing.map((size) => ({ ...size, default: size.id === id, active: size.id === id ? true : size.active })));
  }

  function updateShipmentCustoms(shipmentId, customs) {
    setShipments((existing) =>
      existing.map((shipment) =>
        shipment.id === shipmentId
          ? {
              ...shipment,
              customs,
              status: customs === 'Customs cleared' ? 'Customs cleared' : 'In customs clearance',
              delivery: customs === 'Customs cleared' ? 'Cleared for delivery' : shipment.delivery,
            }
          : shipment,
      ),
    );
  }

  if (authLoading) {
    return <AuthLoading />;
  }

  if (screen === 'register') {
    return <RegisterView message={authMessage} onRegister={handleRegister} onLogin={() => setScreen('login')} />;
  }

  if (screen === 'reset-password') {
    return <PasswordTaskView title="Set New Password" message={authMessage} actionLabel="Update password" onSubmit={handlePasswordReset} />;
  }

  if (screen === 'accept-invite') {
    return <PasswordTaskView title="Activate Account" message={authMessage} actionLabel="Save password" onSubmit={handleInviteAccept} />;
  }

  if (!currentUser) {
    return (
      <LoginView
        message={authMessage}
        registrationDisabled={authSettings.disableSignup}
        onLogin={handleLogin}
        onRegister={() => setScreen('register')}
        onPasswordRecovery={handlePasswordRecovery}
      />
    );
  }

  const allowedNav = navItems.filter((item) => item.roles.includes(currentUser.role));
  const visibleSection = allowedNav.some((item) => item.id === activeSection) ? activeSection : 'dashboard';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand-block">
          <img src="/chinalink24-app.svg" alt="ChinaLink24 App" />
          <div>
            <strong>ChinaLink24</strong>
            <span>Operations App</span>
          </div>
        </div>
        <nav>
          {allowedNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={visibleSection === item.id ? 'active' : ''}
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="topbar-logo">
            <img src="/chinalink24-app.svg" alt="" />
            <span>{sectionTitle(visibleSection)}</span>
          </div>
          <div className="topbar-actions">
            <div className="user-pill">
              <span>{currentUser.name}</span>
              <strong>{currentUser.role}</strong>
            </div>
            <button className="icon-button" onClick={handleLogout} aria-label="Log out">
              <LogOut size={19} />
            </button>
          </div>
        </header>

        {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
        <section className="content">
          <SectionRouter
            section={visibleSection}
            user={currentUser}
            users={users}
            customers={customers}
            containmentSizes={containmentSizes}
            shipments={scoped.shipments}
            parcels={scoped.parcels}
            containments={scoped.containments}
            shippingContainers={currentUser.role === 'Client' ? shippingContainers.filter((container) => scoped.containments.some((box) => box.container === container.number)) : shippingContainers}
            documents={scoped.documents}
            payments={scoped.payments}
            trackingEvents={scoped.trackingEvents}
            onCreateShipment={createShipment}
            onAddParcelToShipment={addParcelToShipment}
            onAddUser={addUser}
            onEditUser={editUser}
            onReceiveParcel={receiveParcel}
            onUploadParcelDocument={uploadParcelDocument}
            onOpenContainment={openContainment}
            onCloseContainment={closeContainment}
            onDeleteContainment={deleteContainment}
            onAssignContainer={assignContainer}
            onAddShippingContainer={addShippingContainer}
            onEditShippingContainer={editShippingContainer}
            onDeleteShippingContainer={deleteShippingContainer}
            onEditCustomer={editCustomer}
            onSaveContainmentSize={saveContainmentSize}
            onToggleContainmentSize={toggleContainmentSize}
            onSetDefaultContainmentSize={setDefaultContainmentSize}
            onChangeOwnPassword={changeOwnPassword}
            onResetUserPassword={resetUserPassword}
            onUpdateShipmentCustoms={updateShipmentCustoms}
          />
        </section>
      </main>
    </div>
  );
}

function LoginView({ message, registrationDisabled, onLogin, onRegister, onPasswordRecovery }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showRecovery, setShowRecovery] = useState(false);
  const canSubmit = form.email && form.password;

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <img src="/chinalink24-app.svg" alt="ChinaLink24 App" />
          <div>
            <h1>ChinaLink24 App</h1>
            <p>Parcel receiving, containment packing, customs, and delivery tracking.</p>
          </div>
        </div>
        <div className="auth-grid">
          <div className="login-card">
            <h2>Sign in</h2>
            <AuthNotice message={message} />
            <label>
              Email or username
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Password
              <input type="password" autoComplete="off" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            <button className="primary-action" disabled={!canSubmit} onClick={() => onLogin(form)}>
              <ShieldCheck size={18} />
              Sign in
            </button>
            <div className="auth-links">
              <button className="text-action" onClick={() => setShowRecovery((visible) => !visible)}>
                Forgot password
              </button>
              {!registrationDisabled && (
                <button className="text-action" onClick={onRegister}>
                  Register a client account
                </button>
              )}
            </div>
            {showRecovery && (
              <div className="recovery-box">
                <button className="secondary-action" disabled={!form.email} onClick={() => onPasswordRecovery(form.email)}>
                  Send recovery email
                </button>
              </div>
            )}
          </div>
          <div className="tracking-strip">
            <Metric label="Warehouse parcels" value="147" />
            <Metric label="Open containments" value="18" />
            <Metric label="Customs reviews" value="23" />
          </div>
        </div>
      </section>
    </div>
  );
}

function RegisterView({ message, onRegister, onLogin }) {
  const [form, setForm] = useState({ company: '', email: '', contact: '', country: '', password: '', confirmPassword: '' });
  const canSubmit = form.company && form.email && form.password.length >= 8 && form.password === form.confirmPassword;

  return (
    <div className="auth-page">
      <section className="auth-panel compact">
        <div className="auth-brand">
          <img src="/chinalink24-app.svg" alt="ChinaLink24 App" />
          <div>
            <h1>Client Registration</h1>
            <p>Create a client portal account for shipment requests and tracking.</p>
          </div>
        </div>
        <div className="login-card wide">
          <AuthNotice message={message} />
          <div className="form-grid">
            <Input label="Company name" value={form.company} onChange={(company) => setForm({ ...form, company })} />
            <Input label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <Input label="Contact person" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
            <Input label="Destination country" value={form.country} onChange={(country) => setForm({ ...form, country })} />
            <Input label="Password" type="password" autoComplete="off" value={form.password} onChange={(password) => setForm({ ...form, password })} />
            <Input label="Confirm password" type="password" autoComplete="off" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} />
          </div>
          <button className="primary-action" disabled={!canSubmit} onClick={() => onRegister(form)}>
            <UserPlus size={18} />
            Create account
          </button>
          <button className="text-action" onClick={onLogin}>
            Back to login
          </button>
        </div>
      </section>
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="auth-page">
      <section className="auth-panel compact">
        <div className="auth-brand">
          <img src="/chinalink24-app.svg" alt="ChinaLink24 App" />
          <div>
            <h1>ChinaLink24 App</h1>
            <p>Preparing secure account access.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PasswordTaskView({ title, message, actionLabel, onSubmit }) {
  const [password, setPassword] = useState('');
  return (
    <div className="auth-page">
      <section className="auth-panel compact">
        <div className="auth-brand">
          <img src="/chinalink24-app.svg" alt="ChinaLink24 App" />
          <div>
            <h1>{title}</h1>
            <p>Choose a password for secure account access.</p>
          </div>
        </div>
        <div className="login-card wide">
          <AuthNotice message={message} />
          <Input label="New password" type="password" autoComplete="off" value={password} onChange={setPassword} />
          <button className="primary-action" disabled={password.length < 8} onClick={() => onSubmit(password)}>
            <Lock size={18} />
            {actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function AuthNotice({ message }) {
  if (!message) return null;
  return <p className="auth-message">{message}</p>;
}

function SectionRouter(props) {
  const { section } = props;
  if (section === 'dashboard') return <Dashboard {...props} />;
  if (section === 'shipments') return <Shipments {...props} />;
  if (section === 'parcels') return <Parcels {...props} />;
  if (section === 'receiving') return <Receiving {...props} />;
  if (section === 'packing') return <Packing {...props} />;
  if (section === 'users') return <UsersPage {...props} />;
  if (section === 'customers') return <Customers {...props} />;
  if (section === 'customs') return <Customs {...props} />;
  if (section === 'containers') return <Containers {...props} />;
  if (section === 'documents') return <Documents {...props} />;
  if (section === 'payments') return <Payments {...props} />;
  if (section === 'profile') return <ProfilePage {...props} />;
  if (section === 'reports') return <SimpleSection title="Reports" icon={BarChart3} lines={['Parcel aging', 'Containment utilization', 'Customs clearance time']} />;
  return <SettingsPage {...props} />;
}

function Dashboard({ user, shipments, parcels, containments, trackingEvents, onOpenContainment }) {
  return (
    <div className="section-stack">
      <div className="hero-band">
        <div>
          <p className="eyebrow">{user.role} workspace</p>
          <h1>Track every parcel from courier number to final delivery.</h1>
        </div>
        <button className="primary-action" onClick={onOpenContainment}>
          <Boxes size={18} />
          Open containment
        </button>
      </div>
      <div className="metrics-grid">
        <Metric label="Active shipments" value={shipments.length} />
        <Metric label="Incoming parcels" value={parcels.length} />
        <Metric label="Containments" value={containments.length} />
        <Metric label="Default box" value="60 x 50 x 90" />
      </div>
      <div className="dashboard-grid">
        <Panel title="Shipment Flow">
          {shipments.map((shipment) => (
            <RecordRow key={shipment.id} title={shipment.id} meta={`${shipment.customer} - ${shipment.destination}`} status={shipment.status} />
          ))}
        </Panel>
        <Panel title="Recent Parcel Events">
          {trackingEvents.map((event) => (
            <RecordRow key={event.id} title={event.tracking} meta={`${event.shipment} - ${event.location}`} status={event.status} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Shipments({ user, shipments, onCreateShipment, onAddParcelToShipment }) {
  return (
    <div className="section-stack">
      {user.role === 'Client' && <ShipmentForm onCreateShipment={onCreateShipment} />}
      <Panel title="Shipment Requests">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shipment</th>
                <th>Customer</th>
                <th>Expected</th>
                <th>Status</th>
                <th>Destination</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td>{shipment.id}</td>
                  <td>{shipment.customer}</td>
                  <td>{shipment.parcels.length}/{shipment.expected}</td>
                  <td><Status label={shipment.status} /></td>
                  <td>{shipment.destination}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {user.role === 'Client' && (
          <div className="shipment-add-grid">
            {shipments.map((shipment) => (
              <AddParcelInline key={shipment.id} shipment={shipment} onAddParcelToShipment={onAddParcelToShipment} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ShipmentForm({ onCreateShipment }) {
  const [form, setForm] = useState({ expected: 1, parcels: '', destination: '' });
  return (
    <Panel title="Create Shipment Request">
      <div className="form-grid">
        <Input label="Expected parcel count" type="number" value={form.expected} onChange={(expected) => setForm({ ...form, expected })} />
        <Input label="Destination country" value={form.destination} onChange={(destination) => setForm({ ...form, destination })} />
        <label className="span-2">
          Parcel tracking numbers
          <textarea value={form.parcels} onChange={(event) => setForm({ ...form, parcels: event.target.value })} placeholder="One tracking number per line" />
        </label>
      </div>
      <div className="placeholder-upload">
        <FileText size={18} />
        Invoice and payment proof placeholders are included for every parcel record.
      </div>
      <button className="primary-action" onClick={() => onCreateShipment(form)} disabled={!form.destination}>
        <Plus size={18} />
        Submit request
      </button>
    </Panel>
  );
}

function AddParcelInline({ shipment, onAddParcelToShipment }) {
  const [tracking, setTracking] = useState('');
  return (
    <div className="inline-add">
      <div>
        <strong>{shipment.id}</strong>
        <span>Add tracking before warehouse packing is closed.</span>
      </div>
      <input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Courier tracking number" />
      <button
        className="secondary-action"
        disabled={!tracking.trim()}
        onClick={() => {
          onAddParcelToShipment(shipment.id, tracking);
          setTracking('');
        }}
      >
        <Plus size={17} />
        Add parcel
      </button>
    </div>
  );
}

function Parcels({ parcels, onUploadParcelDocument }) {
  return (
    <Panel title="Incoming Parcels">
      <div className="card-grid">
        {parcels.map((parcel) => (
          <article className="parcel-card" key={parcel.tracking}>
            <div>
              <strong>{parcel.tracking}</strong>
              <span>{parcel.client} - {parcel.shipment}</span>
            </div>
            <Status label={parcel.status} />
            <dl>
              <dt>Weight</dt><dd>{parcel.weight}</dd>
              <dt>Dimensions</dt><dd>{parcel.dimensions}</dd>
              <dt>Invoice</dt><dd>{parcel.invoice ? 'Uploaded' : 'Missing'}</dd>
              <dt>Payment</dt><dd>{parcel.payment ? 'Uploaded' : 'Missing'}</dd>
              <dt>Notes</dt><dd>{parcel.notes}</dd>
            </dl>
            <div className="parcel-actions">
              <button className="secondary-action" disabled={parcel.invoice} onClick={() => onUploadParcelDocument(parcel.tracking, 'invoice')}>
                <UploadCloud size={17} />
                Invoice
              </button>
              <button className="secondary-action" disabled={parcel.payment} onClick={() => onUploadParcelDocument(parcel.tracking, 'payment')}>
                <UploadCloud size={17} />
                Payment
              </button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Receiving({ parcels, onReceiveParcel }) {
  const [query, setQuery] = useState('');
  const filtered = parcels.filter((parcel) => parcel.tracking.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="section-stack">
      <Panel title="Warehouse Receiving">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tracking number" />
        </label>
        {filtered.map((parcel) => (
          <div className="receiving-row" key={parcel.tracking}>
            <RecordRow title={parcel.tracking} meta={`${parcel.client} - ${parcel.weight}`} status={parcel.status} />
            <button className="secondary-action" onClick={() => onReceiveParcel(parcel.tracking)}>
              <ClipboardCheck size={17} />
              Mark received
            </button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Packing({ user, customers, containmentSizes, parcels, containments, shippingContainers, onOpenContainment, onCloseContainment, onDeleteContainment, onAssignContainer }) {
  const defaultSize = containmentSizes.find((size) => size.default && size.active) || containmentSizes.find((size) => size.active);
  const clientRecord = user.role === 'Client' ? customers.find((customer) => customer.code === user.code) : null;
  const [form, setForm] = useState({ clientId: clientRecord?.id || '', boxTypeId: defaultSize?.id || '', name: defaultSize?.name || '' });
  const [message, setMessage] = useState('');
  const selectedClient = customers.find((customer) => customer.id === form.clientId);
  const eligibleParcels = parcels.filter((parcel) => parcel.client === selectedClient?.name && ['Received', 'Ready for packing'].includes(parcel.status));
  const activeSizes = containmentSizes.filter((size) => size.active);
  const canDeleteContainments = ['Admin', 'Staff', 'Warehouse staff'].includes(user.role);

  function submitOpenContainment() {
    const result = onOpenContainment(form);
    setMessage(result);
  }

  return (
    <div className="section-stack">
      <Panel title="Open New Containment">
        <AuthNotice message={message} />
        <div className="form-grid">
          <label>
            Client
            <select value={form.clientId} disabled={user.role === 'Client'} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
              <option value="">Select client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.code}
                </option>
              ))}
            </select>
          </label>
          <label>
            Box type
            <select
              value={form.boxTypeId}
              onChange={(event) => {
                const size = containmentSizes.find((item) => item.id === event.target.value);
                setForm({ ...form, boxTypeId: event.target.value, name: size?.name || form.name });
              }}
            >
              <option value="">Select box type</option>
              {activeSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.name} - {size.width} x {size.height} x {size.length} {size.unit}
                </option>
              ))}
            </select>
          </label>
          <Input label="Containment name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <div className="generated-number">
            <span>Next number</span>
            <strong>{selectedClient ? `CL24-${selectedClient.code}-${String(containments.filter((box) => box.code === selectedClient.code).length + 1).padStart(4, '0')}` : 'Select a client'}</strong>
          </div>
        </div>
        <div className="available-parcels">
          <strong>Available parcels for selected client</strong>
          <span>{eligibleParcels.length ? eligibleParcels.map((parcel) => parcel.tracking).join(', ') : 'No received or ready parcels available.'}</span>
        </div>
        <button className="primary-action" disabled={!form.clientId || !form.boxTypeId || !form.name} onClick={submitOpenContainment}>
          <Archive size={18} />
          Open new containment
        </button>
      </Panel>
      <AssignContainmentsPanel containments={containments} shippingContainers={shippingContainers} onAssignContainer={onAssignContainer} />
      <div className="containment-grid">
        {containments.map((box) => (
          <article className="label-preview" key={box.number}>
            <div className="label-head">
              <img src="/chinalink24-app.svg" alt="" />
              <div>
                <strong>{box.number}</strong>
                <span>{box.client} - {box.name}</span>
              </div>
            </div>
            <div className="barcode"><ScanLine size={54} /></div>
            <dl>
              <dt>Client code</dt><dd>{box.code}</dd>
              <dt>Box type</dt><dd>{box.boxTypeName}</dd>
              <dt>Box size</dt><dd>{box.width} x {box.height} x {box.length} {box.unit}</dd>
              <dt>Parcel count</dt><dd>{box.parcels}</dd>
              <dt>Total weight</dt><dd>{box.weight}</dd>
              <dt>Date closed</dt><dd>{box.closed}</dd>
              <dt>Destination</dt><dd>{box.destination}</dd>
              <dt>Container</dt><dd>{box.container}</dd>
            </dl>
            <div className="label-actions">
              <Status label={box.status} />
              <button className="secondary-action" disabled={box.status === 'Locked'} onClick={() => onCloseContainment(box.number)}>
                <Lock size={17} />
                Close box
              </button>
              {canDeleteContainments && (
                <button className="danger-action" onClick={() => setMessage(onDeleteContainment(box.number))}>
                  <Trash2 size={17} />
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AssignContainmentsPanel({ containments, shippingContainers, onAssignContainer }) {
  const availableContainers = shippingContainers.filter((container) => availableContainerStatuses.includes(container.status));
  const assignableContainments = containments.filter((box) => box.status === 'Locked');
  const [containerNumber, setContainerNumber] = useState(availableContainers[0]?.number || '');
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');

  function toggle(number) {
    setSelected((existing) => (existing.includes(number) ? existing.filter((item) => item !== number) : [...existing, number]));
  }

  return (
    <Panel title="Assign Containments to Shipping Container">
      <AuthNotice message={message} />
      <div className="assignment-grid">
        <label>
          Available shipping container
          <select value={containerNumber} onChange={(event) => setContainerNumber(event.target.value)}>
            <option value="">Select container</option>
            {availableContainers.map((container) => (
              <option key={container.id} value={container.number}>
                {container.number} - {container.status} - {container.destinationPort} - ETA {container.eta || 'TBC'}
              </option>
            ))}
          </select>
        </label>
        <div className="check-list">
          {assignableContainments.map((box) => (
            <label className="check-row" key={box.number}>
              <input type="checkbox" checked={selected.includes(box.number)} onChange={() => toggle(box.number)} />
              <span>{box.number} - {box.client} - {box.destination}</span>
            </label>
          ))}
          {!assignableContainments.length && <p className="muted-copy">No locked containments are ready for assignment.</p>}
        </div>
      </div>
      <button
        className="primary-action"
        disabled={!containerNumber || !selected.length}
        onClick={() => {
          setMessage(onAssignContainer(selected, containerNumber));
          setSelected([]);
        }}
      >
        <Container size={18} />
        Assign selected
      </button>
    </Panel>
  );
}

function UsersPage({ user: currentUser, users, customers, onAddUser, onEditUser, onResetUserPassword }) {
  const firstClient = customers[0];
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Client', code: firstClient?.code || '', clientId: firstClient?.id || '', notes: '', password: '' });
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="section-stack">
      <Panel title="Create User">
        <AuthNotice message={message} />
        <div className="form-grid">
          <Input label="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Input label="Email / username" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <Input label="Phone number" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
          <label>
            Role
            <select
              value={form.role}
              onChange={(event) => {
                const role = event.target.value;
                setForm({ ...form, role, clientId: role === 'Client' ? form.clientId || firstClient?.id || '' : '', code: role === 'Client' ? form.code || firstClient?.code || '' : form.code });
              }}
            >
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          {form.role === 'Client' ? (
            <label>
              Linked client/customer
              <select
                value={form.clientId}
                onChange={(event) => {
                  const customer = customers.find((item) => item.id === event.target.value);
                  setForm({ ...form, clientId: event.target.value, code: customer?.code || form.code });
                }}
              >
                <option value="">Select client/customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.code}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Input label="User code" value={form.code} onChange={(code) => setForm({ ...form, code })} />
          )}
          <Input label="Temporary password" type="password" autoComplete="off" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          <label className="span-2">
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
        </div>
        <button
          className="primary-action"
          disabled={!form.name || !form.email || !form.code || (form.role === 'Client' && !form.clientId) || form.password.length < 8}
          onClick={() => {
            const result = onAddUser(form);
            setMessage(result);
            if (result.endsWith('created.')) {
              setForm({ name: '', email: '', phone: '', role: 'Client', code: firstClient?.code || '', clientId: firstClient?.id || '', notes: '', password: '' });
            }
          }}
        >
          <UserPlus size={18} />
          Add user
        </button>
      </Panel>
      <Panel title="User Management">
        {users.map((user) => (
          <article className="management-card" key={user.id}>
            <div className="management-summary">
              <RecordRow title={user.name} meta={`${user.email} - ${linkedClientLabel(user, customers)}`} status={user.role} />
              {isAdmin && (
                <button className="secondary-action" onClick={() => setEditingId(user.id)}>
                  <Edit3 size={17} />
                  Edit
                </button>
              )}
            </div>
            <dl>
              <dt>Phone</dt><dd>{user.phone || 'Not set'}</dd>
              <dt>Status</dt><dd>{user.active ? 'Active' : 'Inactive'}</dd>
              <dt>Linked client</dt><dd>{user.role === 'Client' ? linkedClientLabel(user, customers) : 'None'}</dd>
              <dt>Notes</dt><dd>{user.notes || 'No notes'}</dd>
            </dl>
            {editingId === user.id && (
              <UserEditForm
                user={user}
                users={users}
                customers={customers}
                onCancel={() => setEditingId('')}
                onSave={(editForm) => {
                  const result = onEditUser(user.id, editForm);
                  setMessage(result);
                  if (result.endsWith('saved.')) {
                    setEditingId('');
                  }
                }}
              />
            )}
            <AdminPasswordReset user={user} onResetUserPassword={onResetUserPassword} />
          </article>
        ))}
      </Panel>
    </div>
  );
}

function UserEditForm({ user, users, customers, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'Client',
    clientId: user.clientId || customers.find((customer) => customer.code === user.code)?.id || '',
    active: user.active,
    notes: user.notes || '',
  });
  const activeAdmins = users.filter((item) => item.role === 'Admin' && item.active);
  const isLastActiveAdmin = user.role === 'Admin' && user.active && activeAdmins.length === 1;
  const sensitiveAdminChange = user.role === 'Admin' && (form.role !== 'Admin' || !form.active);

  return (
    <div className="edit-panel">
      {sensitiveAdminChange && (
        <p className="warning-message">
          <AlertTriangle size={17} />
          Admin role or status changes require confirmation and cannot remove the last active Admin.
        </p>
      )}
      <div className="form-grid">
        <Input label="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input label="Email / username" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Phone number" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <label>
          Role
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, clientId: event.target.value === 'Client' ? form.clientId : '' })}>
            {roles.map((role) => <option key={role}>{role}</option>)}
          </select>
        </label>
        {form.role === 'Client' && (
          <label>
            Linked client/customer
            <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
              <option value="">Select client/customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.code}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="check-row">
          <input type="checkbox" checked={form.active} disabled={isLastActiveAdmin} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          <span>Active user</span>
        </label>
        <label className="span-2">
          Notes
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
      </div>
      <p className="muted-copy">Password changes stay separate. Existing passwords are not shown here.</p>
      <div className="form-actions">
        <button className="primary-action" disabled={!form.name.trim() || !form.email.trim() || !form.role || (form.role === 'Client' && !form.clientId)} onClick={() => onSave(form)}>
          <Edit3 size={18} />
          Save
        </button>
        <button className="secondary-action" onClick={onCancel}>
          <X size={17} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function AdminPasswordReset({ user, onResetUserPassword }) {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  return (
    <div className="password-reset-box">
      <Input label="New password" type="password" autoComplete="off" value={form.newPassword} onChange={(newPassword) => setForm({ ...form, newPassword })} />
      <Input label="Confirm new password" type="password" autoComplete="off" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} />
      <button
        className="secondary-action"
        disabled={!form.newPassword || !form.confirmPassword}
        onClick={() => {
          setMessage(onResetUserPassword(user.id, form));
          setForm({ newPassword: '', confirmPassword: '' });
        }}
      >
        <KeyRound size={17} />
        Reset password
      </button>
      <AuthNotice message={message} />
    </div>
  );
}

function Customers({ customers, containments, onEditCustomer }) {
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  return (
    <Panel title="Customers">
      <AuthNotice message={message} />
      {customers.map((customer) => (
        <article className="management-card" key={customer.id}>
          <div className="management-summary">
            <RecordRow title={customer.name} meta={`${customer.code} - ${customer.country || customer.destination} - ${customer.contact}`} status={customer.status} />
            <button className="secondary-action" onClick={() => setEditingId(customer.id)}>
              <Edit3 size={17} />
              Edit
            </button>
          </div>
          <dl>
            <dt>Company</dt><dd>{customer.companyName || customer.name}</dd>
            <dt>Email</dt><dd>{customer.email || 'Not set'}</dd>
            <dt>Phone</dt><dd>{customer.phone || 'Not set'}</dd>
            <dt>VAT / tax / ID</dt><dd>{customer.taxId || 'Not set'}</dd>
            <dt>Address</dt><dd>{customer.address || 'Not set'}</dd>
            <dt>Notes</dt><dd>{customer.notes || 'No notes'}</dd>
          </dl>
          {editingId === customer.id && (
            <CustomerEditForm
              customer={customer}
              containments={containments}
              onCancel={() => setEditingId('')}
              onSave={(form) => {
                const codeChanged = form.code.trim().toUpperCase() !== customer.code;
                const codeUsedInContainments = containments.some((box) => box.number.includes(`-${customer.code}-`) || box.code === customer.code);
                if (codeChanged && codeUsedInContainments && typeof window !== 'undefined' && !window.confirm(`Client code ${customer.code} is already used in existing containment numbers. Old containment numbers will not be renamed. Save the new client code?`)) {
                  setMessage('Client edit cancelled.');
                  return;
                }
                setMessage(onEditCustomer(customer.id, form));
                setEditingId('');
              }}
            />
          )}
        </article>
      ))}
    </Panel>
  );
}

function CustomerEditForm({ customer, containments, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: customer.name || '',
    code: customer.code || '',
    companyName: customer.companyName || customer.name || '',
    contact: customer.contact || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    country: customer.country || customer.destination || '',
    taxId: customer.taxId || '',
    notes: customer.notes || '',
    active: customer.status !== 'Inactive',
  });
  const hasContainmentCode = containments.some((box) => box.number.includes(`-${customer.code}-`) || box.code === customer.code);
  const codeChanged = form.code.trim().toUpperCase() !== customer.code;

  return (
    <div className="edit-panel">
      {codeChanged && hasContainmentCode && (
        <p className="warning-message">
          <AlertTriangle size={17} />
          Existing containment numbers use this client code. Saving will not rename old containment numbers.
        </p>
      )}
      <div className="form-grid">
        <Input label="Client name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input label="Client code" value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <Input label="Company name" value={form.companyName} onChange={(companyName) => setForm({ ...form, companyName })} />
        <Input label="Contact person" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
        <Input label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Phone number" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <Input label="Country" value={form.country} onChange={(country) => setForm({ ...form, country })} />
        <Input label="VAT / tax / ID number" value={form.taxId} onChange={(taxId) => setForm({ ...form, taxId })} />
        <label className="span-2">
          Address
          <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </label>
        <label className="span-2">
          Notes
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          <span>Active client</span>
        </label>
      </div>
      <div className="form-actions">
        <button className="primary-action" disabled={!form.name.trim() || !form.code.trim()} onClick={() => onSave(form)}>
          <Edit3 size={18} />
          Save
        </button>
        <button className="secondary-action" onClick={onCancel}>
          <X size={17} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function Customs({ shipments, onUpdateShipmentCustoms }) {
  return (
    <Panel title="Customs Clearance">
      {shipments.map((shipment) => (
        <div className="customs-row" key={shipment.id}>
          <RecordRow title={shipment.id} meta={`${shipment.customer} - ${shipment.customs}`} status={shipment.status} />
          <div className="customs-actions">
            <button className="secondary-action" onClick={() => onUpdateShipmentCustoms(shipment.id, 'Documents under review')}>
              Review docs
            </button>
            <button className="secondary-action" onClick={() => onUpdateShipmentCustoms(shipment.id, 'Customs cleared')}>
              Clear
            </button>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function Containers({ user, containments, shippingContainers, onAddShippingContainer, onEditShippingContainer, onDeleteShippingContainer }) {
  const [form, setForm] = useState({
    number: '',
    sealNumber: '',
    carrier: '',
    vessel: '',
    originPort: '',
    destinationPort: '',
    departureDate: '',
    eta: '',
    status: 'Created',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const canManage = ['Admin', 'Staff', 'Warehouse staff'].includes(user.role);
  return (
    <div className="section-stack">
      {canManage && (
        <Panel title="Add New Container">
          <AuthNotice message={message} />
          <div className="form-grid">
            <Input label="Container number" value={form.number} onChange={(number) => setForm({ ...form, number })} />
            <Input label="Seal number" value={form.sealNumber} onChange={(sealNumber) => setForm({ ...form, sealNumber })} />
            <Input label="Shipping line / carrier" value={form.carrier} onChange={(carrier) => setForm({ ...form, carrier })} />
            <Input label="Vessel name or truck reference" value={form.vessel} onChange={(vessel) => setForm({ ...form, vessel })} />
            <Input label="Origin port" value={form.originPort} onChange={(originPort) => setForm({ ...form, originPort })} />
            <Input label="Destination port" value={form.destinationPort} onChange={(destinationPort) => setForm({ ...form, destinationPort })} />
            <Input label="Departure date" type="date" value={form.departureDate} onChange={(departureDate) => setForm({ ...form, departureDate })} />
            <Input label="ETA" type="date" value={form.eta} onChange={(eta) => setForm({ ...form, eta })} />
            <label>
              Status
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {allContainerStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>
              Notes
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>
          <button
            className="primary-action"
            disabled={!form.number}
            onClick={() => {
              setMessage(onAddShippingContainer(form));
              setForm({ number: '', sealNumber: '', carrier: '', vessel: '', originPort: '', destinationPort: '', departureDate: '', eta: '', status: 'Created', notes: '' });
            }}
          >
            <Plus size={18} />
            Add container
          </button>
        </Panel>
      )}
      <Panel title="Shipping Containers">
        {shippingContainers.map((container) => (
          <ContainerManagementCard
            key={container.id}
            container={container}
            assignedContainments={containments.filter((box) => box.container === container.number)}
            canManage={canManage}
            onEditShippingContainer={onEditShippingContainer}
            onDeleteShippingContainer={onDeleteShippingContainer}
          />
        ))}
        {containments.filter((box) => box.container !== 'Pending').map((box) => (
          <RecordRow key={box.number} title={box.container} meta={`${box.number} - ${box.client} - ${box.destination}`} status={box.status} />
        ))}
      </Panel>
    </div>
  );
}

function ContainerManagementCard({ container, assignedContainments, canManage, onEditShippingContainer, onDeleteShippingContainer }) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <article className="management-card">
      <AuthNotice message={message} />
      <div className="management-summary">
        <RecordRow
          title={container.number}
          meta={`${container.originPort || 'Origin TBC'} to ${container.destinationPort || 'Destination TBC'} - ${container.carrier || 'Carrier TBC'} - ${assignedContainments.length || container.containments || 0} containments - ETA ${container.eta || 'TBC'}`}
          status={container.status}
        />
        {canManage && (
          <div className="row-actions">
            <button className="secondary-action" onClick={() => setEditing(true)}>
              <Edit3 size={17} />
              Edit
            </button>
            <button className="danger-action" onClick={() => setMessage(onDeleteShippingContainer(container.id))}>
              <Trash2 size={17} />
              Delete
            </button>
          </div>
        )}
      </div>
      <dl>
        <dt>Seal</dt><dd>{container.sealNumber || 'Not set'}</dd>
        <dt>Vessel / truck</dt><dd>{container.vessel || 'Not set'}</dd>
        <dt>Departure</dt><dd>{container.departureDate || 'TBC'}</dd>
        <dt>Notes</dt><dd>{container.notes || 'No notes'}</dd>
      </dl>
      {editing && (
        <ContainerEditForm
          container={container}
          onCancel={() => setEditing(false)}
          onSave={(form) => {
            setMessage(onEditShippingContainer(container.id, form));
            setEditing(false);
          }}
        />
      )}
    </article>
  );
}

function ContainerEditForm({ container, onSave, onCancel }) {
  const [form, setForm] = useState({
    number: container.number || '',
    sealNumber: container.sealNumber || '',
    carrier: container.carrier || '',
    vessel: container.vessel || '',
    originPort: container.originPort || '',
    destinationPort: container.destinationPort || '',
    departureDate: container.departureDate || '',
    eta: container.eta || '',
    status: container.status || 'Created',
    notes: container.notes || '',
  });

  return (
    <div className="edit-panel">
      <div className="form-grid">
        <Input label="Container number" value={form.number} onChange={(number) => setForm({ ...form, number })} />
        <Input label="Seal number" value={form.sealNumber} onChange={(sealNumber) => setForm({ ...form, sealNumber })} />
        <Input label="Shipping line / carrier" value={form.carrier} onChange={(carrier) => setForm({ ...form, carrier })} />
        <Input label="Vessel name or truck reference" value={form.vessel} onChange={(vessel) => setForm({ ...form, vessel })} />
        <Input label="Origin port" value={form.originPort} onChange={(originPort) => setForm({ ...form, originPort })} />
        <Input label="Destination port" value={form.destinationPort} onChange={(destinationPort) => setForm({ ...form, destinationPort })} />
        <Input label="Departure date" type="date" value={form.departureDate} onChange={(departureDate) => setForm({ ...form, departureDate })} />
        <Input label="ETA" type="date" value={form.eta} onChange={(eta) => setForm({ ...form, eta })} />
        <label>
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {allContainerStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label>
          Notes
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
      </div>
      <div className="form-actions">
        <button className="primary-action" disabled={!form.number.trim()} onClick={() => onSave(form)}>
          <Edit3 size={18} />
          Save
        </button>
        <button className="secondary-action" onClick={onCancel}>
          <X size={17} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function Documents({ documents }) {
  return (
    <Panel title="Documents">
      {documents.map((document) => (
        <RecordRow key={document.id} title={document.title} meta={`${document.owner} - ${document.shipment}`} status={document.status} />
      ))}
    </Panel>
  );
}

function Payments({ payments }) {
  return (
    <Panel title="Payments">
      {payments.map((payment) => (
        <RecordRow key={payment.id} title={`${payment.customer} - ${payment.amount}`} meta={payment.shipment} status={payment.status} />
      ))}
    </Panel>
  );
}

function ProfilePage({ user, onChangeOwnPassword }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  return (
    <div className="section-stack">
      <Panel title="Profile">
        <RecordRow title={user.name} meta={`${user.email} - ${user.code}`} status={user.role} />
      </Panel>
      <Panel title="Change Password">
        <AuthNotice message={message} />
        <div className="form-grid">
          <Input label="Current password" type="password" autoComplete="off" value={form.currentPassword} onChange={(currentPassword) => setForm({ ...form, currentPassword })} />
          <Input label="New password" type="password" autoComplete="off" value={form.newPassword} onChange={(newPassword) => setForm({ ...form, newPassword })} />
          <Input label="Confirm new password" type="password" autoComplete="off" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} />
        </div>
        <button
          className="primary-action"
          disabled={!form.currentPassword || !form.newPassword || !form.confirmPassword}
          onClick={async () => {
            setMessage(await onChangeOwnPassword(form));
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          }}
        >
          <KeyRound size={18} />
          Update password
        </button>
      </Panel>
    </div>
  );
}

function SettingsPage({ containmentSizes, onSaveContainmentSize, onToggleContainmentSize, onSetDefaultContainmentSize }) {
  const emptyForm = { id: '', name: '', width: '', height: '', length: '', unit: 'cm', maxWeight: '', active: true, default: false, notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  return (
    <div className="section-stack">
      <Panel title="Containment Sizes / Box Types">
        <AuthNotice message={message} />
        <div className="form-grid">
          <Input label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Input label="Width" type="number" value={form.width} onChange={(width) => setForm({ ...form, width })} />
          <Input label="Height" type="number" value={form.height} onChange={(height) => setForm({ ...form, height })} />
          <Input label="Length" type="number" value={form.length} onChange={(length) => setForm({ ...form, length })} />
          <Input label="Unit" value={form.unit} onChange={(unit) => setForm({ ...form, unit })} />
          <Input label="Max weight" value={form.maxWeight} onChange={(maxWeight) => setForm({ ...form, maxWeight })} />
          <label className="check-row">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            <span>Active</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={form.default} onChange={(event) => setForm({ ...form, default: event.target.checked })} />
            <span>Set as default</span>
          </label>
          <label className="span-2">
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
        </div>
        <button
          className="primary-action"
          onClick={() => {
            setMessage(onSaveContainmentSize(form));
            setForm(emptyForm);
          }}
        >
          <Plus size={18} />
          Save box type
        </button>
      </Panel>
      <Panel title="Box Type Management">
        {containmentSizes.map((size) => (
          <div className="user-row" key={size.id}>
            <RecordRow title={size.name} meta={`${size.width} x ${size.height} x ${size.length} ${size.unit}${size.maxWeight ? ` - max ${size.maxWeight}` : ''}`} status={size.active ? (size.default ? 'Default' : 'Active') : 'Inactive'} />
            <button className="secondary-action" onClick={() => setForm(size)}>
              Edit
            </button>
            <button className="secondary-action" onClick={() => onToggleContainmentSize(size.id)}>
              {size.active ? 'Deactivate' : 'Activate'}
            </button>
            <button className="secondary-action" disabled={size.default} onClick={() => onSetDefaultContainmentSize(size.id)}>
              Set default
            </button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function SimpleSection({ title, icon: Icon, lines }) {
  return (
    <Panel title={title}>
      <div className="simple-section">
        <Icon size={36} />
        {lines.map((line) => <RecordRow key={line} title={line} meta="Prepared for operational workflow" status="Ready" />)}
      </div>
    </Panel>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RecordRow({ title, meta, status }) {
  return (
    <div className="record-row">
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      <Status label={status} />
    </div>
  );
}

function Status({ label }) {
  return <span className={`status ${statusTone[label] || 'neutral'}`}>{label}</span>;
}

function Input({ label, value, onChange, type = 'text', autoComplete }) {
  return (
    <label>
      {label}
      <input type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function sectionTitle(id) {
  return navItems.find((item) => item.id === id)?.label || 'Dashboard';
}

function scopeRecords(user, shipments, parcels, containments, documents, payments, trackingEvents) {
  if (!user || user.role !== 'Client') return { shipments, parcels, containments, documents, payments, trackingEvents };
  const clientShipments = shipments.filter((shipment) => shipment.customer === user.name || shipment.clientCode === user.code);
  const shipmentIds = clientShipments.map((shipment) => shipment.id);
  return {
    shipments: clientShipments,
    parcels: parcels.filter((parcel) => parcel.client === user.name || shipmentIds.includes(parcel.shipment)),
    containments: containments.filter((box) => box.client === user.name || box.code === user.code),
    documents: documents.filter((document) => document.owner === user.name || shipmentIds.includes(document.shipment)),
    payments: payments.filter((payment) => payment.customer === user.name || shipmentIds.includes(payment.shipment)),
    trackingEvents: trackingEvents.filter((event) => shipmentIds.includes(event.shipment)),
  };
}

function normalizeCustomer(customer) {
  const country = customer.country || customer.destination || '';
  return {
    id: customer.id,
    name: customer.name || customer.companyName || 'Unnamed client',
    code: String(customer.code || createClientCode(customer.name || customer.companyName || 'NEW')).toUpperCase(),
    companyName: customer.companyName || customer.name || '',
    contact: customer.contact || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    country,
    destination: country,
    taxId: customer.taxId || customer.vat || customer.taxNumber || '',
    notes: customer.notes || '',
    status: customer.status === 'Inactive' ? 'Inactive' : customer.status || 'Active',
  };
}

function releaseParcelFromContainment(parcel, containmentNumber) {
  const assignedByField = parcel.containment === containmentNumber || parcel.containmentNumber === containmentNumber;
  const assignedByNotes = typeof parcel.notes === 'string' && parcel.notes.includes(containmentNumber);
  if (!assignedByField && !assignedByNotes) return parcel;
  return {
    ...parcel,
    containment: '',
    containmentNumber: '',
    status: parcel.payment && parcel.invoice ? 'Ready for packing' : 'Received',
    notes: `Released from deleted containment ${containmentNumber}.`,
  };
}

function restoredContainmentStatus(box) {
  if (box.status === 'Closed') return 'Closed';
  if (box.closed && box.closed !== 'Not closed') return 'Locked';
  return 'Closed';
}

function mapIdentityUser(identityUser, localUsers) {
  if (!identityUser) return null;
  const matchedUser = localUsers.find((user) => user.email.toLowerCase() === (identityUser.email || '').toLowerCase());
  const metadata = identityUser.userMetadata || {};
  const name = identityUser.name || metadata.company_name || metadata.full_name || matchedUser?.name || identityUser.email || 'ChinaLink24 User';
  const role = resolveRole(identityUser, matchedUser);
  const code = metadata.client_code || metadata.company_code || matchedUser?.code || createClientCode(String(name));

  return {
    id: identityUser.id,
    name: String(name),
    email: identityUser.email || matchedUser?.email || '',
    phone: metadata.phone || matchedUser?.phone || '',
    role,
    active: true,
    code: String(code).toUpperCase(),
    clientId: matchedUser?.clientId || '',
    notes: matchedUser?.notes || '',
  };
}

function linkedClientLabel(user, customers) {
  const linked = customers.find((customer) => customer.id === user.clientId || customer.code === user.code);
  if (user.role === 'Client') {
    return linked ? `${linked.name} - ${linked.code}` : user.code || 'No linked client';
  }
  return user.code || 'No code';
}

function resolveRole(identityUser, matchedUser) {
  const identityRoles = [
    ...(identityUser.roles || []),
    ...(Array.isArray(identityUser.appMetadata?.roles) ? identityUser.appMetadata.roles : []),
    identityUser.role,
  ].filter(Boolean);
  const normalized = identityRoles.map((role) => roleAliases[String(role).toLowerCase()]).find(Boolean);
  return normalized || matchedUser?.role || 'Client';
}

const roleAliases = {
  admin: 'Admin',
  staff: 'Staff',
  operations: 'Staff',
  warehouse: 'Warehouse staff',
  'warehouse staff': 'Warehouse staff',
  customs: 'Customs staff',
  'customs staff': 'Customs staff',
  client: 'Client',
  member: 'Client',
};

function createClientCode(name) {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 4)
      .toUpperCase() || 'NEW'
  );
}

function validatePasswordChange(newPassword, confirmPassword) {
  if (!newPassword) return 'New password cannot be empty.';
  if (newPassword.length < 8) return 'New password must be at least 8 characters.';
  if (newPassword !== confirmPassword) return 'Confirm password must match.';
  return '';
}

function validateContainmentSize(form) {
  if (!form.name?.trim()) return 'Box type name is required.';
  if (!Number(form.width) || !Number(form.height) || !Number(form.length)) return 'Width, height, and length are required.';
  return '';
}

function toAuthMessage(error) {
  if (error instanceof MissingIdentityError) {
    return 'Account access is not enabled for this environment. Use the deployed Netlify site or Netlify Dev.';
  }
  if (error instanceof AuthError) {
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 403) return 'This account action is not allowed. Contact an administrator.';
    if (error.status === 422) return 'Check the email address and password requirements.';
    return error.message;
  }
  return 'Account access could not be completed. Try again.';
}

export default App;
