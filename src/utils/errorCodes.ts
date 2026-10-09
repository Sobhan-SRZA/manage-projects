/**
 * همه کدهای خطای ممکن. هر کد پیام پیش‌فرض داره و فرانت می‌تونه
 * بر اساسش رفتار متفاوتی نشون بده.
 */
export const ErrorCodes = {
    // ---------- Validation ----------
    VALIDATION_ERROR:       "VALIDATION_ERROR",

    // ---------- Register ----------
    USERNAME_TAKEN:         "USERNAME_TAKEN",
    EMAIL_TAKEN:            "EMAIL_TAKEN",
    USERNAME_INVALID:       "USERNAME_INVALID",
    USERNAME_TOO_SHORT:     "USERNAME_TOO_SHORT",
    USERNAME_TOO_LONG:      "USERNAME_TOO_LONG",
    USERNAME_HAS_AT:        "USERNAME_HAS_AT",
    USERNAME_NOT_ENGLISH:   "USERNAME_NOT_ENGLISH",
    USERNAME_HAS_SPACE:     "USERNAME_HAS_SPACE",
    EMAIL_INVALID:          "EMAIL_INVALID",
    PASSWORD_TOO_SHORT:     "PASSWORD_TOO_SHORT",
    PASSWORD_TOO_WEAK:      "PASSWORD_TOO_WEAK",
    PASSWORDS_DONT_MATCH:   "PASSWORDS_DONT_MATCH",
    TERMS_NOT_ACCEPTED:     "TERMS_NOT_ACCEPTED",
    NAME_TOO_SHORT:         "NAME_TOO_SHORT",
    NAME_TOO_LONG:          "NAME_TOO_LONG",

    // ---------- Login ----------
    INVALID_CREDENTIALS:    "INVALID_CREDENTIALS",      // یوزر/ایمیل یا پسورد غلط
    ACCOUNT_NOT_FOUND:      "ACCOUNT_NOT_FOUND",        // (اختیاری، برای UX بهتر)
    ACCOUNT_DISABLED:       "ACCOUNT_DISABLED",
    TOO_MANY_ATTEMPTS:      "TOO_MANY_ATTEMPTS",        // (برای rate limit)

    // ---------- Session / Token ----------
    NO_TOKEN:               "NO_TOKEN",
    INVALID_TOKEN:          "INVALID_TOKEN",
    WRONG_TOKEN_TYPE:       "WRONG_TOKEN_TYPE",
    SESSION_NOT_FOUND:      "SESSION_NOT_FOUND",
    SESSION_EXPIRED:        "SESSION_EXPIRED",
    NO_REFRESH_TOKEN:       "NO_REFRESH_TOKEN",
    INVALID_REFRESH_TOKEN:  "INVALID_REFRESH_TOKEN",
    UNAUTHENTICATED:        "UNAUTHENTICATED",

    // ---------- Server ----------
    INTERNAL_ERROR:         "INTERNAL_ERROR",
    DATABASE_ERROR:         "DATABASE_ERROR",
    NETWORK_ERROR:          "NETWORK_ERROR",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * پیام پیش‌فرض فارسی برای هر کد.
 * کنترلر می‌تونه پیام دقیق‌تر بده، ولی اگه نداد از این استفاده می‌شه.
 */
export const ErrorMessages: Record<string, string> = {
    [ErrorCodes.VALIDATION_ERROR]:       "داده‌های ورودی نامعتبر است",

    [ErrorCodes.USERNAME_TAKEN]:         "این نام کاربری قبلاً گرفته شده است",
    [ErrorCodes.EMAIL_TAKEN]:            "این ایمیل قبلاً ثبت شده است",
    [ErrorCodes.USERNAME_INVALID]:       "نام کاربری نامعتبر است",
    [ErrorCodes.USERNAME_TOO_SHORT]:     "نام کاربری باید حداقل ۳ کاراکتر باشد",
    [ErrorCodes.USERNAME_TOO_LONG]:      "نام کاربری باید حداکثر ۲۰ کاراکتر باشد",
    [ErrorCodes.USERNAME_HAS_AT]:        "نام کاربری نمی‌تواند شامل @ باشد",
    [ErrorCodes.USERNAME_NOT_ENGLISH]:   "نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، _ ، . یا - باشد",
    [ErrorCodes.USERNAME_HAS_SPACE]:     "نام کاربری نمی‌تواند شامل فاصله باشد",
    [ErrorCodes.EMAIL_INVALID]:          "ایمیل نامعتبر است",
    [ErrorCodes.PASSWORD_TOO_SHORT]:     "رمز عبور باید حداقل ۶ کاراکتر باشد",
    [ErrorCodes.PASSWORD_TOO_WEAK]:      "رمز عبور باید شامل حرف و عدد باشد",
    [ErrorCodes.PASSWORDS_DONT_MATCH]:   "رمز عبور و تکرار آن یکسان نیستند",
    [ErrorCodes.TERMS_NOT_ACCEPTED]:     "پذیرش قوانین الزامی است",
    [ErrorCodes.NAME_TOO_SHORT]:         "نام باید حداقل ۲ حرف باشد",
    [ErrorCodes.NAME_TOO_LONG]:          "نام بیش از حد طولانی است",

    [ErrorCodes.INVALID_CREDENTIALS]:    "ایمیل/نام کاربری یا رمز عبور اشتباه است",
    [ErrorCodes.ACCOUNT_NOT_FOUND]:      "حسابی با این مشخصات پیدا نشد",
    [ErrorCodes.ACCOUNT_DISABLED]:       "این حساب غیرفعال شده است",
    [ErrorCodes.TOO_MANY_ATTEMPTS]:      "تلاش‌های زیاد. لطفاً چند دقیقه بعد امتحان کنید",

    [ErrorCodes.NO_TOKEN]:               "ابتدا وارد شوید",
    [ErrorCodes.INVALID_TOKEN]:          "توکن نامعتبر است",
    [ErrorCodes.WRONG_TOKEN_TYPE]:       "نوع توکن اشتباه است",
    [ErrorCodes.SESSION_NOT_FOUND]:      "سشن یافت نشد",
    [ErrorCodes.SESSION_EXPIRED]:        "سشن منقضی شده است، دوباره وارد شوید",
    [ErrorCodes.NO_REFRESH_TOKEN]:       "توکن refresh موجود نیست",
    [ErrorCodes.INVALID_REFRESH_TOKEN]:  "توکن refresh نامعتبر یا منقضی است",
    [ErrorCodes.UNAUTHENTICATED]:        "ابتدا وارد شوید",

    [ErrorCodes.INTERNAL_ERROR]:         "خطای داخلی سرور",
    [ErrorCodes.DATABASE_ERROR]:         "خطا در ارتباط با دیتابیس",
    [ErrorCodes.NETWORK_ERROR]:          "اتصال به سرور برقرار نشد",
};

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */