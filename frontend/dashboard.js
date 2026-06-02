const API_BASE = window.location.protocol === "file:" ? "http://localhost:5000" : window.location.origin;
const portal = document.body.dataset.portal;
const token = localStorage.getItem("campusToken") || "";
const user = JSON.parse(localStorage.getItem("campusUser") || "null");
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=82";

function redirectForRole(role) {
    return role === "admin" ? "/admin-dashboard.html" : "/student-dashboard.html";
}

if (!token || !user) {
    window.location.replace("/?login=1");
} else if (portal === "admin" && user.role !== "admin") {
    window.location.replace(redirectForRole(user.role));
} else if (portal === "student" && user.role === "admin") {
    window.location.replace(redirectForRole(user.role));
}

const els = {
    toast: document.querySelector("#toast"),
    userInitial: document.querySelector("#userInitial"),
    headerUserName: document.querySelector("#headerUserName"),
    myRegistrationList: document.querySelector("#myRegistrationList"),
    myRegistrationCount: document.querySelector("#myRegistrationCount"),
    approvedCount: document.querySelector("#approvedCount"),
    pendingCount: document.querySelector("#pendingCount"),
    approvalList: document.querySelector("#approvalList"),
    requestBadge: document.querySelector("#requestBadge"),
    registrationMode: document.querySelector("#registrationMode"),
    paymentFields: document.querySelector("#paymentFields"),
};

function h(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function safeUrl(value, fallback = DEFAULT_IMAGE) {
    if (!value) return fallback;
    if (/^data:image\/(png|jpeg|webp);base64,/i.test(value)) return value;
    try {
        const url = new URL(value, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
    } catch {
        return fallback;
    }
}

function showToast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.toggle("error", isError);
    els.toast.classList.add("show");
    window.setTimeout(() => els.toast.classList.remove("show"), 3500);
}

async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
    }
    return data;
}

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result));
        reader.addEventListener("error", () => reject(new Error("Could not read the scanner image")));
        reader.readAsDataURL(file);
    });
}

function formatDate(value) {
    if (!value) return "Date to be announced";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function emptyState(title, message) {
    return `<div class="empty-state"><h3>${h(title)}</h3><p>${h(message)}</p></div>`;
}

function statusPill(status) {
    const normalized = ["approved", "rejected"].includes(status) ? status : "pending";
    return `<span class="status-pill status-${normalized}">${h(normalized)}</span>`;
}

function setUserHeader() {
    els.userInitial.textContent = user.name.charAt(0).toUpperCase();
    els.headerUserName.textContent = user.name;
}

async function loadStudentDashboard() {
    const registrations = await api("/events/my-registrations");
    const approved = registrations.filter((item) => item.registration.status === "approved").length;
    const pending = registrations.filter((item) => item.registration.status === "pending").length;
    document.querySelector("#studentGreeting").textContent = `${user.name}'s registrations`;
    els.myRegistrationCount.textContent = registrations.length;
    els.approvedCount.textContent = approved;
    els.pendingCount.textContent = pending;

    if (!registrations.length) {
        els.myRegistrationList.innerHTML = emptyState("No registrations yet", "Explore events and submit your first registration.");
        return;
    }

    els.myRegistrationList.innerHTML = registrations.map(({ event, registration }) => {
        const message = registration.status === "approved"
            ? "Approved. Your place is confirmed."
            : registration.status === "rejected"
                ? "This request was not approved."
                : "Submitted. Waiting for admin approval.";
        return `
            <article class="registration-card">
                <img src="${h(safeUrl(event.image_url))}" alt="${h(event.title)}">
                <div>
                    ${statusPill(registration.status)}
                    <h3>${h(event.title)}</h3>
                    <p>${h(formatDate(event.date))} &middot; ${h(event.location || "Venue TBA")}</p>
                    <p>${h(message)}</p>
                </div>
            </article>
        `;
    }).join("");
}

async function loadAdminDashboard() {
    const groups = await api("/admin/event-registrations");
    const requests = groups.flatMap((group) => group.registrations.map((registration) => ({
        event: group.event,
        registration,
    })));
    const pending = requests.filter((item) => item.registration.status === "pending").length;
    els.requestBadge.textContent = pending;

    if (!requests.length) {
        els.approvalList.innerHTML = emptyState("All clear", "New student registration requests will appear here.");
        return;
    }

    els.approvalList.innerHTML = requests
        .sort((a, b) => (a.registration.status === "pending" ? -1 : 1) - (b.registration.status === "pending" ? -1 : 1))
        .map(({ event, registration }) => `
            <article class="request-card">
                <div class="request-top">
                    <div>
                        ${statusPill(registration.status)}
                        <h3>${h(event.title)}</h3>
                        <p><strong>${h(registration.email)}</strong></p>
                        <p>${event.registration_mode === "paid" ? `Payment reference: ${h(registration.payment_reference || "Not provided")}` : "Free registration"}</p>
                    </div>
                    ${registration.status === "pending" ? `
                        <div class="request-actions">
                            <button class="approve" data-action="review-registration" data-event-id="${h(event._id)}" data-email="${h(registration.email)}" data-status="approved" type="button">Approve</button>
                            <button class="reject" data-action="review-registration" data-event-id="${h(event._id)}" data-email="${h(registration.email)}" data-status="rejected" type="button">Reject</button>
                        </div>
                    ` : ""}
                </div>
            </article>
        `).join("");
}

document.querySelector("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem("campusToken");
    localStorage.removeItem("campusUser");
    window.location.assign("/");
});

