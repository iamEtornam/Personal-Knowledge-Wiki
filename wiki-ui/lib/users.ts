import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

const USERS_FILE =
  process.env.USERS_FILE ?? path.join(process.cwd(), "..", "users.json");

function loadUsers(): User[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export function findUserByUsername(username: string): User | null {
  const users = loadUsers();
  return users.find((u) => u.username === username) ?? null;
}

export async function createUser(
  username: string,
  password: string,
): Promise<User> {
  const users = loadUsers();
  if (users.find((u) => u.username === username)) {
    throw new Error("Username already taken");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getUserCount(): number {
  return loadUsers().length;
}
