"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    useState,
    useTransition
} from "react";
import { registerUser } from "./actions";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignUp() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const [, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            // ۱. ساخت کاربر در دیتابیس
            const result = await registerUser(name, email, password);

            if (!result.success) {
                setError(result.error);
                return;
            }

            // ۲. لاگین خودکار با credentials
            const signInResult = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (signInResult?.error) {
                setError("Account created but sign-in failed. Please sign in manually.");
                return;
            }

            // ۳. رفتن به داشبورد
            startTransition(() => {
                router.push("/dashboard");
                router.refresh();
            });
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white p-4">
            <Card className="w-full max-w-md border-gray-200 shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-black">
                        Sign Up
                    </CardTitle>

                    <CardDescription className="text-gray-600">
                        Create an account to start tracking your job applications
                    </CardDescription>
                </CardHeader>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-700">
                                Name
                            </Label>

                            <Input
                                id="name"
                                type="text"
                                placeholder="Sobhan-SRZA"
                                required
                                className="border-gray-300 focus:border-primary focus:ring-primary"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">
                                Email
                            </Label>

                            <Input
                                id="email"
                                type="email"
                                placeholder="sobhan.rasoulzadeh.asl@gmail.com"
                                required
                                className="border-gray-300 focus:border-primary focus:ring-primary"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700">
                                Password
                            </Label>

                            <Input
                                id="password"
                                type="password"
                                placeholder="!@123456789"
                                required
                                minLength={8}
                                className="border-gray-300 focus:border-primary focus:ring-primary"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Sign Up"}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link
                                href="/sign-in"
                                className="font-medium text-primary hover:underline"
                            >
                                Sign In
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}