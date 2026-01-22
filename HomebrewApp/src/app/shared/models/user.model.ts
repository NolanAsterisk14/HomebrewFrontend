export interface User {
  id: string;
  username: string;
  email: string;
  role: 'User' | 'DungeonMaster';
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
