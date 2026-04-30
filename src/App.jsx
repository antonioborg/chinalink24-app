import { useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Container,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  PackagePlus,
  Plus,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';

const roles = ['Admin', 'Staff', 'Warehouse staff', 'Customs staff', 'Client'];

// Backend integration point: replace these session-scoped mocks with API calls
// backed by Netlify Functions and a server-side PostgreSQL connection.
const demoUsers = [
  { id: 1, name: 'Mina Zhang', email: 'admin@chinalink24.com', role: 'Admin', active: true, code: 'HQ' },
  { id: 2, name: 'David Mensah', email: 'staff@chinalink24.com', role: 'Staff', active: true, code: 'OPS' },
  { id: 3, name: 'Lin Wei', email: 'warehouse@chinalink24.com', role: 'Warehouse staff', active: true, code: 'WH' },
  { id: 4, name: 'Amara Okafor', email: 'customs@chinalink24.com', role: 'Customs staff', active: true, code: 'CUS' },
  { id: 5, name: 'TechNova Imports', email: 'client@technova.example', role: 'Client', active: true, code: 'TECH' },
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
  { tracking: 'YT923847510CN', shipment: 'SHP-1048', client: 'TechNova Imports', status: 'Received', weight: '7.4 kg', invoice: true, payment: false },
  { tracking: 'SF109384720CN', shipment: 'SHP-1048', client: 'TechNova Imports', status: 'Ready for packing', weight: '4.8 kg', invoice: true, payment: true },
  { tracking: 'ZTO493827104CN', shipment: 'SHP-1048', client: 'TechNova Imports', status: 'In transit to warehouse', weight: 'Pending', invoice: false, payment: false },
  { tracking: 'JD394857201CN', shipment: 'SHP-1049', client: 'Blue Harbor Retail', status: 'Packed into containment', weight: '11.2 kg', invoice: true, payment: true },
];

const initialContainments = [
  {
    number: 'CL24-TECH-0001',
    client: 'TechNova Imports',
    code: 'TECH',
    status: 'Packing in progress',
    parcels: 2,
    weight: '12.2 kg',
    destination: 'Ghana',
    container: 'Pending',
    closed: 'Not closed',
  },
  {
    number: 'CL24-BHR-0001',
    client: 'Blue Harbor Retail',
    code: 'BHR',
    status: 'Locked',
    parcels: 9,
    weight: '86.7 kg',
    destination: 'Nigeria',
    container: 'CMAU-482913-7',
    closed: '2026-04-24',
  },
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
  { id: 'users', label: 'Users', icon: UserPlus, roles: ['Admin'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Staff'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
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
};

function App() {
  const [screen, setScreen] = useState('login');
  const [users, setUsers] = useState(demoUsers);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [shipments, setShipments] = useState(initialShipments);
  const [parcels, setParcels] = useState(initialParcels);
  const [containments, setContainments] = useState(initialContainments);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scoped = useMemo(() => scopeRecords(currentUser, shipments, parcels, containments), [currentUser, shipments, parcels, containments]);

  function handleLogin(email) {
    const selected = users.find((user) => user.email === email && user.active);
    if (selected) {
      setCurrentUser(selected);
      setScreen('app');
      setActiveSection('dashboard');
    }
  }

  function handleRegister(profile) {
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
    };
    setUsers((existing) => [...existing, newUser]);
    setCurrentUser(newUser);
    setScreen('app');
    setActiveSection('shipments');
  }

  function createShipment(form) {
    const shipment = {
      id: `SHP-${1050 + shipments.length}`,
      customer: currentUser.name,
      clientCode: currentUser.code,
      status: form.parcels ? 'Parcels in transit to warehouse' : 'Waiting for parcel tracking numbers',
      expected: Number(form.expected || 1),
      parcels: form.parcels.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
      destination: form.destination,
      customs: 'Not submitted',
      delivery: 'Request created',
    };
    setShipments((existing) => [shipment, ...existing]);
    setActiveSection('shipments');
  }

  function addUser(form) {
    setUsers((existing) => [
      ...existing,
      {
        id: Date.now(),
        name: form.name,
        email: form.email,
        role: form.role,
        active: true,
        code: form.code.toUpperCase(),
      },
    ]);
  }

  function receiveParcel(tracking) {
    setParcels((existing) =>
      existing.map((parcel) =>
        parcel.tracking === tracking ? { ...parcel, status: 'Received', weight: parcel.weight === 'Pending' ? '3.6 kg' : parcel.weight } : parcel,
      ),
    );
  }

  function openContainment() {
    const code = currentUser.role === 'Client' ? currentUser.code : 'TECH';
    const client = currentUser.role === 'Client' ? currentUser.name : 'TechNova Imports';
    const next = String(containments.filter((box) => box.code === code).length + 1).padStart(4, '0');
    setContainments((existing) => [
      {
        number: `CL24-${code}-${next}`,
        client,
        code,
        status: 'Open',
        parcels: 0,
        weight: '0 kg',
        destination: 'Pending',
        container: 'Pending',
        closed: 'Not closed',
      },
      ...existing,
    ]);
    setActiveSection('packing');
  }

  if (screen === 'register') {
    return <RegisterView onRegister={handleRegister} onLogin={() => setScreen('login')} />;
  }

  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} onRegister={() => setScreen('register')} />;
  }

  const allowedNav = navItems.filter((item) => item.roles.includes(currentUser.role));

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
                className={activeSection === item.id ? 'active' : ''}
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
            <span>{sectionTitle(activeSection)}</span>
          </div>
          <div className="topbar-actions">
            <div className="user-pill">
              <span>{currentUser.name}</span>
              <strong>{currentUser.role}</strong>
            </div>
            <button className="icon-button" onClick={() => setCurrentUser(null)} aria-label="Log out">
              <LogOut size={19} />
            </button>
          </div>
        </header>

        {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
        <section className="content">
          <SectionRouter
            section={activeSection}
            user={currentUser}
            users={users}
            shipments={scoped.shipments}
            parcels={scoped.parcels}
            containments={scoped.containments}
            onCreateShipment={createShipment}
            onAddUser={addUser}
            onReceiveParcel={receiveParcel}
            onOpenContainment={openContainment}
            setUsers={setUsers}
          />
        </section>
      </main>
    </div>
  );
}

