/**
 * @file User Types and Interfaces
 * This file defines TypeScript types and interfaces for user-related data structures
 * within the frontend application. These types ensure type safety and consistency
 * when handling user data across the application.
 */

import { success, message, data } from '../types/api';

/**
 * Enum representing possible user roles in the system.
 * Implements REQ-SEC-1: Role-Based Access Control
 */
export enum UserRole {
  /** Full system access with user management and configuration capabilities */
  ADMIN = 'ADMIN',
  /** Access to process applications and view documents */
  PROCESSOR = 'PROCESSOR',
  /** Read-only access to view applications and download reports */
  VIEWER = 'VIEWER'
}

/**
 * Interface defining the permissions associated with each user role.
 * Implements REQ-SEC-2: Role-Based Permissions
 */
export interface UserPermissions {
  /** Permission to create, update, and delete user accounts */
  canManageUsers: boolean;
  /** Permission to modify system configuration settings */
  canConfigureSystem: boolean;
  /** Permission to access and view system audit logs */
  canViewAuditLogs: boolean;
  /** Permission to process and update application statuses */
  canProcessApplications: boolean;
  /** Permission to view document contents */
  canViewDocuments: boolean;
  /** Permission to generate and download system reports */
  canDownloadReports: boolean;
}

/**
 * Represents the structure of a user object within the application.
 * Implements REQ-SEC-3: User Data Structure
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's login username */
  username: string;
  /** User's email address */
  email: string;
  /** User's assigned role determining their permissions */
  role: UserRole;
  /** Timestamp when the user account was created */
  createdAt: Date;
  /** Timestamp of the user's last successful login */
  lastLoginAt: Date;
  /** Flag indicating if the user account is currently active */
  isActive: boolean;
}

/**
 * Default permission sets for each user role.
 * Implements REQ-SEC-4: Default Role Permissions
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  [UserRole.ADMIN]: {
    canManageUsers: true,
    canConfigureSystem: true,
    canViewAuditLogs: true,
    canProcessApplications: true,
    canViewDocuments: true,
    canDownloadReports: true
  },
  [UserRole.PROCESSOR]: {
    canManageUsers: false,
    canConfigureSystem: false,
    canViewAuditLogs: false,
    canProcessApplications: true,
    canViewDocuments: true,
    canDownloadReports: true
  },
  [UserRole.VIEWER]: {
    canManageUsers: false,
    canConfigureSystem: false,
    canViewAuditLogs: false,
    canProcessApplications: false,
    canViewDocuments: true,
    canDownloadReports: true
  }
};

/**
 * Type guard to check if a string is a valid UserRole
 * @param role - The role string to check
 * @returns boolean indicating if the role is valid
 */
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

/**
 * Helper function to get permissions for a given role
 * @param role - The user role to get permissions for
 * @returns The permissions associated with the role
 */
export const getRolePermissions = (role: UserRole): UserPermissions => {
  return DEFAULT_ROLE_PERMISSIONS[role];
};

/**
 * Type for user-related API responses
 * Implements REQ-API-7: User API Response Types
 */
export type UserApiResponse = {
  success: boolean;
  message: string;
  data: User;
};

/**
 * Type for user list API responses
 * Implements REQ-API-8: User List Response Type
 */
export type UserListApiResponse = {
  success: boolean;
  message: string;
  data: User[];
};