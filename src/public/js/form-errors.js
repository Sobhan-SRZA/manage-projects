/* ============================================================
   FormKit — مدیریت خطای فرم (نسخه پیشرفته)
   ============================================================
   پشتیبانی از:
     - HTML5 native validation
     - اعتبارسنجی سمت کلاینت
     - خطاهای بک‌اند با ساختار:
         { ok: false, code, message, field?, details? }
     - اولویت: details → field → banner
   ============================================================ */

(function (global) {
    "use strict";

    /* --------------------------------------------------------
       Constants — کدهای خطای بک‌اند
       -------------------------------------------------------- */
    const ERROR_CODES = {
        VALIDATION_ERROR: "VALIDATION_ERROR",
        USERNAME_TAKEN: "USERNAME_TAKEN",
        EMAIL_TAKEN: "EMAIL_TAKEN",
        USERNAME_INVALID: "USERNAME_INVALID",
        EMAIL_INVALID: "EMAIL_INVALID",
        PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
        PASSWORD_TOO_WEAK: "PASSWORD_TOO_WEAK",
        PASSWORDS_DONT_MATCH: "PASSWORDS_DONT_MATCH",
        TERMS_NOT_ACCEPTED: "TERMS_NOT_ACCEPTED",
        INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
        ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
        TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
        SESSION_EXPIRED: "SESSION_EXPIRED",
        INVALID_TOKEN: "INVALID_TOKEN",
        UNAUTHENTICATED: "UNAUTHENTICATED",
        NETWORK_ERROR: "NETWORK_ERROR",
        INTERNAL_ERROR: "INTERNAL_ERROR",
    };

    /**
     * برای بعضی کدها، فیلد پیش‌فرض مشخص می‌کنیم — حتی اگه سرور field نفرستاد.
     * مثلاً INVALID_CREDENTIALS → کنار identifier
     */
    const CODE_TO_FIELD = {
        [ERROR_CODES.USERNAME_TAKEN]: "username",
        [ERROR_CODES.EMAIL_TAKEN]: "email",
        [ERROR_CODES.USERNAME_INVALID]: "username",
        [ERROR_CODES.EMAIL_INVALID]: "email",
        [ERROR_CODES.PASSWORD_TOO_SHORT]: "password",
        [ERROR_CODES.PASSWORD_TOO_WEAK]: "password",
        [ERROR_CODES.PASSWORDS_DONT_MATCH]: "confirmPassword",
        [ERROR_CODES.TERMS_NOT_ACCEPTED]: "terms",
        [ERROR_CODES.INVALID_CREDENTIALS]: "identifier",
    };

    /* --------------------------------------------------------
       Helpers
       -------------------------------------------------------- */
    const q = (sel, root = document) => root.querySelector(sel);
    const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function ensureErrorSlot(field) {
        let slot = field.querySelector(".field-error");
        if (!slot) {
            slot = document.createElement("div");
            slot.className = "field-error";
            slot.setAttribute("role", "alert");
            field.appendChild(slot);
        }
        return slot;
    }

    function findFieldWrapper(input) {
        return input.closest(".field") || input.parentElement;
    }

    function getInputs(form) {
        return qa("input[name], textarea[name], select[name]", form).filter(
            (el) => el.type !== "hidden" && !el.disabled
        );
    }

    /* --------------------------------------------------------
       Field-level
       -------------------------------------------------------- */
    function showFieldError(input, message) {
        if (!input) return;
        const field = findFieldWrapper(input);
        if (!field) return;

        field.classList.add("has-error");
        field.classList.remove("has-success");
        field.classList.add("shake");

        const slot = ensureErrorSlot(field);
        slot.textContent = message || "این فیلد نامعتبر است";

        input.setAttribute("aria-invalid", "true");

        field.addEventListener("animationend", () => field.classList.remove("shake"), { once: true });

        if (!field.dataset.scrolled) {
            field.dataset.scrolled = "1";
            field.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function clearFieldError(input) {
        const field = findFieldWrapper(input);
        if (!field) return;

        field.classList.remove("has-error", "shake");
        input.removeAttribute("aria-invalid");
        delete field.dataset.scrolled;

        const slot = field.querySelector(".field-error");
        if (slot) slot.textContent = "";
    }

    function clearAllErrors(form) {
        getInputs(form).forEach(clearFieldError);
        form.querySelectorAll(".has-error, .shake").forEach((el) => {
            el.classList.remove("has-error", "shake");
        });

        const banner = form.querySelector(".form-error-banner");
        if (banner) {
            banner.classList.remove("visible");
            const t = banner.querySelector(".form-error-banner__text");
            if (t) t.textContent = "";
        }
    }

    /* --------------------------------------------------------
       Form-level banner
       -------------------------------------------------------- */
    function showFormBanner(form, message) {
        let banner = form.querySelector(".form-error-banner");
        if (!banner) {
            banner = document.createElement("div");
            banner.className = "form-error-banner";
            banner.innerHTML = `<span class="form-error-banner__icon">!</span><span class="form-error-banner__text"></span>`;
            form.insertBefore(banner, form.firstChild);
        }
        banner.querySelector(".form-error-banner__text").textContent = message;
        banner.classList.add("visible");
    }

    /* --------------------------------------------------------
       Extract field errors from server payload
       --------------------------------------------------------
       Shapes supported:
         { details: { field: [msg] } }
         { details: { field: msg } }
         { details: { field: { message: msg } } }
         { details: { _form: [msg] } }     ← form-level از Zod
         { fields: { ... } }
         { errors: [ { path, msg } ] }
         { field: "username", message: "..." }
         { code: "USERNAME_TAKEN", message: "..." }   ← نگاشت از CODE_TO_FIELD
       -------------------------------------------------------- */
    function extractFieldErrors(payload) {
        if (!payload || typeof payload !== "object") return {};

        const map = {};

        const push = (key, msg) => {
            if (!key) return;
            const k = Array.isArray(key) ? key.join(".") : String(key);
            map[k] = map[k] || [];
            if (msg) map[k].push(String(msg));
        };

        // 1. details map
        if (payload.details && typeof payload.details === "object") {
            for (const [key, val] of Object.entries(payload.details)) {
                if (Array.isArray(val)) val.forEach((m) => push(key, m));
                else if (val && typeof val === "object" && val.message) push(key, val.message);
                else push(key, val);
            }
        }

        // 2. fields map
        if (payload.fields && typeof payload.fields === "object") {
            for (const [key, val] of Object.entries(payload.fields)) {
                if (Array.isArray(val)) val.forEach((m) => push(key, m));
                else if (val && typeof val === "object" && val.message) push(key, val.message);
                else push(key, val);
            }
        }

        // 3. errors array
        if (Array.isArray(payload.errors)) {
            payload.errors.forEach((e) => {
                if (e && e.path) push(e.path, e.msg || e.message);
            });
        }

        // 4. single field + code mapping
        if (payload.field && payload.message && Object.keys(map).length === 0) {
            push(payload.field, payload.message);
        } else if (payload.code && payload.message && Object.keys(map).length === 0) {
            const fieldFromCode = CODE_TO_FIELD[payload.code];
            if (fieldFromCode) push(fieldFromCode, payload.message);
        }

        // 5. _form → form-level (نمایش در banner)
        //    فقط اگه فیلد دیگه‌ای نبود
        if (map._form && Object.keys(map).length === 1) {
            const formMsgs = map._form;
            delete map._form;
            map.__form__ = formMsgs;
        }

        return map;
    }

    function applyServerErrors(form, payload) {
        const map = extractFieldErrors(payload);
        const fieldKeys = Object.keys(map).filter((k) => k !== "__form__");
        let firstInvalid = null;

        for (const name of fieldKeys) {
            const input = form.querySelector(`[name="${CSS.escape(name)}"]`);
            if (!input) continue;
            showFieldError(input, map[name][0]);
            if (!firstInvalid) firstInvalid = input;
        }

        // اگه فیلد مشخصی نبود ولی خطای فرم داشت
        if (!firstInvalid && map.__form__ && map.__form__.length) {
            showFormBanner(form, map.__form__[0]);
        }

        if (firstInvalid) firstInvalid.focus({ preventScroll: true });

        return fieldKeys.length > 0;
    }

    /* --------------------------------------------------------
       Decide how to show the error
       -------------------------------------------------------- */
    function presentError(form, payload, opts = {}) {
        const { showDialogOnError = false } = opts;

        const code = payload?.code || "";
        const message = payload?.message || "خطای غیرمنتظره رخ داد";

        // 1. تلاش برای نشون دادن کنار فیلدها
        const hasFieldErrors = applyServerErrors(form, payload);

        // 2. اگه فیلد داشتیم → toast کوچیک + دیالوگ اختیاری
        if (hasFieldErrors) {
            toast(message, "error");
            return { handled: "field", code };
        }

        // 3. بسته به کد، استراتژی خاص
        switch (code) {
            case ERROR_CODES.INVALID_CREDENTIALS:
                // خطای کلی لاگین → banner + toast
                showFormBanner(form, message);
                toast(message, "error");
                return { handled: "credentials", code };

            case ERROR_CODES.TOO_MANY_ATTEMPTS:
            case ERROR_CODES.ACCOUNT_DISABLED:
            case ERROR_CODES.SESSION_EXPIRED:
                // نیاز به توجه کاربر → دیالوگ
                if (typeof openDialogError === "function") openDialogError("خطا", message);
                else toast(message, "error");
                return { handled: "dialog", code };

            case ERROR_CODES.NETWORK_ERROR:
                // اتصال قطع
                showFormBanner(form, message);
                toast(message, "error");
                return { handled: "network", code };

            case ERROR_CODES.INTERNAL_ERROR:
                if (typeof openDialogError === "function") openDialogError("خطای سرور", message);
                else toast(message, "error");
                return { handled: "server", code };

            default:
                // عمومی
                showFormBanner(form, message);
                if (showDialogOnError && typeof openDialogError === "function") {
                    openDialogError("خطا", message);
                } else {
                    toast(message, "error");
                }
                return { handled: "general", code };
        }
    }

    /* --------------------------------------------------------
       Loading state
       -------------------------------------------------------- */
    function setFormLoading(form, loading) {
        const btn = form.querySelector("button[type='submit'], .auth-btn");
        if (!btn) return;

        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.classList.add("loading");
            btn.disabled = true;
            form.querySelectorAll("input, textarea, select, button").forEach((el) => {
                if (el !== btn) el.disabled = true;
            });
        } else {
            btn.classList.remove("loading");
            if (btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
            btn.disabled = false;
            form.querySelectorAll("input, textarea, select, button").forEach((el) => {
                el.disabled = false;
            });
        }
    }

    /* --------------------------------------------------------
       Read form values
       -------------------------------------------------------- */
    function readValues(form) {
        const out = {};
        getInputs(form).forEach((el) => {
            if (el.type === "checkbox") {
                out[el.name] = el.checked;
            } else if (el.type === "radio") {
                if (el.checked) out[el.name] = el.value;
            } else {
                out[el.name] = el.value.trim();
            }
        });
        return out;
    }

    /* --------------------------------------------------------
       Native HTML5 validation
       -------------------------------------------------------- */
    function runNativeValidation(form) {
        let valid = true;
        let firstInvalid = null;

        getInputs(form).forEach((el) => {
            if (!el.willValidate) return;
            if (el.checkValidity()) return;

            valid = false;
            const msg = el.validationMessage || "این فیلد نامعتبر است";
            showFieldError(el, msg);
            if (!firstInvalid) firstInvalid = el;
        });

        if (firstInvalid) firstInvalid.focus({ preventScroll: true });
        return valid;
    }

    /* --------------------------------------------------------
       Attach
       -------------------------------------------------------- */
    function attach(target, options = {}) {
        const form = typeof target === "string" ? q(target) : target;
        if (!form) throw new Error("FormKit: form not found — " + target);

        const {
            validate = null,
            submit = null,
            onSuccess = null,
            onError = null,
            showDialogOnError = false,
            successMessage = null,
            clearOnInput = true,
        } = options;

        // پاک کردن خطا با تایپ
        if (clearOnInput) {
            getInputs(form).forEach((input) => {
                const evt = input.type === "checkbox" || input.type === "radio" ? "change" : "input";
                input.addEventListener(evt, () => {
                    const field = findFieldWrapper(input);
                    if (field && field.classList.contains("has-error")) {
                        clearFieldError(input);
                    }
                    // banner رو هم پاک کن اگه چیزی تایپ شد
                    const banner = form.querySelector(".form-error-banner.visible");
                    if (banner) banner.classList.remove("visible");
                });
            });
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearAllErrors(form);

            const values = readValues(form);

            // 1. native
            if (!runNativeValidation(form)) return;

            // 2. custom client-side
            if (typeof validate === "function") {
                let errors;
                try { errors = validate(values) || {}; }
                catch (err) { errors = { __form__: [err.message || "خطا در اعتبارسنجی"] }; }

                const keys = Object.keys(errors);
                if (keys.length) {
                    let firstInvalid = null;
                    for (const key of keys) {
                        if (key === "__form__") {
                            const msg = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
                            showFormBanner(form, msg);
                            continue;
                        }
                        const input = form.querySelector(`[name="${CSS.escape(key)}"]`);
                        if (!input) continue;
                        const msg = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
                        showFieldError(input, msg);
                        if (!firstInvalid) firstInvalid = input;
                    }
                    firstInvalid?.focus({ preventScroll: true });
                    return;
                }
            }

            // 3. submit
            if (typeof submit !== "function") return;

            setFormLoading(form, true);
            try {
                const data = await submit(values);

                if (successMessage) toast(successMessage, "success");
                if (typeof onSuccess === "function") onSuccess(data);

            } catch (err) {
                const payload = err || {};
                presentError(form, payload, { showDialogOnError });
                if (typeof onError === "function") onError(payload);
            } finally {
                setFormLoading(form, false);
            }
        });

        return {
            form,
            clearErrors: () => clearAllErrors(form),
            showError: (name, msg) => {
                const input = form.querySelector(`[name="${CSS.escape(name)}"]`);
                if (input) showFieldError(input, msg);
            },
            setLoading: (b) => setFormLoading(form, b),
            values: () => readValues(form),
        };
    }

    /* --------------------------------------------------------
       Fetch wrapper
       -------------------------------------------------------- */
    async function postJSON(url, body, extra = {}) {
        let res;
        try {
            res = await fetch(url, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body || {}),
                ...extra
            });
        } catch (networkErr) {
            // خطای واقعی شبکه
            const err = {
                code: ERROR_CODES.NETWORK_ERROR,
                message: "اتصال به سرور برقرار نشد",
                status: 0
            };
            throw err;
        }

        let data = null;
        try { data = await res.json(); } catch { /* ignore */ }
        console.log("🚀 ~ postJSON ~ data:", data)

        if (!res.ok) {
            const err = data || { message: "خطای شبکه", code: ERROR_CODES.NETWORK_ERROR };
            err.status = res.status;
            throw err;
        }
        return data;
    }

    /* --------------------------------------------------------
       Expose
       -------------------------------------------------------- */
    global.FormKit = {
        ERROR_CODES,
        CODE_TO_FIELD,
        attach,
        postJSON,
        showFieldError,
        clearFieldError,
        clearAllErrors,
        showFormBanner,
        applyServerErrors,
        presentError,
        setFormLoading,
        extractFieldErrors,
    };
})(window);

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */