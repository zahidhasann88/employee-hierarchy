// Authentication
export interface User {
    id: number;
    username: string;
    role: 'admin' | 'manager' | 'user';
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  export interface RegisterCredentials {
    username: string;
    password: string;
    role: 'admin' | 'manager' | 'user';
  }
  
  export interface AuthResponse {
    data: {
      accessToken: string;
      refreshToken: string;
    };
    meta: {
      timestamp: string;
      requestId: string;
    };
  }
  
  export interface Employee {
    id: number;
    name: string;
    position: string;
    managerId: number | null;
    createdAt: string;
    updatedAt: string;
    subordinates: Employee[];
    totalSubordinatesCount?: number;
  }
  
  export interface EmployeeResponse {
    data: {
      employee: Employee;
    };
    meta: {
      timestamp: string;
      requestId: string;
    };
  }
  
  export interface EmployeesResponse {
    data: {
      data: Employee[];
      total: number;
    };
    meta: {
      timestamp: string;
      requestId: string;
    };
  }
  
  // UI Components
  export interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    title?: string;
  }
  
  export interface CardProps {
    children: React.ReactNode;
    className?: string;
  }
  
  // API
  export interface ApiError {
    message: string;
    status: number;
  }

  export interface ApiResponse<T> {
    data: T;
    meta: {
      timestamp: string;
      requestId: string;
    };
  }