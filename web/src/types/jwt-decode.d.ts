declare module 'jwt-decode' {
    export default function jwt_decode<T = unknown>(token: string): T;
  }