import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from ".";
import { db } from "../../db";
import { properties } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { publicUser } from "../../security";
import { emailQuerySchema, emptyBodySchema, validateRequest } from "../../input-validation";

const onboardingRoleSchema = z.object({
  role: z.enum(["TENANT", "OWNER"]),
}).strict();

const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
}).strict().refine((value) => value.firstName !== undefined || value.lastName !== undefined, {
  message: "At least one profile field is required",
});

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
  app.post("/api/auth/set-role", isAuthenticated, validateRequest({ body: onboardingRoleSchema }), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body as z.infer<typeof onboardingRoleSchema>;

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
  app.patch("/api/auth/profile", isAuthenticated, validateRequest({ body: profileUpdateSchema }), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body as z.infer<typeof profileUpdateSchema>;
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
  app.get("/api/auth/user-by-email", isAuthenticated, validateRequest({ query: emailQuerySchema }), async (req: any, res) => {
    try {
      const callerId = req.user?.claims?.sub;
      const caller = await authStorage.getUser(callerId);
      if (!caller || (caller.role !== "OWNER" && caller.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { email } = res.locals.validatedQuery as z.infer<typeof emailQuerySchema>;

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

  // Delete own account (OWNER or TENANT only)
  app.delete("/api/auth/account", isAuthenticated, validateRequest({ body: emptyBodySchema }), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Only allow owners or tenants to delete their own account
      if (user.role !== "OWNER" && user.role !== "TENANT") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await authStorage.deleteUser(userId);
      req.logout(() => {
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
}
