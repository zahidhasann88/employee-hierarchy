import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  EmployeeResponse,
  Employee,
  ApiResponse,
} from "@/types";
import { isTokenExpired } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      if (isTokenExpired(session.accessToken)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const response = await refreshToken();
            const newToken = response.data.accessToken;
            config.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            return config;
          } catch (error) {
            processQueue(error, null);
            await signOut({ redirect: true, callbackUrl: "/auth/login" });
            return Promise.reject(error);
          } finally {
            isRefreshing = false;
          }
        } else {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              config.headers.Authorization = `Bearer ${token}`;
              return config;
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }
      }
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.message?.includes("Token expired")) {
      await signOut({ redirect: true, callbackUrl: "/auth/login" });
    }
    return Promise.reject(error);
  }
);

export const refreshToken = async () => {
  const session = await getSession();
  if (!session?.refreshToken) {
    throw new Error("No refresh token available");
  }
  const { data } = await api.post<AuthResponse>("/api/auth/refresh-token", {
    refreshToken: session.refreshToken,
  });
  return data;
};

export const logout = async () => {
  try {
    await api.post("/api/auth/logout");
  } finally {
    await signOut({ redirect: true, callbackUrl: "/auth/login" });
  }
};

export const loginUser = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/api/auth/login", credentials);
  return data;
};

export const registerUser = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>(
    "/api/auth/register",
    credentials
  );
  return data;
};

export const getAllEmployees = async (page = 1, limit = 10) => {
  const { data } = await api.get<{
    data: {
      data: Employee[];
      total: number;
      page: number;
      limit: number;
      totalSubordinatesCount: number;
    };
    meta: {
      timestamp: string;
      requestId: string;
    };
  }>(`/api/employees?page=${page}&limit=${limit}`);
  return {
    employees: data.data.data,
    total: data.data.total,
    page: data.data.page,
    limit: data.data.limit,
    totalSubordinatesCount: data.data.totalSubordinatesCount
  };
};

export const getEmployeeById = async (id: number) => {
  const { data } = await api.get<{
    data: Employee;
    meta: {
      timestamp: string;
      requestId: string;
    };
  }>(`/api/employees/${id}`);
  return data.data;
};

export const getEmployeeSubordinates = async (
  id: number
): Promise<Employee> => {
  const { data } = await api.get<EmployeeResponse>(
    `/api/employees/${id}/subordinates`
  );
  return data.data.employee;
};

export const createEmployee = async (employeeData: Partial<Employee>) => {
  const { data } = await api.post<{
    data: Employee;
    meta: {
      timestamp: string;
      requestId: string;
    };
  }>("/api/employees", employeeData);
  return data.data;
};

export const updateEmployee = async (
  id: number,
  employeeData: Partial<Employee>
) => {
  const { data } = await api.patch<{
    data: Employee;
    meta: {
      timestamp: string;
      requestId: string;
    };
  }>(`/api/employees/${id}`, employeeData);
  return data.data;
};

export const deleteEmployee = async (id: number) => {
  const { data } = await api.delete<{
    data: Employee;
    meta: {
      timestamp: string;
      requestId: string;
    };
  }>(`/api/employees/${id}`);
  return data.data;
};

export const register = async (credentials: RegisterCredentials): Promise<ApiResponse<any>> => {
  const { data } = await api.post<ApiResponse<any>>('/api/auth/register', credentials);
  return data;
};

export default api;
