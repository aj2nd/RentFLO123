import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { db } from "../../db";
import { properties } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";
import { publicUser } from "../../security";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(publicUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Set user role (during onboarding) with Tenant Auto-Match
  app.post("/api/auth/set-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!role || !['TENANT', 'OWNER'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be TENANT or OWNER." });
      }

      const dbUser = await authStorage.updateUserRole(userId, role);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const user = dbUser;

      // Tenant Auto-Match: If user is a tenant with an email, find any property
      // that has been pre-configured with their email and auto-bind them
      if (role === 'TENANT' && user.email) {
        const matchingProperties = await db.select().from(properties)
          .where(eq(properties.pendingTenantEmail, user.email.toLowerCase()));
        
        // Auto-bind tenant to all matching properties
        for (const property of matchingProperties) {
          await db.update(properties)
            .set({ 
              tenantId: userId, 
              pendingTenantEmail: null // Clear the pending email after match
            })
            .where(eq(properties.id, property.id));
        }
      }

      res.json(publicUser(user));
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ message: "Failed to set role" });
    }
  });

  // Update profile (name only — email managed by auth provider)
  app.patch("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim().slice(0, 100) : undefined;
      const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim().slice(0, 100) : undefined;
      const updated = await authStorage.updateUser(userId, {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
      });
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(publicUser(updated));
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Look up user by email (for property tenant assignment).
  // Only OWNER/ADMIN can perform lookups (used when adding a tenant to a property).
  // Email-format validated and length-bounded; rate-limited at the app layer.
  app.get("/api/auth/user-by-email", isAuthenticated, async (req: any, res) => {
    try {
      const callerId = req.user?.claims?.sub;
      const caller = await authStorage.getUser(callerId);
      if (!caller || (caller.role !== "OWNER" && caller.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { email } = req.query;
      if (!email || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Minimal projection — never return KYC PII.
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Error looking up user:", error);
      res.status(500).json({ message: "Failed to look up user" });
    }
  });
}
