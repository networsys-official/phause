import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { prisma } from "@/infrastructure/database/prisma";
import { passwordMeetsRequirements } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? body?.fullName ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Name, email, and password are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }

    if (!passwordMeetsRequirements(password)) {
      return NextResponse.json({ success: false, message: "Password must be at least 12 characters and include upper/lowercase, number, and symbol." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "VIEWER",
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: user.id,
        action: "CREATE",
        actor: "SYSTEM",
        metadata: { email, source: "self-register" },
      },
    });

    return NextResponse.json({ success: true, message: "Account created successfully." });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to create account right now." }, { status: 500 });
  }
}