if (portal === "admin") {
    document.body.addEventListener("click", async (event) => {
        const tab = event.target.closest("[data-admin-tab]");
        if (tab) {
            document.querySelectorAll(".admin-tab").forEach((button) => button.classList.toggle("active", button === tab));
            document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === tab.dataset.adminTab));
            return;
        }

        const button = event.target.closest('[data-action="review-registration"]');
        if (!button) return;
        try {
            const result = await api(`/events/${button.dataset.eventId}/registrations/status`, {
                method: "POST",
                body: JSON.stringify({ email: button.dataset.email, status: button.dataset.status }),
            });
            await loadAdminDashboard();
            showToast(result.message);
        } catch (error) {
            showToast(error.message, true);
        }
    });

    document.querySelector("#refreshAdminButton").addEventListener("click", async () => {
        try {
            await loadAdminDashboard();
            showToast("Approval queue refreshed.");
        } catch (error) {
            showToast(error.message, true);
        }
    });

    els.registrationMode.addEventListener("change", () => els.paymentFields.classList.toggle("hidden", els.registrationMode.value !== "paid"));
    document.querySelector("#paymentQrFile").addEventListener("change", async (event) => {
        const preview = document.querySelector("#paymentQrPreview");
        const file = event.currentTarget.files[0];
        if (!file) {
            preview.classList.add("hidden");
            preview.removeAttribute("src");
            return;
        }
        if (file.size > 1_500_000) {
            event.currentTarget.value = "";
            preview.classList.add("hidden");
            preview.removeAttribute("src");
            showToast("Scanner image must be smaller than 1.5 MB", true);
            return;
        }
        preview.src = await fileToDataUrl(file);
        preview.classList.remove("hidden");
    });

    document.querySelector("#eventCoverFile").addEventListener("change", async (event) => {
        const preview = document.querySelector("#eventCoverPreview");
        const file = event.currentTarget.files[0];
        if (!file) {
            preview.classList.add("hidden");
            preview.removeAttribute("src");
            return;
        }
        if (file.size > 1_500_000) {
            event.currentTarget.value = "";
            preview.classList.add("hidden");
            preview.removeAttribute("src");
            showToast("Event cover image must be smaller than 1.5 MB", true);
            return;
        }
        preview.src = await fileToDataUrl(file);
        preview.classList.remove("hidden");
    });

    document.querySelector("#eventForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        try {
            const payload = formData(form);
            const coverFile = document.querySelector("#eventCoverFile").files[0];
            const qrFile = document.querySelector("#paymentQrFile").files[0];
            if (coverFile) {
                if (coverFile.size > 1_500_000) throw new Error("Event cover image must be smaller than 1.5 MB");
                payload.image_url = await fileToDataUrl(coverFile);
            }
            if (qrFile) {
                if (qrFile.size > 1_500_000) throw new Error("Scanner image must be smaller than 1.5 MB");
                payload.payment_qr_url = await fileToDataUrl(qrFile);
            }
            const result = await api("/events", { method: "POST", body: JSON.stringify(payload) });
            form.reset();
            els.paymentFields.classList.add("hidden");
            document.querySelector("#eventCoverPreview").classList.add("hidden");
            document.querySelector("#eventCoverPreview").removeAttribute("src");
            document.querySelector("#paymentQrPreview").classList.add("hidden");
            document.querySelector("#paymentQrPreview").removeAttribute("src");
            showToast(result.message || "Event published.");
        } catch (error) {
            showToast(error.message, true);
        }
    });

    document.querySelector("#announcementForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        try {
            const result = await api("/announcements", { method: "POST", body: JSON.stringify(formData(form)) });
            form.reset();
            showToast(result.message || "Announcement published.");
        } catch (error) {
            showToast(error.message, true);
        }
    });

    document.querySelector("#clubForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        try {
            const result = await api("/clubs", { method: "POST", body: JSON.stringify(formData(form)) });
            form.reset();
            showToast(result.message || "Club created.");
        } catch (error) {
            showToast(error.message, true);
        }
    });
}

const authorizedPortal = token && user
    && (portal !== "admin" || user.role === "admin")
    && (portal !== "student" || user.role !== "admin");

if (authorizedPortal) {
    setUserHeader();
    const load = portal === "admin" ? loadAdminDashboard : loadStudentDashboard;
    load().catch((error) => {
        if (/token|authorization|expired|missing/i.test(error.message)) {
            localStorage.removeItem("campusToken");
            localStorage.removeItem("campusUser");
            window.location.replace("/?login=1");
            return;
        }
        showToast(error.message, true);
    });
}
