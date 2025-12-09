// Archer ITSM - Authentication Types
// Frontend type definitions matching backend auth models

/**
 * User status enum matching backend UserStatus
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/**
 * Role information
 */
export interface RoleInfo {
  id: string;
  name: string;
  display_name: string;
}

/**
 * User profile information (safe to expose, no password hash)
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  status: UserStatus;
  roles: RoleInfo[];
  permissions: string[];
  last_login: string | null;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response containing JWT tokens
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/**
 * Update user profile request
 */
export interface UpdateUserRequest {
  display_name?: string;
  email?: string;
}

/**
 * Auth context state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Auth context actions
 */
export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (updates: UpdateUserRequest) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

/**
 * Token storage keys
 */
export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'archer_access_token',
  REFRESH_TOKEN: 'archer_refresh_token',
  USER_PROFILE: 'archer_user_profile',
} as const;

/**
 * Token expiry buffer (refresh 1 minute before expiry)
 */
export const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;
