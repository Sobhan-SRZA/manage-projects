document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector('.auth-btn');

    // client-side password match check (already exists in auth.js)
    if (form.password.value !== form.confirmPassword.value) {
        openDialogError('خطا', 'رمز عبور و تکرار آن یکسان نیستند');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'در حال ثبت نام...';

    try {
        const body = {
            name: form.name.value.trim(),
            username: form.username.value.trim(),
            email: form.email.value.trim(),
            password: form.password.value,
            confirmPassword: form.confirmPassword.value,
            terms: form.terms.checked,
        };

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            const msg = data.details
                ? Object.values(data.details).flat().join(' • ')
                : data.message;
            openDialogError('خطا', msg || 'ثبت نام ناموفق بود');
            return;
        }

        window.location.href = '/';
    } catch {
        openDialogError('خطا', 'اتصال به سرور برقرار نشد');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */