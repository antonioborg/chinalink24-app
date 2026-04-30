import {
  AlertTriangle,
  Archive,
  BarChart3,
  Boxes,
  ClipboardCheck,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  PackageCheck,
  Plus,
  Printer,
  QrCode,
  Search,
  Settings,
  Ship,
  ShieldCheck,
  Truck,
  Upload,
  Users,
  X
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Role = "admin" | "staff" | "warehouse" | "customs" | "client";
type Section =
  | "Dashboard"
  | "Customers"
  | "Shipments"
  | "Incoming Parcels"
  | "Warehouse Receiving"
  | "Packing / Containments"
  | "Shipping Containers"
  | "Customs Clearance"
  | "Documents"
  | "Payments"
  | "Reports"
  | "Settings";

type Customer = {
  id: string;
  name: string;
  code: string;
  country: string;
  contact: string;
  status: "Active" | "Review";
};

type Parcel = {
  id: string;
  trackingNumber: string;
  shipmentId: string;
  customerId: string;
  status: ParcelStatus;
  weightKg?: number;
  dimensions?: string;
  invoice: boolean;
  paymentProof: boolean;
  notes?: string;
};

type Shipment = {
  id: string;
  reference: string;
  customerId: string;
  destinationCountry: string;
  expectedParcels: number;
  status: ShipmentStatus;
  createdAt: string;
};

type Containment = {
  id: string;
  number: string;
  customerId: string;
  shipmentId: string;
  status: ContainmentStatus;
  size: string;
  parcels: string[];
  totalWeightKg: number;
  dateClosed?: string;
  shippingContainer?: string;
};

type ShippingContainer = {
  id: string;
  number: string;
  route: string;
  status: ShippingContainerStatus;
  containments: string[];
  eta: string;
};

type TimelineEvent = {
  id: string;
  shipmentId: string;
  title: string;
  detail: string;
  date: string;
};

type ParcelStatus =
  | "Tracking number submitted"
  | "In transit to warehouse"
  | "Arrived at warehouse"
  | "Received"
  | "Missing invoice"
  | "Missing payment proof"
  | "Ready for packing"
  | "Packed into containment"
  | "Loaded into shipping container"
  | "Shipped"
  | "In customs clearance"
  | "Cleared"
  | "Delivered";

type ShipmentStatus =
  | "Draft"
  | "Waiting for parcel tracking numbers"
  | "Parcels in transit to warehouse"
  | "Partially received"
  | "All expected parcels received"
  | "Open for more parcels"
  | "Ready for packing"
  | "Closed for packing"
  | "Packed in containment"
  | "Loaded into shipping container"
  | "Shipped"
  | "In customs clearance"
  | "Cleared"
  | "Delivered"
  | "Cancelled";

type ContainmentStatus =
  | "Open"
  | "Packing in progress"
  | "Full"
  | "Closed"
  | "Locked"
  | "Label printed"
  | "Assigned to shipping container"
  | "Loaded"
  | "Shipped"
  | "Arrived"
  | "Released"
  | "Delivered";

type ShippingContainerStatus =
  | "Created"
  | "Loading"
  | "Loaded"
  | "Departed"
  | "In transit"
  | "Arrived"
  | "In customs"
  | "Cleared"
  | "Unloaded"
  | "Closed";

const logo = "/chinalink24-app.png";

const customersSeed: Customer[] = [
  { id: "c1", name: "Aster Trading Co.", code: "ABC", country: "United Kingdom", contact: "Maya Chen", status: "Active" },
  { id: "c2", name: "Tech Harbor Supply", code: "TECH", country: "United States", contact: "Owen Patel", status: "Active" },
  { id: "c3", name: "Northline Retail Group", code: "NLR", country: "Canada", contact: "Sofia Martin", status: "Review" }
];

const shipmentsSeed: Shipment[] = [
  { id: "s1", reference: "SHP-2408-173", customerId: "c1", destinationCountry: "United Kingdom", expectedParcels: 6, status: "Partially received", createdAt: "2026-04-27" },
  { id: "s2", reference: "SHP-2408-188", customerId: "c2", destinationCountry: "United States", expectedParcels: 4, status: "Ready for packing", createdAt: "2026-04-28" },
  { id: "s3", reference: "SHP-2408-194", customerId: "c1", destinationCountry: "United Kingdom", expectedParcels: 3, status: "Open for more parcels", createdAt: "2026-04-30" }
];

const parcelsSeed: Parcel[] = [
  { id: "p1", trackingNumber: "SF-839274611-CN", shipmentId: "s1", customerId: "c1", status: "Received", weightKg: 8.4, dimensions: "42 x 31 x 22 cm", invoice: true, paymentProof: true, notes: "Outer carton photographed." },
  { id: "p2", trackingNumber: "YT-609244781-CN", shipmentId: "s1", customerId: "c1", status: "Missing payment proof", weightKg: 5.8, dimensions: "38 x 29 x 24 cm", invoice: true, paymentProof: false },
  { id: "p3", trackingNumber: "ZTO-102984553", shipmentId: "s1", customerId: "c1", status: "In transit to warehouse", invoice: false, paymentProof: false },
  { id: "p4", trackingNumber: "DPEX-73910582", shipmentId: "s2", customerId: "c2", status: "Ready for packing", weightKg: 11.2, dimensions: "51 x 36 x 28 cm", invoice: true, paymentProof: true },
  { id: "p5", trackingNumber: "JD-662918047", shipmentId: "s2", customerId: "c2", status: "Ready for packing", weightKg: 7.7, dimensions: "44 x 40 x 18 cm", invoice: true, paymentProof: true }
];

const containmentsSeed: Containment[] = [
  { id: "b1", number: "CL24-ABC-0001", customerId: "c1", shipmentId: "s1", status: "Packing in progress", size: "60 x 50 x 90 cm", parcels: ["p1"], totalWeightKg: 8.4 },
  { id: "b2", number: "CL24-TECH-0001", customerId: "c2", shipmentId: "s2", status: "Closed", size: "60 x 50 x 90 cm", parcels: ["p4", "p5"], totalWeightKg: 18.9, dateClosed: "2026-04-30" }
];

const containersSeed: ShippingContainer[] = [
  { id: "sc1", number: "MSKU-794231-4", route: "Shenzhen to Felixstowe", status: "Loading", containments: ["b2"], eta: "2026-05-21" },
  { id: "sc2", number: "OOLU-519874-1", route: "Ningbo to Los Angeles", status: "Created", containments: [], eta: "2026-05-26" }
];

const timelineSeed: TimelineEvent[] = [
  { id: "t1", shipmentId: "s1", title: "Tracking numbers submitted", detail: "Three courier references were added by the client.", date: "2026-04-27 09:20" },
  { id: "t2", shipmentId: "s1", title: "Warehouse received parcel", detail: "SF-839274611-CN was checked in with weight and dimensions.", date: "2026-04-29 14:05" },
  { id: "t3", shipmentId: "s1", title: "Containment opened", detail: "CL24-ABC-0001 was opened for Aster Trading Co.", date: "2026-04-30 10:30" },
  { id: "t4", shipmentId: "s2", title: "Containment closed", detail: "CL24-TECH-0001 was locked and ready for container loading.", date: "2026-04-30 13:15" }
];

const navigation: { label: Section; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff", "warehouse", "customs", "client"] },
  { label: "Customers", icon: Users, roles: ["admin", "staff"] },
  { label: "Shipments", icon: Truck, roles: ["admin", "staff", "warehouse", "customs", "client"] },
  { label: "Incoming Parcels", icon: PackageCheck, roles: ["admin", "staff", "warehouse", "client"] },
  { label: "Warehouse Receiving", icon: ClipboardCheck, roles: ["admin", "staff", "warehouse"] },
  { label: "Packing / Containments", icon: Boxes, roles: ["admin", "staff", "warehouse", "client"] },
  { label: "Shipping Containers", icon: Ship, roles: ["admin", "staff", "warehouse", "customs", "client"] },
  { label: "Customs Clearance", icon: ShieldCheck, roles: ["admin", "staff", "customs", "client"] },
  { label: "Documents", icon: FileText, roles: ["admin", "staff", "warehouse", "customs", "client"] },
  { label: "Payments", icon: CreditCard, roles: ["admin", "staff", "client"] },
  { label: "Reports", icon: BarChart3, roles: ["admin", "staff"] },
  { label: "Settings", icon: Settings, roles: ["admin"] }
];

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  staff: "Staff",
  warehouse: "Warehouse staff",
  customs: "Customs staff",
  client: "Client"
};

