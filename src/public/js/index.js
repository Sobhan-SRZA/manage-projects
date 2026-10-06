/* ============================================================
   AUTH SECTION — Tab switching, validation, password confirm
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------
       1. TAB SWITCHING (ورود / ثبت نام)
       -------------------------------------------------------- */
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    function switchTab(targetTab) {
        // toggle active class on tabs
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === targetTab);
        });

        // toggle active class on forms
        forms.forEach(form => {
            form.classList.toggle('active', form.dataset.form === targetTab);
        });

        // clear any previous errors when switching
        clearErrors();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // "already have an account?" / "don't have one?" links
    document.querySelectorAll('[data-switch]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.dataset.switch);
        });
    });


    /* --------------------------------------------------------
       2. PASSWORD CONFIRMATION CHECK (ثبت نام)
       -------------------------------------------------------- */
    const regForm = document.querySelector('[data-form="register"]');
    const passwordInput = document.getElementById('reg-password');
    const confirmInput = document.getElementById('reg-confirm');
    const confirmError = document.getElementById('confirm-error');

    function validatePasswords() {
        if (!passwordInput || !confirmInput || !confirmError) return true;

        const match = passwordInput.value === confirmInput.value;

        // only show error if confirm field has a value
        if (confirmInput.value.length > 0 && !match) {
            confirmError.classList.add('visible');
            confirmInput.style.borderColor = '#ff4d4d';
            return false;
        } else {
            confirmError.classList.remove('visible');
            confirmInput.style.borderColor = '';
            return true;
        }
    }

    if (confirmInput) {
        confirmInput.addEventListener('input', validatePasswords);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            // re-check if confirm already has a value
            if (confirmInput && confirmInput.value.length > 0) {
                validatePasswords();
            }
        });
    }


    /* --------------------------------------------------------
       3. FORM SUBMIT VALIDATION
       -------------------------------------------------------- */
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            const passwordsOk = validatePasswords();
            const termsOk = regForm.querySelector('input[name="terms"]').checked;

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

            // form will submit normally to /register
        });
    }

    // login form — just native HTML validation (required, type=email)
    const loginForm = document.querySelector('[data-form="login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // if browser validation passes, form submits to /login
            // you can add custom logic here if needed
        });
    }


    /* --------------------------------------------------------
       4. HELPERS
       -------------------------------------------------------- */
    function clearErrors() {
        if (confirmError) confirmError.classList.remove('visible');
        if (confirmInput) confirmInput.style.borderColor = '';
    }

});