function LoginView({ users, onLogin, onRegister }) {
  const [email, setEmail] = useState(users[0].email);
  const activeUsers = users.filter((user) => user.active);

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
            <label>
              Demo account
              <select value={email} onChange={(event) => setEmail(event.target.value)}>
                {activeUsers.map((user) => (
                  <option value={user.email} key={user.id}>
                    {user.role} - {user.email}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-action" onClick={() => onLogin(email)}>
              <ShieldCheck size={18} />
              Continue
            </button>
            <button className="text-action" onClick={onRegister}>
              Register a client account
            </button>
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

function RegisterView({ onRegister, onLogin }) {
  const [form, setForm] = useState({ company: '', email: '', contact: '', country: '' });
  const canSubmit = form.company && form.email;

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
          <div className="form-grid">
            <Input label="Company name" value={form.company} onChange={(company) => setForm({ ...form, company })} />
            <Input label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <Input label="Contact person" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
            <Input label="Destination country" value={form.country} onChange={(country) => setForm({ ...form, country })} />
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
  if (section === 'documents') return <SimpleSection title="Documents" icon={FileText} lines={['Invoice placeholders', 'Payment proof placeholders', 'Document review queue']} />;
  if (section === 'payments') return <SimpleSection title="Payments" icon={CreditCard} lines={['Proof uploaded', 'Awaiting validation', 'Cleared for packing']} />;
  if (section === 'reports') return <SimpleSection title="Reports" icon={BarChart3} lines={['Parcel aging', 'Containment utilization', 'Customs clearance time']} />;
  return <SimpleSection title="Settings" icon={Settings} lines={['Default containment size: 60 x 50 x 90 cm', 'Role permissions', 'Notification preferences']} />;
}

function Dashboard({ user, shipments, parcels, containments, onOpenContainment }) {
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
          {parcels.map((parcel) => (
            <RecordRow key={parcel.tracking} title={parcel.tracking} meta={parcel.shipment} status={parcel.status} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Shipments({ user, shipments, onCreateShipment }) {
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
        Invoice and payment proof upload placeholders are ready for backend storage integration.
      </div>
      <button className="primary-action" onClick={() => onCreateShipment(form)} disabled={!form.destination}>
        <Plus size={18} />
        Submit request
      </button>
    </Panel>
  );
}

function Parcels({ parcels }) {
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
              <dt>Invoice</dt><dd>{parcel.invoice ? 'Uploaded' : 'Missing'}</dd>
              <dt>Payment</dt><dd>{parcel.payment ? 'Uploaded' : 'Missing'}</dd>
            </dl>
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

function Packing({ containments, onOpenContainment }) {
  return (
    <div className="section-stack">
      <div className="toolbar-row">
        <button className="primary-action" onClick={onOpenContainment}>
          <Archive size={18} />
          Open new box
        </button>
      </div>
      <div className="containment-grid">
        {containments.map((box) => (
          <article className="label-preview" key={box.number}>
            <div className="label-head">
              <img src="/chinalink24-app.svg" alt="" />
              <div>
                <strong>{box.number}</strong>
                <span>{box.client}</span>
              </div>
            </div>
            <div className="barcode"><ScanLine size={54} /></div>
            <dl>
              <dt>Client code</dt><dd>{box.code}</dd>
              <dt>Box size</dt><dd>60 x 50 x 90 cm</dd>
              <dt>Parcel count</dt><dd>{box.parcels}</dd>
              <dt>Total weight</dt><dd>{box.weight}</dd>
              <dt>Date closed</dt><dd>{box.closed}</dd>
              <dt>Destination</dt><dd>{box.destination}</dd>
              <dt>Container</dt><dd>{box.container}</dd>
            </dl>
            <Status label={box.status} />
          </article>
        ))}
      </div>
    </div>
  );
}

function UsersPage({ users, onAddUser, setUsers }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Client', code: '' });
  return (
    <div className="section-stack">
      <Panel title="Create User">
        <div className="form-grid">
          <Input label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Input label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <Input label="Client code" value={form.code} onChange={(code) => setForm({ ...form, code })} />
        </div>
        <button className="primary-action" disabled={!form.name || !form.email || !form.code} onClick={() => onAddUser(form)}>
          <UserPlus size={18} />
          Add user
        </button>
      </Panel>
      <Panel title="User Management">
        {users.map((user) => (
          <div className="user-row" key={user.id}>
            <RecordRow title={user.name} meta={`${user.email} - ${user.code}`} status={user.role} />
            <button
              className="secondary-action"
              onClick={() => setUsers((existing) => existing.map((item) => (item.id === user.id ? { ...item, active: !item.active } : item)))}
            >
              {user.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Customers({ shipments }) {
  const customers = [...new Map(shipments.map((shipment) => [shipment.customer, shipment])).values()];
  return (
    <Panel title="Customers">
      {customers.map((customer) => (
        <RecordRow key={customer.customer} title={customer.customer} meta={`Client code ${customer.clientCode} - ${customer.destination}`} status={customer.status} />
      ))}
    </Panel>
  );
}

function Customs({ shipments }) {
  return (
    <Panel title="Customs Clearance">
      {shipments.map((shipment) => (
        <RecordRow key={shipment.id} title={shipment.id} meta={`${shipment.customer} - ${shipment.customs}`} status={shipment.status} />
      ))}
    </Panel>
  );
}

function Containers({ containments }) {
  return (
    <Panel title="Shipping Containers">
      {containments.map((box) => (
        <RecordRow key={box.number} title={box.container} meta={`${box.number} - ${box.destination}`} status={box.status} />
      ))}
    </Panel>
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

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function sectionTitle(id) {
  return navItems.find((item) => item.id === id)?.label || 'Dashboard';
}

function scopeRecords(user, shipments, parcels, containments) {
  if (!user || user.role !== 'Client') return { shipments, parcels, containments };
  return {
    shipments: shipments.filter((shipment) => shipment.customer === user.name || shipment.clientCode === user.code),
    parcels: parcels.filter((parcel) => parcel.client === user.name),
    containments: containments.filter((box) => box.client === user.name || box.code === user.code),
  };
}

export default App;
