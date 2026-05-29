import { describe, it, expect } from "vitest";
import { checkRoleAccess } from "../middleware";

describe("checkRoleAccess", () => {
  // Instructor routes
  it("allows instructors to access /instructor routes", () => {
    expect(checkRoleAccess("/instructor/dashboard", "instructor")).toBeNull();
    expect(checkRoleAccess("/instructor/students", "instructor")).toBeNull();
    expect(checkRoleAccess("/instructor/settings", "instructor")).toBeNull();
  });

  it("redirects students away from /instructor routes", () => {
    expect(checkRoleAccess("/instructor/dashboard", "student")).toBe(
      "/student/dashboard"
    );
  });

  it("redirects unauthenticated users from /instructor routes to login", () => {
    expect(checkRoleAccess("/instructor/dashboard", undefined)).toBe("/login");
  });

  // Student routes
  it("allows students to access /student routes", () => {
    expect(checkRoleAccess("/student/dashboard", "student")).toBeNull();
    expect(checkRoleAccess("/student/progress", "student")).toBeNull();
  });

  it("redirects instructors away from /student routes", () => {
    expect(checkRoleAccess("/student/dashboard", "instructor")).toBe(
      "/instructor/dashboard"
    );
  });

  it("redirects unauthenticated users from /student routes to login", () => {
    expect(checkRoleAccess("/student/dashboard", undefined)).toBe("/login");
  });

  // Admin routes
  it("allows admins to access /admin routes", () => {
    expect(checkRoleAccess("/admin/users", "admin")).toBeNull();
  });

  it("redirects non-admins from /admin routes to login", () => {
    expect(checkRoleAccess("/admin/users", "instructor")).toBe("/login");
    expect(checkRoleAccess("/admin/users", "student")).toBe("/login");
    expect(checkRoleAccess("/admin/users", undefined)).toBe("/login");
  });

  // Non-gated routes
  it("allows any role to access non-gated routes", () => {
    expect(checkRoleAccess("/settings", "instructor")).toBeNull();
    expect(checkRoleAccess("/settings", "student")).toBeNull();
    expect(checkRoleAccess("/profile", undefined)).toBeNull();
  });
});
