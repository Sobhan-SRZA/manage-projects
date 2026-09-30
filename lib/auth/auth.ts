// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/prisma/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),

    // Credentials provider با database strategy نیاز به تنظیمات دستی داره
    // در ادامه توضیح داده شده
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 // ۱ ساعت
    },

    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password)
                     return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.password)
                     return null;

                const isValid = await compare(
                    credentials.password as string,
                    user.password
                );

                if (!isValid)
                     return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image
                };
            }
        })
    ],

    callbacks: {
        // اضافه کردن id به token
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }

            return token;
        },

        // اضافه کردن id به session
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }

            return session;
        }
    },

    pages: {
        signIn: "/sign-in"
    }
});