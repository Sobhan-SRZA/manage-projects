document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const btn = form.querySelector(".auth-btn");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "در حال ورود...";

    try {
        const body = {
            identifier: form.identifier.value.trim(),
            password: form.password.value,
            remember: form.remember?.checked ?? false,
        };

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            // your existing dialogError component
            openDialogError("خطا", data.message || "ورود ناموفق بود");
            return;
        }

        // success → redirect home
        window.location.href = "/";
    } catch (err) {
        openDialogError("خطا", "اتصال به سرور برقرار نشد");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});