import { getDatabase } from "@netlify/database";

type Role = "admin" | "staff" | "warehouse" | "customs" | "client";

const privilegedRoles: Role[] = ["admin", "staff", "warehouse", "customs"];

type Identity = {
  role: Role;
  customerId?: string;
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function identityFromRequest(req: Request): Identity {
  const roleHeader = req.headers.get("x-cl24-role") as Role | null;
  const role: Role = roleHeader && ["admin", "staff", "warehouse", "customs", "client"].includes(roleHeader)
    ? roleHeader
    : "client";

  return {
    role,
    customerId: req.headers.get("x-cl24-customer-id") ?? undefined
  };
}

function canSeeCustomer(identity: Identity, customerId?: string) {
  if (privilegedRoles.includes(identity.role)) return true;
  return Boolean(identity.customerId && customerId && identity.customerId === customerId);
}

function requireStaff(identity: Identity) {
  if (!["admin", "staff", "warehouse"].includes(identity.role)) {
    throw new Response("Forbidden", { status: 403 });
  }
}

function isSchemaNotReady(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("does not exist") || message.includes("DATABASE_URL") || message.includes("connection") || message.includes("Failed query");
}

async function readBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const identity = identityFromRequest(req);
  const db = getDatabase();

  try {
    if (url.pathname === "/api/customers" && req.method === "GET") {
      if (!privilegedRoles.includes(identity.role)) {
        return json({ customers: [] });
      }
      const customers = await db.sql`SELECT * FROM customers ORDER BY created_at DESC`;
      return json({ customers });
    }

    if (url.pathname === "/api/shipments" && req.method === "GET") {
      const customerId = url.searchParams.get("customerId") ?? identity.customerId;
      if (!canSeeCustomer(identity, customerId ?? undefined)) {
        return new Response("Forbidden", { status: 403 });
      }

      const shipments = customerId
        ? await db.sql`SELECT * FROM shipments WHERE customer_id = ${customerId} ORDER BY created_at DESC`
        : await db.sql`SELECT * FROM shipments ORDER BY created_at DESC`;
      return json({ shipments });
    }

    if (url.pathname === "/api/shipments" && req.method === "POST") {
      const body = await readBody<{
        customerId: string;
        destinationCountry: string;
        expectedParcelCount: number;
        trackingNumbers?: string[];
      }>(req);

      if (!canSeeCustomer(identity, body.customerId)) {
        return new Response("Forbidden", { status: 403 });
      }

      const reference = `SHP-${Date.now().toString(36).toUpperCase()}`;
      const [shipment] = await db.sql`
        INSERT INTO shipments (reference, customer_id, destination_country, expected_parcel_count, status)
        VALUES (${reference}, ${body.customerId}, ${body.destinationCountry}, ${body.expectedParcelCount}, ${body.trackingNumbers?.length ? "Parcels in transit to warehouse" : "Waiting for parcel tracking numbers"})
        RETURNING *
      `;

      if (body.trackingNumbers?.length) {
        for (const trackingNumber of body.trackingNumbers) {
          await db.sql`
            INSERT INTO parcels (shipment_id, customer_id, courier_tracking_number, status)
            VALUES (${shipment.id}, ${body.customerId}, ${trackingNumber}, ${"Tracking number submitted"})
          `;
        }
      }

      return json({ shipment }, 201);
    }

    if (url.pathname === "/api/parcels" && req.method === "POST") {
      const body = await readBody<{ shipmentId: string; customerId: string; trackingNumber: string }>(req);
      if (!canSeeCustomer(identity, body.customerId)) {
        return new Response("Forbidden", { status: 403 });
      }

      const [parcel] = await db.sql`
        INSERT INTO parcels (shipment_id, customer_id, courier_tracking_number, status)
        VALUES (${body.shipmentId}, ${body.customerId}, ${body.trackingNumber}, ${"Tracking number submitted"})
        RETURNING *
      `;
      return json({ parcel }, 201);
    }

    if (url.pathname === "/api/parcels/receive" && req.method === "PATCH") {
      requireStaff(identity);
      const body = await readBody<{
        parcelId: string;
        actualWeightKg: number;
        widthCm?: number;
        heightCm?: number;
        lengthCm?: number;
        warehouseNotes?: string;
      }>(req);

      const [parcel] = await db.sql`
        UPDATE parcels
        SET status = ${"Received"},
            actual_weight_kg = ${body.actualWeightKg},
            width_cm = ${body.widthCm ?? null},
            height_cm = ${body.heightCm ?? null},
            length_cm = ${body.lengthCm ?? null},
            warehouse_notes = ${body.warehouseNotes ?? null},
            received_at = now(),
            updated_at = now()
        WHERE id = ${body.parcelId}
        RETURNING *
      `;
      return json({ parcel });
    }

    if (url.pathname === "/api/containments" && req.method === "POST") {
      requireStaff(identity);
      const body = await readBody<{ customerId: string; shipmentId: string; clientCode: string }>(req);
      const [{ next_number }] = await db.sql`
        SELECT COUNT(*)::int + 1 AS next_number FROM containments WHERE customer_id = ${body.customerId}
      `;
      const containmentNumber = `CL24-${body.clientCode}-${String(next_number).padStart(4, "0")}`;

      const [containment] = await db.sql`
        INSERT INTO containments (customer_id, shipment_id, containment_number, status)
        VALUES (${body.customerId}, ${body.shipmentId}, ${containmentNumber}, ${"Open"})
        RETURNING *
      `;
      return json({ containment }, 201);
    }

    if (url.pathname === "/api/containments/close" && req.method === "PATCH") {
      requireStaff(identity);
      const body = await readBody<{ containmentId: string }>(req);
      const [containment] = await db.sql`
        UPDATE containments
        SET status = ${"Locked"}, closed_at = now(), locked_at = now(), updated_at = now()
        WHERE id = ${body.containmentId}
        RETURNING *
      `;
      return json({ containment });
    }

    if (url.pathname === "/api/container-assignments" && req.method === "POST") {
      requireStaff(identity);
      const body = await readBody<{ containmentId: string; shippingContainerId: string }>(req);
      const [assignment] = await db.sql`
        INSERT INTO container_assignments (containment_id, shipping_container_id)
        VALUES (${body.containmentId}, ${body.shippingContainerId})
        RETURNING *
      `;
      await db.sql`
        UPDATE containments
        SET status = ${"Assigned to shipping container"}, updated_at = now()
        WHERE id = ${body.containmentId}
      `;
      return json({ assignment }, 201);
    }

    if (url.pathname === "/api/tracking" && req.method === "GET") {
      const shipmentId = url.searchParams.get("shipmentId");
      if (!shipmentId) return new Response("shipmentId is required", { status: 400 });

      const events = await db.sql`
        SELECT tracking_events.*
        FROM tracking_events
        INNER JOIN shipments ON shipments.id = tracking_events.shipment_id
        WHERE tracking_events.shipment_id = ${shipmentId}
          AND (${privilegedRoles.includes(identity.role)} OR shipments.customer_id = ${identity.customerId ?? null})
        ORDER BY tracking_events.occurred_at DESC
      `;
      return json({ events });
    }

    return new Response("Not found", { status: 404 });
  } catch (error) {
    if (error instanceof Response) return error;
    if (isSchemaNotReady(error)) {
      return json({ error: "Database schema is not ready" }, 503);
    }
    console.error(error instanceof Error ? error.message : "Unknown API error");
    return json({ error: "Server error" }, 500);
  }
};

export const config = {
  path: "/api/*"
};