function App() {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [activeSection, setActiveSection] = useState<Section>("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customers] = useState(customersSeed);
  const [shipments, setShipments] = useState(shipmentsSeed);
  const [parcels, setParcels] = useState(parcelsSeed);
  const [containments, setContainments] = useState(containmentsSeed);
  const [containers, setContainers] = useState(containersSeed);
  const [timeline, setTimeline] = useState(timelineSeed);
  const currentCustomerId = role === "client" ? "c1" : undefined;

  const visibleShipments = useMemo(
    () => filterByRole(shipments, role, currentCustomerId),
    [shipments, role, currentCustomerId]
  );
  const visibleParcels = useMemo(() => filterByRole(parcels, role, currentCustomerId), [parcels, role, currentCustomerId]);
  const visibleContainments = useMemo(
    () => filterByRole(containments, role, currentCustomerId),
    [containments, role, currentCustomerId]
  );

  if (!isLoggedIn) {
    return <LoginScreen role={role} setRole={setRole} onLogin={() => setLoggedIn(true)} />;
  }

  const allowedNavigation = navigation.filter((item) => item.roles.includes(role));

  function openSection(section: Section) {
    setActiveSection(section);
    setMobileOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand-block">
          <img src={logo} alt="ChinaLink24 app" />
          <div>
            <strong>ChinaLink24</strong>
            <span>Logistics control</span>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {allowedNavigation.map(({ label, icon: Icon }) => (
            <button key={label} className={activeSection === label ? "active" : ""} onClick={() => openSection(label)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="app-header">
          <button className="icon-button mobile-only" onClick={() => setMobileOpen((open) => !open)} aria-label="Open menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="header-logo">
            <img src={logo} alt="ChinaLink24 app" />
          </div>
          <div className="header-title">
            <span>{roleLabels[role]}</span>
            <h1>{activeSection}</h1>
          </div>
          <div className="header-actions">
            <button className="search-pill">
              <Search size={17} />
              <span>Search tracking, box, container</span>
            </button>
            <button className="icon-button" onClick={() => setLoggedIn(false)} aria-label="Log out">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main>
          {activeSection === "Dashboard" && (
            <Dashboard
              customers={customers}
              shipments={visibleShipments}
              parcels={visibleParcels}
              containments={visibleContainments}
              containers={containers}
              timeline={timeline}
            />
          )}
          {activeSection === "Customers" && <Customers customers={customers} shipments={shipments} parcels={parcels} />}
          {activeSection === "Shipments" && (
            <Shipments
              role={role}
              customers={customers}
              shipments={visibleShipments}
              parcels={visibleParcels}
              onCreateShipment={(shipment, trackingNumbers) => {
                setShipments((items) => [shipment, ...items]);
                const addedParcels = trackingNumbers.map((trackingNumber, index) =>
                  createParcel(trackingNumber, shipment, index)
                );
                setParcels((items) => [...addedParcels, ...items]);
                setTimeline((items) => [
                  {
                    id: `t${items.length + 1}`,
                    shipmentId: shipment.id,
                    title: "Shipment request created",
                    detail: `${trackingNumbers.length} parcel tracking number${trackingNumbers.length === 1 ? "" : "s"} added.`,
                    date: nowStamp()
                  },
                  ...items
                ]);
              }}
              onAddParcel={(shipmentId, trackingNumber) => {
                const shipment = shipments.find((item) => item.id === shipmentId);
                if (!shipment) return;
                setParcels((items) => [createParcel(trackingNumber, shipment, items.length), ...items]);
                setShipments((items) =>
                  items.map((item) => (item.id === shipmentId ? { ...item, status: "Open for more parcels" } : item))
                );
              }}
            />
          )}
          {activeSection === "Incoming Parcels" && <IncomingParcels parcels={visibleParcels} shipments={shipments} customers={customers} />}
          {activeSection === "Warehouse Receiving" && (
            <WarehouseReceiving
              parcels={parcels}
              customers={customers}
              onReceive={(parcelId, weightKg, dimensions, notes) =>
                setParcels((items) =>
                  items.map((parcel) =>
                    parcel.id === parcelId
                      ? { ...parcel, status: "Received", weightKg, dimensions, notes }
                      : parcel
                  )
                )
              }
            />
          )}
          {activeSection === "Packing / Containments" && (
            <Containments
              customers={customers}
              shipments={shipments}
              parcels={visibleParcels}
              containments={visibleContainments}
              onCreate={(customerId, shipmentId) => {
                const customer = customers.find((item) => item.id === customerId)!;
                const nextNumber = containments.filter((item) => item.customerId === customerId).length + 1;
                const containment: Containment = {
                  id: `b${Date.now()}`,
                  number: `CL24-${customer.code}-${String(nextNumber).padStart(4, "0")}`,
                  customerId,
                  shipmentId,
                  status: "Open",
                  size: "60 x 50 x 90 cm",
                  parcels: [],
                  totalWeightKg: 0
                };
                setContainments((items) => [containment, ...items]);
              }}
              onPack={(containmentId, parcelId) => {
                const parcel = parcels.find((item) => item.id === parcelId);
                if (!parcel) return;
                setContainments((items) =>
                  items.map((box) =>
                    box.id === containmentId
                      ? {
                          ...box,
                          status: "Packing in progress",
                          parcels: box.parcels.includes(parcelId) ? box.parcels : [...box.parcels, parcelId],
                          totalWeightKg: Number((box.totalWeightKg + (parcel.weightKg ?? 0)).toFixed(1))
                        }
                      : box
                  )
                );
                setParcels((items) =>
                  items.map((item) => (item.id === parcelId ? { ...item, status: "Packed into containment" } : item))
                );
              }}
              onClose={(containmentId) =>
                setContainments((items) =>
                  items.map((box) =>
                    box.id === containmentId ? { ...box, status: "Locked", dateClosed: today() } : box
                  )
                )
              }
            />
          )}
          {activeSection === "Shipping Containers" && (
            <ShippingContainers
              containments={containments}
              containers={containers}
              onAssign={(containmentId, containerId) => {
                const container = containers.find((item) => item.id === containerId);
                if (!container) return;
                setContainments((items) =>
                  items.map((box) =>
                    box.id === containmentId
                      ? { ...box, status: "Assigned to shipping container", shippingContainer: container.number }
                      : box
                  )
                );
                setContainers((items) =>
                  items.map((item) =>
                    item.id === containerId && !item.containments.includes(containmentId)
                      ? { ...item, containments: [...item.containments, containmentId], status: "Loading" }
                      : item
                  )
                );
              }}
            />
          )}
          {activeSection === "Customs Clearance" && <CustomsClearance containers={containers} shipments={visibleShipments} />}
          {activeSection === "Documents" && <Documents parcels={visibleParcels} shipments={visibleShipments} />}
          {activeSection === "Payments" && <Payments parcels={visibleParcels} shipments={visibleShipments} />}
          {activeSection === "Reports" && <Reports shipments={shipments} parcels={parcels} containments={containments} />}
          {activeSection === "Settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

function LoginScreen({ role, setRole, onLogin }: { role: Role; setRole: (role: Role) => void; onLogin: () => void }) {
  return (
    <main className="login-screen">
      <section className="login-panel">
        <img src={logo} alt="ChinaLink24 app" className="login-logo" />
        <div>
          <p className="eyebrow">Secure logistics workspace</p>
          <h1>Parcel, containment, shipping container, and customs tracking.</h1>
          <p className="login-copy">
            Role-ready access for clients, warehouse teams, customs staff, and administrators.
          </p>
        </div>
        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            onLogin();
          }}
        >
          <label>
            Email
            <input type="email" placeholder="operations@chinalink24.com" defaultValue="operations@chinalink24.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Password" defaultValue="logistics" />
          </label>
          <label>
            Demo role
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit">
            <Lock size={18} />
            Sign in
          </button>
        </form>
      </section>
      <section className="login-status">
        <div className="route-card">
          <span>Live lane</span>
          <strong>Shenzhen warehouse to global delivery</strong>
          <div className="route-line">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="manifest-card">
          <span>Containment label</span>
          <strong>CL24-ABC-0001</strong>
          <small>60 x 50 x 90 cm</small>
          <QrCode size={54} />
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  customers,
  shipments,
  parcels,
  containments,
  containers,
  timeline
}: {
  customers: Customer[];
  shipments: Shipment[];
  parcels: Parcel[];
  containments: Containment[];
  containers: ShippingContainer[];
  timeline: TimelineEvent[];
}) {
  const received = parcels.filter((parcel) => ["Received", "Ready for packing", "Packed into containment"].includes(parcel.status)).length;
  return (
    <section className="page-grid">
      <div className="metric-grid">
        <Metric icon={Truck} label="Active shipments" value={shipments.length} detail="Requests, packing and customs" />
        <Metric icon={PackageCheck} label="Warehouse parcels" value={received} detail={`${parcels.length} total tracked parcels`} />
        <Metric icon={Boxes} label="Containments" value={containments.length} detail="Open, locked and assigned boxes" />
        <Metric icon={Ship} label="Shipping containers" value={containers.length} detail="Ocean freight movements" />
      </div>
      <div className="split-grid">
        <section className="panel large">
          <PanelTitle title="Operations board" action="Today" />
          <div className="kanban-row">
            {["In transit to warehouse", "Received", "Packed into containment", "In customs clearance"].map((status) => (
              <div className="kanban-column" key={status}>
                <strong>{status}</strong>
                {parcels
                  .filter((parcel) => parcel.status === status)
                  .slice(0, 4)
                  .map((parcel) => (
                    <article key={parcel.id} className="parcel-chip">
                      <span>{parcel.trackingNumber}</span>
                      <small>{customerName(customers, parcel.customerId)}</small>
                    </article>
                  ))}
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelTitle title="Tracking timeline" action="Latest" />
          <Timeline events={timeline.slice(0, 5)} />
        </section>
      </div>
    </section>
  );
}

function Customers({ customers, shipments, parcels }: { customers: Customer[]; shipments: Shipment[]; parcels: Parcel[] }) {
  return (
    <section className="panel">
      <PanelTitle title="Customer list" action={`${customers.length} customers`} />
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Code</th>
              <th>Destination</th>
              <th>Contact</th>
              <th>Shipments</th>
              <th>Parcels</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.code}</td>
                <td>{customer.country}</td>
                <td>{customer.contact}</td>
                <td>{shipments.filter((shipment) => shipment.customerId === customer.id).length}</td>
                <td>{parcels.filter((parcel) => parcel.customerId === customer.id).length}</td>
                <td>
                  <StatusBadge status={customer.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Shipments({
  role,
  customers,
  shipments,
  parcels,
  onCreateShipment,
  onAddParcel
}: {
  role: Role;
  customers: Customer[];
  shipments: Shipment[];
  parcels: Parcel[];
  onCreateShipment: (shipment: Shipment, trackingNumbers: string[]) => void;
  onAddParcel: (shipmentId: string, trackingNumber: string) => void;
}) {
  const [customerId, setCustomerId] = useState(role === "client" ? "c1" : customers[0].id);
  const [destination, setDestination] = useState(customers.find((customer) => customer.id === customerId)?.country ?? "");
  const [expectedParcels, setExpectedParcels] = useState(2);
  const [trackingNumbers, setTrackingNumbers] = useState("SF-NEW-204912\nYT-NEW-690112");
  const [addTarget, setAddTarget] = useState(shipments[0]?.id ?? "");
  const [singleTracking, setSingleTracking] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const tracking = trackingNumbers.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    const shipment: Shipment = {
      id: `s${Date.now()}`,
      reference: `SHP-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 700 + 200)}`,
      customerId,
      destinationCountry: destination,
      expectedParcels,
      status: tracking.length ? "Parcels in transit to warehouse" : "Waiting for parcel tracking numbers",
      createdAt: today()
    };
    onCreateShipment(shipment, tracking);
  }

  return (
    <section className="page-grid">
      <div className="split-grid">
        <form className="panel form-panel" onSubmit={submit}>
          <PanelTitle title="Create shipment request" action="Client workflow" />
          <label>
            Customer
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={role === "client"}>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.code})
                </option>
              ))}
            </select>
          </label>
          <label>
            Destination country
            <input value={destination} onChange={(event) => setDestination(event.target.value)} />
          </label>
          <label>
            Expected parcel count
            <input
              type="number"
              min={1}
              value={expectedParcels}
              onChange={(event) => setExpectedParcels(Number(event.target.value))}
            />
            <small>Estimate only. More parcels can be added before packing is closed.</small>
          </label>
          <label>
            Courier tracking numbers
            <textarea value={trackingNumbers} onChange={(event) => setTrackingNumbers(event.target.value)} rows={5} />
          </label>
          <div className="upload-row">
            <button type="button" className="ghost-button">
              <Upload size={17} />
              Invoice upload
            </button>
            <button type="button" className="ghost-button">
              <Upload size={17} />
              Payment proof
            </button>
          </div>
          <button className="primary-button" type="submit">
            <Plus size={18} />
            Create shipment
          </button>
        </form>
        <section className="panel">
          <PanelTitle title="Add more parcels" action="Before packing close" />
          <label>
            Shipment
            <select value={addTarget} onChange={(event) => setAddTarget(event.target.value)}>
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.reference}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tracking number
            <input value={singleTracking} onChange={(event) => setSingleTracking(event.target.value)} placeholder="Courier tracking number" />
          </label>
          <button
            className="secondary-button"
            onClick={() => {
              if (singleTracking.trim()) {
                onAddParcel(addTarget, singleTracking.trim());
                setSingleTracking("");
              }
            }}
          >
            <Plus size={18} />
            Add parcel
          </button>
        </section>
      </div>
      <ShipmentTable shipments={shipments} parcels={parcels} customers={customers} />
    </section>
  );
}

function IncomingParcels({ parcels, shipments, customers }: { parcels: Parcel[]; shipments: Shipment[]; customers: Customer[] }) {
  return (
    <section className="panel">
      <PanelTitle title="Incoming parcels" action="Courier tracking" />
      <div className="parcel-list">
        {parcels.map((parcel) => (
          <article className="parcel-card" key={parcel.id}>
            <div>
              <strong>{parcel.trackingNumber}</strong>
              <span>{customerName(customers, parcel.customerId)} | {shipmentReference(shipments, parcel.shipmentId)}</span>
            </div>
            <StatusBadge status={parcel.status} />
            <div className="document-flags">
              <span className={parcel.invoice ? "ok" : "warn"}>Invoice</span>
              <span className={parcel.paymentProof ? "ok" : "warn"}>Payment proof</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WarehouseReceiving({
  parcels,
  customers,
  onReceive
}: {
  parcels: Parcel[];
  customers: Customer[];
  onReceive: (parcelId: string, weightKg: number, dimensions: string, notes: string) => void;
}) {
  const [selected, setSelected] = useState(parcels[0]?.id ?? "");
  const [weight, setWeight] = useState("6.4");
  const [dimensions, setDimensions] = useState("40 x 30 x 25 cm");
  const [notes, setNotes] = useState("Checked by warehouse receiving.");
  const parcel = parcels.find((item) => item.id === selected);

  return (
    <section className="split-grid">
      <form className="panel form-panel" onSubmit={(event) => {
        event.preventDefault();
        onReceive(selected, Number(weight), dimensions, notes);
      }}>
        <PanelTitle title="Receive by tracking number" action="Scan or search" />
        <label>
          Parcel
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {parcels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.trackingNumber}
              </option>
            ))}
          </select>
        </label>
        {parcel && <p className="context-line">{customerName(customers, parcel.customerId)} | {parcel.status}</p>}
        <label>
          Actual weight
          <input value={weight} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label>
          Dimensions
          <input value={dimensions} onChange={(event) => setDimensions(event.target.value)} />
        </label>
        <label>
          Warehouse notes
          <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className="primary-button">
          <ClipboardCheck size={18} />
          Mark as received
        </button>
      </form>
      <section className="panel">
        <PanelTitle title="Receiving queue" action={`${parcels.length} parcels`} />
        <div className="stack">
          {parcels.map((item) => (
            <article className="queue-row" key={item.id}>
              <PackageCheck size={19} />
              <div>
                <strong>{item.trackingNumber}</strong>
                <span>{item.weightKg ? `${item.weightKg} kg | ${item.dimensions}` : "Awaiting warehouse check-in"}</span>
              </div>
              <StatusBadge status={item.status} />
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function Containments({
  customers,
  shipments,
  parcels,
  containments,
  onCreate,
  onPack,
  onClose
}: {
  customers: Customer[];
  shipments: Shipment[];
  parcels: Parcel[];
  containments: Containment[];
  onCreate: (customerId: string, shipmentId: string) => void;
  onPack: (containmentId: string, parcelId: string) => void;
  onClose: (containmentId: string) => void;
}) {
  const [customerId, setCustomerId] = useState(customers[0].id);
  const selectedShipments = shipments.filter((shipment) => shipment.customerId === customerId);
  const [shipmentId, setShipmentId] = useState(selectedShipments[0]?.id ?? shipments[0]?.id ?? "");
  const [selectedBox, setSelectedBox] = useState(containments[0]?.id ?? "");
  const [selectedParcel, setSelectedParcel] = useState(parcels.find((parcel) => parcel.status === "Received")?.id ?? parcels[0]?.id ?? "");
  const labelBox = containments.find((box) => box.id === selectedBox) ?? containments[0];

  return (
    <section className="page-grid">
      <div className="split-grid">
        <section className="panel form-panel">
          <PanelTitle title="Containment workflow" action="60 x 50 x 90 cm default" />
          <label>
            Customer
            <select value={customerId} onChange={(event) => {
              const value = event.target.value;
              setCustomerId(value);
              setShipmentId(shipments.find((shipment) => shipment.customerId === value)?.id ?? "");
            }}>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Shipment
            <select value={shipmentId} onChange={(event) => setShipmentId(event.target.value)}>
              {shipments.filter((shipment) => shipment.customerId === customerId).map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.reference}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" onClick={() => onCreate(customerId, shipmentId)}>
            <Archive size={18} />
            Open containment box
          </button>
          <label>
            Open containment
            <select value={selectedBox} onChange={(event) => setSelectedBox(event.target.value)}>
              {containments.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.number} | {box.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Received parcel
            <select value={selectedParcel} onChange={(event) => setSelectedParcel(event.target.value)}>
              {parcels.map((parcel) => (
                <option key={parcel.id} value={parcel.id}>
                  {parcel.trackingNumber} | {parcel.status}
                </option>
              ))}
            </select>
          </label>
          <div className="button-row">
            <button className="secondary-button" onClick={() => onPack(selectedBox, selectedParcel)}>
              <Plus size={18} />
              Pack parcel
            </button>
            <button className="danger-button" onClick={() => onClose(selectedBox)}>
              <Lock size={18} />
              Close and lock
            </button>
          </div>
        </section>
        <section className="label-preview">
          {labelBox && <ContainmentLabel box={labelBox} customers={customers} shipments={shipments} />}
        </section>
      </div>
      <section className="panel">
        <PanelTitle title="Containment boxes" action={`${containments.length} total`} />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Client</th>
                <th>Status</th>
                <th>Parcels</th>
                <th>Total weight</th>
                <th>Container</th>
              </tr>
            </thead>
            <tbody>
              {containments.map((box) => (
                <tr key={box.id}>
                  <td>{box.number}</td>
                  <td>{customerName(customers, box.customerId)}</td>
                  <td><StatusBadge status={box.status} /></td>
                  <td>{box.parcels.length}</td>
                  <td>{box.totalWeightKg} kg</td>
                  <td>{box.shippingContainer ?? "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function ContainmentLabel({ box, customers, shipments }: { box: Containment; customers: Customer[]; shipments: Shipment[] }) {
  const customer = customers.find((item) => item.id === box.customerId);
  const shipment = shipments.find((item) => item.id === box.shipmentId);
  return (
    <article className="printed-label">
      <div className="label-header">
        <img src={logo} alt="ChinaLink24 app" />
        <button className="icon-button" aria-label="Print label">
          <Printer size={19} />
        </button>
      </div>
      <h2>{box.number}</h2>
      <div className="label-grid">
        <span>Client</span><strong>{customer?.name}</strong>
        <span>Client code</span><strong>{customer?.code}</strong>
        <span>Box size</span><strong>60 x 50 x 90 cm</strong>
        <span>Parcel count</span><strong>{box.parcels.length}</strong>
        <span>Total weight</span><strong>{box.totalWeightKg} kg</strong>
        <span>Date closed</span><strong>{box.dateClosed ?? "Open"}</strong>
        <span>Destination</span><strong>{shipment?.destinationCountry}</strong>
        <span>Container</span><strong>{box.shippingContainer ?? "Pending"}</strong>
      </div>
      <div className="qr-block">
        <QrCode size={92} />
        <div className="barcode" aria-hidden="true">
          {Array.from({ length: 32 }).map((_, index) => <i key={index} />)}
        </div>
      </div>
    </article>
  );
}

function ShippingContainers({
  containments,
  containers,
  onAssign
}: {
  containments: Containment[];
  containers: ShippingContainer[];
  onAssign: (containmentId: string, containerId: string) => void;
}) {
  const [containmentId, setContainmentId] = useState(containments[0]?.id ?? "");
  const [containerId, setContainerId] = useState(containers[0]?.id ?? "");
  return (
    <section className="split-grid">
      <section className="panel form-panel">
        <PanelTitle title="Assign closed containment" action="Final container" />
        <label>
          Containment
          <select value={containmentId} onChange={(event) => setContainmentId(event.target.value)}>
            {containments.map((box) => (
              <option key={box.id} value={box.id}>
                {box.number} | {box.status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Shipping container
          <select value={containerId} onChange={(event) => setContainerId(event.target.value)}>
            {containers.map((container) => (
              <option key={container.id} value={container.id}>
                {container.number} | {container.route}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" onClick={() => onAssign(containmentId, containerId)}>
          <Ship size={18} />
          Assign to container
        </button>
      </section>
      <section className="panel">
        <PanelTitle title="Shipping containers" action="Ocean freight" />
        <div className="stack">
          {containers.map((container) => (
            <article className="container-row" key={container.id}>
              <Ship size={26} />
              <div>
                <strong>{container.number}</strong>
                <span>{container.route} | ETA {container.eta}</span>
              </div>
              <StatusBadge status={container.status} />
              <small>{container.containments.length} containments</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function CustomsClearance({ containers, shipments }: { containers: ShippingContainer[]; shipments: Shipment[] }) {
  return (
    <section className="split-grid">
      <section className="panel">
        <PanelTitle title="Customs queue" action="Clearance status" />
        <div className="stack">
          {shipments.map((shipment) => (
            <article className="queue-row" key={shipment.id}>
              <Globe2 size={20} />
              <div>
                <strong>{shipment.reference}</strong>
                <span>{shipment.destinationCountry}</span>
              </div>
              <StatusBadge status={shipment.status.includes("customs") ? shipment.status : "In customs clearance"} />
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <PanelTitle title="Container documents" action="Broker handoff" />
        {containers.map((container) => (
          <article className="doc-row" key={container.id}>
            <FileText size={20} />
            <span>{container.number} manifest and customs pack</span>
            <StatusBadge status={container.status} />
          </article>
        ))}
      </section>
    </section>
  );
}

function Documents({ parcels, shipments }: { parcels: Parcel[]; shipments: Shipment[] }) {
  return (
    <section className="panel">
      <PanelTitle title="Documents" action="Invoices and proof files" />
      <div className="document-grid">
        {parcels.map((parcel) => (
          <article className="document-card" key={parcel.id}>
            <FileText size={26} />
            <strong>{parcel.trackingNumber}</strong>
            <span>{shipmentReference(shipments, parcel.shipmentId)}</span>
            <div className="document-flags">
              <span className={parcel.invoice ? "ok" : "warn"}>Invoice {parcel.invoice ? "uploaded" : "missing"}</span>
              <span className={parcel.paymentProof ? "ok" : "warn"}>Payment {parcel.paymentProof ? "uploaded" : "missing"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Payments({ parcels, shipments }: { parcels: Parcel[]; shipments: Shipment[] }) {
  return (
    <section className="panel">
      <PanelTitle title="Payments" action="Proof tracking" />
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Shipment</th>
              <th>Parcel</th>
              <th>Proof</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel) => (
              <tr key={parcel.id}>
                <td>{shipmentReference(shipments, parcel.shipmentId)}</td>
                <td>{parcel.trackingNumber}</td>
                <td>{parcel.paymentProof ? "Uploaded" : "Missing"}</td>
                <td><StatusBadge status={parcel.paymentProof ? "Ready for packing" : "Missing payment proof"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Reports({ shipments, parcels, containments }: { shipments: Shipment[]; parcels: Parcel[]; containments: Containment[] }) {
  return (
    <section className="page-grid">
      <div className="metric-grid">
        <Metric icon={AlertTriangle} label="Document exceptions" value={parcels.filter((parcel) => !parcel.invoice || !parcel.paymentProof).length} detail="Missing invoice or payment proof" />
        <Metric icon={Boxes} label="Locked containments" value={containments.filter((box) => box.status === "Locked").length} detail="Ready for container assignment" />
        <Metric icon={Truck} label="Open for more parcels" value={shipments.filter((shipment) => shipment.status === "Open for more parcels").length} detail="Client can still add tracking" />
        <Metric icon={BarChart3} label="Average parcel weight" value={`${averageWeight(parcels)} kg`} detail="From received parcels" />
      </div>
      <section className="panel">
        <PanelTitle title="Basic reports" action="Operational snapshot" />
        <div className="report-bars">
          {["Received", "Ready for packing", "Packed into containment", "In transit to warehouse"].map((status) => (
            <div key={status}>
              <span>{status}</span>
              <meter min={0} max={parcels.length || 1} value={parcels.filter((parcel) => parcel.status === status).length} />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function SettingsPanel() {
  return (
    <section className="panel settings-panel">
      <PanelTitle title="Settings" action="Authentication ready" />
      <div className="settings-grid">
        <article>
          <ShieldCheck size={28} />
          <strong>Role-based access control</strong>
          <span>Admin, staff, warehouse, customs, and client roles are separated in the navigation and API structure.</span>
        </article>
        <article>
          <Globe2 size={28} />
          <strong>Custom domain</strong>
          <span>Deploy this project separately and connect app.chinalink24.com in Netlify domain settings.</span>
        </article>
        <article>
          <Lock size={28} />
          <strong>Server-side database access</strong>
          <span>Netlify Functions are prepared for secure PostgreSQL access through Netlify Database.</span>
        </article>
      </div>
    </section>
  );
}

function ShipmentTable({ shipments, parcels, customers }: { shipments: Shipment[]; parcels: Parcel[]; customers: Customer[] }) {
  return (
    <section className="panel">
      <PanelTitle title="Shipment register" action={`${shipments.length} shipments`} />
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Client</th>
              <th>Expected</th>
              <th>Tracked</th>
              <th>Destination</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment.id}>
                <td>{shipment.reference}</td>
                <td>{customerName(customers, shipment.customerId)}</td>
                <td>{shipment.expectedParcels}</td>
                <td>{parcels.filter((parcel) => parcel.shipmentId === shipment.id).length}</td>
                <td>{shipment.destinationCountry}</td>
                <td><StatusBadge status={shipment.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Truck; label: string; value: string | number; detail: string }) {
  return (
    <article className="metric-card">
      <Icon size={24} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function PanelTitle({ title, action }: { title: string; action: string }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <span>{action}</span>
    </div>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="timeline">
      {events.map((event) => (
        <article key={event.id}>
          <i />
          <div>
            <strong>{event.title}</strong>
            <span>{event.detail}</span>
            <small>{event.date}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const kind = status.includes("Missing") || status === "Review" ? "warning" : status.includes("Locked") || status.includes("Closed") || status.includes("Delivered") || status.includes("Cleared") ? "success" : status.includes("customs") || status.includes("transit") || status.includes("Loading") ? "accent" : "neutral";
  return <span className={`status-badge ${kind}`}>{status}</span>;
}

function filterByRole<T extends { customerId: string }>(items: T[], role: Role, customerId?: string) {
  return role === "client" && customerId ? items.filter((item) => item.customerId === customerId) : items;
}

function customerName(customers: Customer[], customerId: string) {
  return customers.find((customer) => customer.id === customerId)?.name ?? "Unknown customer";
}

function shipmentReference(shipments: Shipment[], shipmentId: string) {
  return shipments.find((shipment) => shipment.id === shipmentId)?.reference ?? "Unknown shipment";
}

function createParcel(trackingNumber: string, shipment: Shipment, index: number): Parcel {
  return {
    id: `p${Date.now()}${index}`,
    trackingNumber,
    shipmentId: shipment.id,
    customerId: shipment.customerId,
    status: "Tracking number submitted",
    invoice: false,
    paymentProof: false
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
}

function averageWeight(parcels: Parcel[]) {
  const weights = parcels.map((parcel) => parcel.weightKg).filter((weight): weight is number => typeof weight === "number");
  if (!weights.length) return "0.0";
  return (weights.reduce((sum, weight) => sum + weight, 0) / weights.length).toFixed(1);
}

export default App;
