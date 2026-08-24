import { readFile } from "node:fs/promises";
import { createMaintenanceTicketRequestSchema, createPropertyRequestSchema } from "@shared/schema";

const property = {
  address: "42 Secure Avenue",
  monthlyRent: 25000,
  payoutDay: 5,
  tenantEmail: "tenant@example.com",
};
const ticket = {
  propertyId: "property-1",
  title: "Leaking tap",
  description: "The kitchen tap leaks when closed.",
};

const assertions: Array<[boolean, string]> = [
  [createPropertyRequestSchema.safeParse(property).success, "Property creation accepts its explicit business fields."],
  [!createPropertyRequestSchema.safeParse({ ...property, ownerId: "attacker", tenantId: "victim", role: "ADMIN", isAdmin: true }).success, "Property creation rejects client ownership and privilege fields."],
  [createMaintenanceTicketRequestSchema.safeParse(ticket).success, "Maintenance creation accepts its explicit tenant-facing fields."],
  [!createMaintenanceTicketRequestSchema.safeParse({ ...ticket, tenantId: "victim", status: "RESOLVED", resolvedBy: "attacker" }).success, "Maintenance creation rejects tenant identity and resolution fields."],
];

const routes = await readFile("/home/ubuntu/RentFLO123/server/routes.ts", "utf8");
const authRoutes = await readFile("/home/ubuntu/RentFLO123/server/replit_integrations/auth/routes.ts", "utf8");
assertions.push(
  [!routes.includes("...req.body"), "No server route spreads a raw request body into persistence."],
  [routes.includes("ownerId: userId") && routes.includes("tenantCandidate?.role === \"TENANT\""), "Property ownership and tenant assignment are derived on the server."],
  [routes.includes("tenantId: userId") && routes.includes("isVerified: false"), "Ticket identity and KYC verification state are server-controlled."],
  [authRoutes.includes("['TENANT', 'OWNER'].includes(role)") && authRoutes.includes("firstName") && authRoutes.includes("lastName"), "Role and profile routes expose only their explicit permitted fields."],
);

const failed = assertions.filter(([passed]) => !passed).map(([, message]) => message);
if (failed.length) throw new Error(`Mass-assignment verification failed: ${failed.join("; ")}`);
console.log(`Verified ${assertions.length} mass-assignment protections and explicit server allowlists.`);
