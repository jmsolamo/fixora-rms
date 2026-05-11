import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";

type UserRow = RowDataPacket & {
  id: number;
  password: string;
  role: number;
  username: string;
  fname: string;
  lname: string;
};

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const username =
      typeof body === "object" &&
      body !== null &&
      "username" in body &&
      typeof (body as { username: unknown }).username === "string"
        ? (body as { username: string }).username.trim()
        : "";
    const password =
      typeof body === "object" &&
      body !== null &&
      "password" in body &&
      typeof (body as { password: unknown }).password === "string"
        ? (body as { password: string }).password
        : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const pool = getPool();
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, password, role, username, fname, lname FROM users WHERE username = ? LIMIT 1",
      [username],
    );

    const user = rows[0];
    if (!user?.password) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const displayName = `${user.fname ?? ""} ${user.lname ?? ""}`.trim();

    return NextResponse.json({
      ok: true as const,
      userId: Number(user.id),
      role: Number(user.role),
      username: user.username,
      displayName: displayName || user.username,
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      {
        error:
          "Unable to sign in. Check the database connection and `users` data.",
      },
      { status: 500 },
    );
  }
}
