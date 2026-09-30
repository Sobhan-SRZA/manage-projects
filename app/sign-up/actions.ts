// app/sign-up/actions.ts
"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/prisma/prisma";
import { initializeUserBoard } from "@/lib/init-user-board";

export type RegisterResult =
    | { success: true }
    | { success: false; error: string };

export async function registerUser(
    name: string,
    email: string,
    password: string
): Promise<RegisterResult> {
    // اعتبارسنجی ساده سمت سرور
    if (!name.trim() || !email.trim() || !password) {
        return { success: false, error: "All fields are required" };
    }

    if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters" };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existing) {
        return { success: false, error: "Email is already registered" };
    }

    const hashed = await hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashed,
        },
    });

    // این تابع رو از کد قبلی‌ت نگه داشتم
    await initializeUserBoard(user.id);

    return { success: true };
}