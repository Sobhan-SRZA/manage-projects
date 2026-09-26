"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "./ui/dropdown-menu";
import {
    Avatar,
    AvatarFallback
} from "./ui/avatar";
import { useSession } from "@/lib/auth/auth-client";
import { Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import SignOutButton from "./signout-btn";
import Link from "next/link";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="container mx-auto flex h-16 items-center px-4 justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
                    <Briefcase />
                    Job Tracker
                </Link>

                <div className="flex items-center gap-4">
                    {/* User session check */}
                    {session?.user
                        ? (
                            <>
                                <Link href="/dashboard">
                                    <Button
                                        variant="ghost"
                                        className="text-gray-700 hover:text-black"
                                    >
                                        Dashboard
                                    </Button>
                                </Link>

                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <Button
                                            variant="ghost"
                                            className="relative size-8 rounded-full"
                                        >
                                            <Avatar className="size-8">
                                                <AvatarFallback className="bg-primary text-white">
                                                    {session.user.name[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="w-56" align="end">
                                        <DropdownMenuGroup>
                                            <DropdownMenuLabel className="font-normal">
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                                                </div>
                                            </DropdownMenuLabel>

                                            {/* sign out button */}
                                            <SignOutButton />
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )

                        : (
                            <>
                                {/* sign in or sign up buttons  */}
                                <Link href="/sign-in">
                                    <Button variant="ghost" className="text-gray-700 hover:text-black">
                                        Log In
                                    </Button>
                                </Link>

                                <Link href="/sign-up">
                                    <Button className="bg-primary hover:bg-primary/90">
                                        Start for free
                                    </Button>
                                </Link>
                            </>
                        )}
                </div>
            </div>
        </nav>
    )
}
