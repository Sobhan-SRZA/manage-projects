"use client";

import { DropdownMenuItem } from './ui/dropdown-menu'
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth/auth-client'

export default function SignOutButton() {
    const router = useRouter();

    return (
        <DropdownMenuItem
            onClick={async () => {
                const result = await signOut();

                if (result.data) {
                    router.push("/sign-in")
                }

                else {
                    alert("Error signing out")
                }
            }}
        >
            Log Out
        </DropdownMenuItem>
    )
}
