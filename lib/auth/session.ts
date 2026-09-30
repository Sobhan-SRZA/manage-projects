// lib/auth/session.ts
import { auth, signOut as authSignOut } from "./auth";
import { redirect } from "next/navigation";

export async function getSession() {
    return auth();
}

export async function signOutAction() {
    "use server";
    await authSignOut({ redirect: false });
    
    redirect("/sign-in");
}