/* ============================================================
   FormKit — حرفه‌ای‌ترین مدیریت خطای فرم
   ============================================================
   Usage:
     FormKit.attach('#loginForm', {
         validate(values) {
             const errors = {};
             if (!values.identifier) errors.identifier = 'ایمیل یا نام کاربری الزامی است';
             return errors; // {} means OK
         },
         async submit(values) {
             const res = await fetch('/api/auth/login', {...});
             const data = await res.json();
             if (!res.ok) throw data;  // { code, message, details }
             return data;
         },
         onSuccess(data) { location.href = '/'; },
     });
   ============================================================ */

(function (global) {
    'use strict';

    /* --------------------------------------------------------
       Helpers
       -------------------------------------------------------- */
    const q = (sel, root = document) => root.querySelector(sel);
    const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function ensureErrorSlot(field) {
        let slot = field.querySelector('.field-error');
        if (!slot) {
            slot = document.createElement('div');
            slot.className = 'field-error';
            slot.setAttribute('role', 'alert');
            field.appendChild(slot);
        }
        return slot;
    }

    function findFieldWrapper(input) {
        return input.closest('.field') || input.parentElement;
    }

    function getInputs(form) {
        return qa('input[name], textarea[name], select[name]', form).filter(
            (el) => el.type !== 'hidden' && !el.disabled
        );
    }

    /* --------------------------------------------------------
       Field-level error display
       -------------------------------------------------------- */
    function showFieldError(input, message) {
        const field = findFieldWrapper(input);
        if (!field) return;

        field.classList.add('has-error');
        field.classList.remove('has-success');
        field.classList.add('shake');

        const slot = ensureErrorSlot(field);
        slot.textContent = message || 'این فیلد نامعتبر است';

        input.setAttribute('aria-invalid', 'true');

        // restart animation
        field.addEventListener('animationend', () => field.classList.remove('shake'), { once: true });

        // scroll into view (only first time)
        if (!field.dataset.scrolled) {
            field.dataset.scrolled = '1';
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function clearFieldError(input) {
        const field = findFieldWrapper(input);
        if (!field) return;
        field.classList.remove('has-error', 'shake');
        input.removeAttribute('aria-invalid');
        delete field.dataset.scrolled;

        const slot = field.querySelector('.field-error');
        if (slot) slot.textContent = '';
    }

    function clearAllErrors(form) {
        getInputs(form).forEach(clearFieldError);
        form.querySelectorAll('.has-error, .shake').forEach((el) => {
            el.classList.remove('has-error', 'shake');
        });
        const banner = form.querySelector('.form-error-banner');
        if (banner) {
            banner.classList.remove('visible');
            banner.textContent = '';
        }
    }

    /* --------------------------------------------------------
       Form-level banner (for general errors)
       -------------------------------------------------------- */
    function showFormBanner(form, message) {
        let banner = form.querySelector('.form-error-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'form-error-banner';
            banner.innerHTML = `<span class="form-error-banner__icon">!</span><span class="form-error-banner__text"></span>`;
            form.insertBefore(banner, form.firstChild);
        }
        banner.querySelector('.form-error-banner__text').textContent = message;
        banner.classList.add('visible');
    }

    /* --------------------------------------------------------
       Server error mapping
       --------------------------------------------------------
       Accepts shapes:
         { message, details: { field: ["msg1", "msg2"], ... } }
         { message, details: { field: "msg" } }
         { message, details: { field: { message: "msg" } } }
         { message, fields:  { ... } }
         { errors: [ { path, message } ] }  (express-validator)
       -------------------------------------------------------- */
    function extractFieldErrors(payload) {
        if (!payload || typeof payload !== 'object') return {};

        const map = {};

        const push = (key, msg) => {
            if (!key) return;
            const k = Array.isArray(key) ? key.join('.') : String(key);
            map[k] = map[k] || [];
            if (msg) map[k].push(String(msg));
        };

        // 1. details map
        if (payload.details && typeof payload.details === 'object') {
            for (const [key, val] of Object.entries(payload.details)) {
                if (Array.isArray(val)) val.forEach((m) => push(key, m));
                else if (val && typeof val === 'object' && val.message) push(key, val.message);
                else push(key, val);
            }
        }

        // 2. fields map
        if (payload.fields && typeof payload.fields === 'object') {
            for (const [key, val] of Object.entries(payload.fields)) {
                if (Array.isArray(val)) val.forEach((m) => push(key, m));
                else if (val && typeof val === 'object' && val.message) push(key, val.message);
                else push(key, val);
            }
        }

        // 3. errors array (express-validator style)
        if (Array.isArray(payload.errors)) {
            payload.errors.forEach((e) => {
                if (e && e.path) push(e.path, e.msg || e.message);
            });
        }

        return map;
    }

    function applyServerErrors(form, payload) {
        const map = extractFieldErrors(payload);
        let firstInvalid = null;

        for (const [name, messages] of Object.entries(map)) {
            const input = form.querySelector(`[name="${CSS.escape(name)}"]`);
            if (!input) continue;
            showFieldError(input, messages[0]);
            if (!firstInvalid) firstInvalid = input;
        }

        if (firstInvalid) {
            firstInvalid.focus({ preventScroll: true });
        }

        return Object.keys(map).length > 0;
    }

    /* --------------------------------------------------------
       Loading state
       -------------------------------------------------------- */
    function setFormLoading(form, loading) {
        const btn = form.querySelector('button[type="submit"], .auth-btn');
        if (!btn) return;

        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.classList.add('loading');
            btn.disabled = true;
            form.querySelectorAll('input, textarea, select, button').forEach((el) => {
                if (el !== btn) el.disabled = true;
            });
        } else {
            btn.classList.remove('loading');
            if (btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
            btn.disabled = false;
            form.querySelectorAll('input, textarea, select, button').forEach((el) => {
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
            if (el.type === 'checkbox') {
                out[el.name] = el.checked;
            } else if (el.type === 'radio') {
                if (el.checked) out[el.name] = el.value;
            } else {
                out[el.name] = el.value.trim();
            }
        });
        return out;
    }

    /* --------------------------------------------------------
       HTML5 native validation → our error display
       -------------------------------------------------------- */
    function runNativeValidation(form) {
        let valid = true;
        let firstInvalid = null;

        getInputs(form).forEach((el) => {
            if (!el.willValidate) return;

            // skip if it's already fine
            if (el.checkValidity()) return;

            valid = false;
            const msg = el.validationMessage || 'این فیلد نامعتبر است';
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
        const form = typeof target === 'string' ? q(target) : target;
        if (!form) throw new Error('FormKit: form not found — ' + target);

        const {
            validate = null,     // (values) => { fieldName: message | [messages] }
            submit = null,     // async (values) => data
            onSuccess = null,     // (data) => void
            onError = null,     // (payload) => void
            showDialogOnError = false,
            successMessage = null,
        } = options;

        // live clearing: typing removes the error
        getInputs(form).forEach((input) => {
            const evt = input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input';
            input.addEventListener(evt, () => {
                const field = findFieldWrapper(input);
                if (field && field.classList.contains('has-error')) {
                    clearFieldError(input);
                }
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            clearAllErrors(form);

            const values = readValues(form);

            // 1. native validation first
            if (!runNativeValidation(form)) return;

            // 2. custom validation
            if (typeof validate === 'function') {
                const errors = validate(values) || {};
                const keys = Object.keys(errors);
                if (keys.length) {
                    let firstInvalid = null;
                    for (const key of keys) {
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
            if (typeof submit !== 'function') return;

            setFormLoading(form, true);
            try {
                const data = await submit(values);

                if (successMessage) toast(successMessage, 'success');

                if (typeof onSuccess === 'function') {
                    onSuccess(data);
                }
            } catch (err) {
                const payload = err || {};

                // field-level mapping
                const hasFieldErrors = applyServerErrors(form, payload);

                const msg = payload.message || 'خطای غیرمنتظره رخ داد';

                if (!hasFieldErrors) {
                    // no field-level → show banner + dialog
                    showFormBanner(form, msg);
                    if (showDialogOnError) openDialogError('خطا', msg);
                    else toast(msg, 'error');
                } else {
                    // has field-level → small toast so user notices
                    toast(msg, 'error');
                }

                if (typeof onError === 'function') onError(payload);
            } finally {
                setFormLoading(form, false);
            }
        });

        // public API on instance
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
       Fetch wrapper — throws structured errors
       -------------------------------------------------------- */
    async function postJSON(url, body, extra = {}) {
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            ...extra,
        });

        let data = null;
        try { data = await res.json(); } catch { /* ignore */ }

        if (!res.ok) {
            const err = data || { message: 'خطای شبکه', code: 'NETWORK_ERROR' };
            err.status = res.status;
            throw err;
        }
        return data;
    }

    /* --------------------------------------------------------
       Expose
       -------------------------------------------------------- */
    global.FormKit = {
        attach,
        postJSON,
        showFieldError,
        clearFieldError,
        clearAllErrors,
        showFormBanner,
        applyServerErrors,
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