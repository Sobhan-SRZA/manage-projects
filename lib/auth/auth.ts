import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client/extension";
import { betterAuth } from "better-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql"
    }),

    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60
        }
    },

    emailAndPassword: {
        enabled: true
    },

    // databaseHooks: {
    //     user: {
    //         create: {
    //             after: async (user) => {
    //                 if (user.id) {
    //                 }
    //             }
    //         }
    //     }
    // }
})

export async function getSession() {
    const result = await auth.api.getSession({
        headers: await headers()
    });

    return result;
}

export async function signOut() {
    const result = await auth.api.signOut({
        headers: await headers()
    });

    if (result.success) {
        redirect("/sign-in");
    }
}