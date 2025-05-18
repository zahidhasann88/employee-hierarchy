import { jwtDecode } from "jwt-decode";
import { User } from "@/types";

interface JwtPayload {
  username: string;
  sub: number;
  iat: number;
  exp: number;
  role: 'admin' | 'manager' | 'user';
}

export const decodeToken = (token: string): User | null => {
  try {
    const decodedToken = jwtDecode<JwtPayload>(token);
    
    return {
      id: decodedToken.sub,
      username: decodedToken.username,
      role: decodedToken.role
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decodedToken = jwtDecode<JwtPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return decodedToken.exp < currentTime;
  } catch (error) {
    return true;
  }
};