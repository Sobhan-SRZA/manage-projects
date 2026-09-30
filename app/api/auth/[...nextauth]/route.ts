// app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;