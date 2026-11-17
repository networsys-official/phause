import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/infrastructure/database/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name && !password) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (name) data.name = name;
  if (password) {
    if (password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ success: true, user: updated });
}
