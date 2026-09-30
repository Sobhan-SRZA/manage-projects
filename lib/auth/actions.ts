// app/sign-up/actions.ts
"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/prisma/prisma";
import { signIn } from "./auth";

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return { error: "Email already exists" };

    const hashed = await hash(password, 10);

    await prisma.user.create({
        data: { email, password: hashed, name },
    });

    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}