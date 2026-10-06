/* ============================================================
   AUTH PAGES SCRIPT (login + register)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------
       1. PASSWORD VISIBILITY TOGGLE
       -------------------------------------------------------- */
    document.querySelectorAll('.toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';

            btn.classList.toggle('active', isPassword);
            btn.setAttribute('aria-label', isPassword ? 'پنهان کردن رمز' : 'نمایش رمز');
        });
    });


    /* --------------------------------------------------------
       2. REGISTER: PASSWORD CONFIRMATION
       -------------------------------------------------------- */
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        const passwordInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm');
        const confirmError = document.getElementById('confirm-error');

        function validatePasswords() {
            const match = passwordInput.value === confirmInput.value;

            if (confirmInput.value.length > 0 && !match) {
                confirmError.classList.add('visible');
                confirmInput.style.borderColor = '#ff4d4d';
                return false;
            }
            confirmError.classList.remove('visible');
            confirmInput.style.borderColor = '';
            return true;
        }

        confirmInput.addEventListener('input', validatePasswords);
        passwordInput.addEventListener('input', () => {
            if (confirmInput.value.length > 0) validatePasswords();
        });

        registerForm.addEventListener('submit', (e) => {
            const passwordsOk = validatePasswords();
            const termsOk = registerForm.querySelector('input[name="terms"]').checked;

            if (!passwordsOk) {
                e.preventDefault();
                confirmInput.focus();
                return;
            }

            if (!termsOk) {
                e.preventDefault();
                alert('برای ثبت نام باید قوانین را بپذیرید.');
                return;
            }
            // otherwise form submits normally to /register
        });
    }


    /* --------------------------------------------------------
       3. LOGIN (optional client-side guard)
       -------------------------------------------------------- */
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            const identifier = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value;

            if (!identifier || !password) {
                e.preventDefault();
                return;
            }
            // form submits normally to /login
        });
    }

});