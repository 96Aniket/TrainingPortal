import apiClient from "./apiClient";

// ============================================================
// ROLE
// ============================================================

export interface Role {
  n_role_id: number;
  s_role_name: string;
  s_description: string | null;
  n_flag: number;
  delete_flag: number;
}

// ============================================================
// USER ROLE
// ============================================================

export interface UserRoleInfo {
  n_role_id: number;
  s_role_name: string;
}

// ============================================================
// USER WITH ROLES
// ============================================================

export interface UserWithRoles {
  n_user_id: number;
  s_employee_id: string | null;
  s_user_name: string | null;
  s_email: string | null;
  roles: UserRoleInfo[];
}

// ============================================================
// RESPONSES
// ============================================================

export interface RolesResponse {
  status: string;
  count: number;
  roles: Role[];
}

export interface UsersWithRolesResponse {
  status: string;
  count: number;
  users: UserWithRoles[];
}

export interface CoordinatorsResponse {
  status: string;
  count: number;
  coordinators: UserWithRoles[];
}

export interface RoleActionResponse {
  status: string;
  message: string;
  n_user_role_id?: number;
}

// ============================================================
// GET ALL ROLES
// ============================================================

export const getRoles = async (): Promise<Role[]> => {
  const response =
    await apiClient.get<RolesResponse>(
      "/api/roles"
    );

  return response.data.roles;
};

// ============================================================
// GET ALL USERS WITH ROLES
// ============================================================

export const getUsersWithRoles =
  async (): Promise<UserWithRoles[]> => {
    const response =
      await apiClient.get<UsersWithRolesResponse>(
        "/api/roles/users"
      );

    return response.data.users;
  };

// ============================================================
// GET COORDINATORS
// ============================================================

export const getCoordinators =
  async (): Promise<UserWithRoles[]> => {
    const response =
      await apiClient.get<CoordinatorsResponse>(
        "/api/roles/coordinators"
      );

    return response.data.coordinators;
  };

// ============================================================
// ASSIGN ROLE
// ============================================================

export const assignRole = async (
  n_user_id: number,
  s_role_name: string
): Promise<RoleActionResponse> => {
  const response =
    await apiClient.post<RoleActionResponse>(
      "/api/roles/assign",
      {
        n_user_id,
        s_role_name,
      }
    );

  return response.data;
};

// ============================================================
// REMOVE ROLE
// ============================================================

export const removeRole = async (
  n_user_id: number,
  s_role_name: string
): Promise<RoleActionResponse> => {
  const response =
    await apiClient.delete<RoleActionResponse>(
      "/api/roles/remove",
      {
        data: {
          n_user_id,
          s_role_name,
        },
      }
    );

  return response.data;
};