import { NextResponse } from "next/server";
import { auth } from "./lib/auth/auth";

export default auth((req) => {
    const session = req.auth;
    const pathname = req.nextUrl.pathname;

    const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

    const isDashboard = pathname.startsWith("/dashboard");

    // اگه لاگین کرده و میخواد بره صفحه auth → بفرست dashboard
    if (isAuthPage && session?.user) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // اگه لاگین نکرده و میخواد بره dashboard → بفرست sign-in
    if (isDashboard && !session?.user) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};