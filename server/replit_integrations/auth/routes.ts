import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Set user role (during onboarding)
  app.post("/api/auth/set-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      if (!role || !['TENANT', 'OWNER'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be TENANT or OWNER." });
      }

      const user = await authStorage.updateUserRole(userId, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ message: "Failed to set role" });
    }
  });

  // Look up user by email (for property tenant assignment)
  app.get("/api/auth/user-by-email", isAuthenticated, async (req: any, res) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Error looking up user:", error);
      res.status(500).json({ message: "Failed to look up user" });
    }
  });
}
