import { z } from "zod";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;

export const registerSchema = z
    .object({
        name: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد").max(60),
        username: z
            .string()
            .trim()
            .regex(usernameRegex, "نام کاربری باید ۳ تا ۲۰ کاراکتر و شامل حروف، عدد، _ یا . باشد"),

        email: z.string().trim().toLowerCase().email("ایمیل نامعتبر است"),

        password: z
            .string()
            .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
            .regex(passwordRegex, "رمز عبور باید شامل حرف و عدد باشد"),

        confirmPassword: z.string(),

        terms: z.union([z.boolean(), z.literal("on"), z.literal("true")]).optional()
    })

    .refine((d) => d.password === d.confirmPassword, {
        message: "رمز عبور و تکرار آن یکسان نیستند",
        path: ["confirmPassword"]
    })

    .refine((d) => !!d.terms, {
        message: "پذیرش قوانین الزامی است",
        path: ["terms"]
    });

export const loginSchema = z.object({
    identifier: z.string().trim().min(1, "ایمیل یا نام کاربری الزامی است"),

    password: z.string().min(1, "رمز عبور الزامی است"),
    
    remember: z.union([z.boolean(), z.literal("on"), z.literal("true")]).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */