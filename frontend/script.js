const API_BASE = window.location.protocol === "file:" ? "http://localhost:5000" : window.location.origin;

const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=82",
    "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=900&q=82",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=82",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=82",
];

const state = {
    token: localStorage.getItem("campusToken") || "",
    user: JSON.parse(localStorage.getItem("campusUser") || "null"),
    events: [],
    clubs: [],
    announcements: [],
    registrations: [],
    approvalGroups: [],
};

const els = {
    toast: document.querySelector("#toast"),
    eventGrid: document.querySelector("#eventGrid"),
    clubList: document.querySelector("#clubList"),
    announcementList: document.querySelector("#announcementList"),
    eventCount: document.querySelector("#eventCount"),
    heroEventCount: document.querySelector("#heroEventCount"),
    clubCount: document.querySelector("#clubCount"),
    announcementCount: document.querySelector("#announcementCount"),
    eventSearch: document.querySelector("#eventSearch"),
    categoryFilter: document.querySelector("#categoryFilter"),
    priceFilter: document.querySelector("#priceFilter"),
    authModal: document.querySelector("#authModal"),
    eventModal: document.querySelector("#eventModal"),
    eventModalBody: document.querySelector("#eventModalBody"),
    openLoginButton: document.querySelector("#openLoginButton"),
    openSignupButton: document.querySelector("#openSignupButton"),
    userMenu: document.querySelector("#userMenu"),
    userInitial: document.querySelector("#userInitial"),
    headerUserName: document.querySelector("#headerUserName"),
    studentGreeting: document.querySelector("#studentGreeting"),
    myRegistrationList: document.querySelector("#myRegistrationList"),
    myRegistrationCount: document.querySelector("#myRegistrationCount"),
    approvedCount: document.querySelector("#approvedCount"),
    pendingCount: document.querySelector("#pendingCount"),
    approvalList: document.querySelector("#approvalList"),
    requestBadge: document.querySelector("#requestBadge"),
    signupRole: document.querySelector("#signupRole"),
    adminCodeField: document.querySelector("#adminCodeField"),
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

function safeUrl(value, fallback = DEFAULT_IMAGES[0], allowImageData = false) {
    if (!value) return fallback;
    if (allowImageData && /^data:image\/(png|jpeg|webp);base64,/i.test(value)) {
        return value;
    }
    try {
        const url = new URL(value, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
    } catch {
        return fallback;
    }
}

function getEventImage(event, index = 0) {
    return safeUrl(event.image_url, DEFAULT_IMAGES[index % DEFAULT_IMAGES.length], true);
}

function showToast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.toggle("error", isError);
    els.toast.classList.add("show");
    window.setTimeout(() => els.toast.classList.remove("show"), 3500);
}

function authHeaders() {
    return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            ...(options.headers || {}),
        },
    });
    const text = await response.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error("The server returned an invalid response");
    }
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

function formatTimestamp(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
    }).format(date);
}

function formatPrice(event) {
    if (event.registration_mode !== "paid") return "Free";
    const amount = Number(event.price);
    if (!Number.isNaN(amount) && amount > 0) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    }
    return event.price || "Paid";
}

function emptyState(title, message) {
    return `<div class="empty-state"><h3>${h(title)}</h3><p>${h(message)}</p></div>`;
}

function getMyRegistration(eventId) {
    return state.registrations.find((item) => item.event._id === eventId);
}

function statusPill(status) {
    const normalized = ["approved", "rejected"].includes(status) ? status : "pending";
    return `<span class="status-pill status-${normalized}">${h(normalized)}</span>`;
}

function setSession(user, token) {
    state.user = user;
    state.token = token || "";
    if (token && user) {
        localStorage.setItem("campusToken", token);
        localStorage.setItem("campusUser", JSON.stringify(user));
    } else {
        localStorage.removeItem("campusToken");
        localStorage.removeItem("campusUser");
        state.registrations = [];
        state.approvalGroups = [];
    }
    renderSession();
}

function dashboardPath() {
    return state.user?.role === "admin" ? "/admin-dashboard.html" : "/student-dashboard.html";
}

function renderSession() {
    const loggedIn = Boolean(state.token && state.user);
    document.querySelectorAll(".private-section, .admin-section").forEach((item) => item.classList.add("hidden"));
    document.querySelectorAll(".private-nav").forEach((item) => {
        item.classList.toggle("hidden", !loggedIn);
        item.setAttribute("href", dashboardPath());
    });
    els.openLoginButton.classList.toggle("hidden", loggedIn);
    els.openSignupButton.classList.toggle("hidden", loggedIn);
    els.userMenu.classList.toggle("hidden", !loggedIn);

    if (loggedIn) {
        els.userInitial.textContent = state.user.name.charAt(0).toUpperCase();
        els.headerUserName.textContent = state.user.name;
        els.studentGreeting.textContent = `${state.user.name}'s registrations`;
    }

    renderEvents();
    renderMyRegistrations();
    renderAdminRequests();
}

function renderEvents() {
    const search = els.eventSearch.value.trim().toLowerCase();
    const category = els.categoryFilter.value;
    const price = els.priceFilter.value;
    const events = state.events.filter((event) => {
        const searchable = `${event.title} ${event.club} ${event.location} ${event.category}`.toLowerCase();
        return (!search || searchable.includes(search))
            && (!category || event.category === category)
            && (!price || (event.registration_mode || "free") === price);
    });

    if (!events.length) {
        els.eventGrid.innerHTML = emptyState(
            state.events.length ? "No matching events" : "The calendar is ready",
            state.events.length ? "Try a different search or filter." : "Campus events published by your admin will appear here."
        );
        return;
    }

    els.eventGrid.innerHTML = events.map((event, index) => {
        const registration = getMyRegistration(event._id);
        const label = registration ? registration.registration.status : "View event";
        return `
            <article class="event-card">
                <div class="event-cover">
                    <img src="${h(getEventImage(event, index))}" alt="${h(event.title)} cover image">
                    <span class="cover-badge">${h(event.category || "Campus")}</span>
                    <span class="price-tag">${h(formatPrice(event))}</span>
                </div>
                <div class="event-card-body">
                    <div class="event-meta">
                        <span class="event-date">${h(formatDate(event.date))}</span>
                        <span class="event-location">${h(event.location || "Venue TBA")}</span>
                    </div>
                    <h3>${h(event.title)}</h3>
                    <div class="event-card-footer">
                        <span class="host">${h(event.club || "Campus team")}</span>
                        <button class="mini-action" data-action="view-event" data-event-id="${h(event._id)}" type="button">${h(label)} &rarr;</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderClubs() {
    els.clubCount.textContent = state.clubs.length;
    if (!state.clubs.length) {
        els.clubList.innerHTML = emptyState("Clubs are joining soon", "Your campus communities will be listed here.");
        return;
    }
    els.clubList.innerHTML = state.clubs.slice(0, 6).map((club) => `
        <article class="club-card">
            <span class="club-icon">${h(club.name.slice(0, 2).toUpperCase())}</span>
            <h3>${h(club.name)}</h3>
            <p>${h(club.description || "A student community on campus.")}</p>
            <small>${h(club.members?.length || 0)} members</small>
        </article>
    `).join("");
}

function renderAnnouncements() {
    els.announcementCount.textContent = state.announcements.length;
    if (!state.announcements.length) {
        els.announcementList.innerHTML = emptyState("No updates yet", "Important campus announcements will be collected here.");
        return;
    }
    els.announcementList.innerHTML = state.announcements.slice(0, 6).map((item) => `
        <article class="announcement-card">
            <small>${h(item.club || "General")} ${formatTimestamp(item.created_at) ? `&middot; ${h(formatTimestamp(item.created_at))}` : ""}</small>
            <h3>${h(item.title)}</h3>
            <p>${h(item.content)}</p>
        </article>
    `).join("");
}

function renderMyRegistrations() {
    const approved = state.registrations.filter((item) => item.registration.status === "approved").length;
    const pending = state.registrations.filter((item) => item.registration.status === "pending").length;
    els.myRegistrationCount.textContent = state.registrations.length;
    els.approvedCount.textContent = approved;
    els.pendingCount.textContent = pending;

    if (!state.registrations.length) {
        els.myRegistrationList.innerHTML = emptyState("No registrations yet", "Explore events and submit your first registration.");
        return;
    }

    els.myRegistrationList.innerHTML = state.registrations.map(({ event, registration }, index) => {
        const message = registration.status === "approved"
            ? "Approved. Your place is confirmed."
            : registration.status === "rejected"
                ? "This request was not approved."
                : "Submitted. Waiting for admin approval.";
        return `
            <article class="registration-card">
                <img src="${h(getEventImage(event, index))}" alt="${h(event.title)}">
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

function flattenApprovals() {
    return state.approvalGroups.flatMap((group) => group.registrations.map((registration) => ({
        event: group.event,
        registration,
    })));
}

function renderAdminRequests() {
    const requests = flattenApprovals();
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

function renderCategories() {
    const selected = els.categoryFilter.value;
    const categories = [...new Set(state.events.map((event) => event.category || "Campus"))].sort();
    els.categoryFilter.innerHTML = `<option value="">All categories</option>${categories
        .map((category) => `<option value="${h(category)}">${h(category)}</option>`)
        .join("")}`;
    els.categoryFilter.value = selected;
}

async function loadPublic() {
    const [events, clubs, announcements] = await Promise.all([
        api("/events"),
        api("/clubs"),
        api("/announcements"),
    ]);
    state.events = events;
    state.clubs = clubs;
    state.announcements = announcements;
    els.eventCount.textContent = events.length;
    els.heroEventCount.textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
    renderCategories();
    renderEvents();
    renderClubs();
    renderAnnouncements();
}

async function loadPrivate() {
    if (!state.token) return;
    state.registrations = await api("/events/my-registrations");
    if (state.user.role === "admin") {
        state.approvalGroups = await api("/admin/event-registrations");
    } else {
        state.approvalGroups = [];
    }
    renderMyRegistrations();
    renderAdminRequests();
    renderEvents();
}

async function refreshAll() {
    await loadPublic();
    if (state.token) {
        try {
            await loadPrivate();
        } catch (error) {
            if (/token|authorization|expired|missing/i.test(error.message)) {
                setSession(null, "");
                showToast("Your session expired. Please log in again.", true);
                return;
            }
            throw error;
        }
    }
}

function openModal(type) {
    const modal = type === "auth" ? els.authModal : els.eventModal;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeModal(type) {
    const modal = type === "auth" ? els.authModal : els.eventModal;
    modal.classList.add("hidden");
    if (els.authModal.classList.contains("hidden") && els.eventModal.classList.contains("hidden")) {
        document.body.classList.remove("modal-open");
    }
}

function showAuthTab(tab) {
    document.querySelectorAll(".auth-tab").forEach((button) => button.classList.toggle("active", button.dataset.authTab === tab));
    document.querySelectorAll(".auth-form").forEach((form) => form.classList.toggle("active", form.dataset.authForm === tab));
    openModal("auth");
}

function openEvent(eventId) {
    const event = state.events.find((item) => item._id === eventId);
    if (!event) return;
    const registration = getMyRegistration(eventId)?.registration;
    const isPaid = event.registration_mode === "paid";
    const qrUrl = safeUrl(event.payment_qr_url, "", true);
    let registrationArea = "";

    if (registration) {
        const message = registration.status === "approved"
            ? "Approved. Your place at this event is confirmed."
            : registration.status === "rejected"
                ? "This registration was not approved."
                : "Your request is with the admin team. Check your dashboard for the approval update.";
        registrationArea = `<div class="empty-state">${statusPill(registration.status)}<h3>Registration ${h(registration.status)}</h3><p>${h(message)}</p></div>`;
    } else if (!state.token) {
        registrationArea = `
            <div class="modal-actions">
                <button class="button button-primary" data-open-auth="login" type="button">Log in to register</button>
            </div>
        `;
    } else {
        registrationArea = `
            ${isPaid ? `
                <div class="payment-box">
                    ${qrUrl ? `<img src="${h(qrUrl)}" alt="Payment scanner for ${h(event.title)}">` : ""}
                    <div>
                        <h3>Pay ${h(formatPrice(event))}</h3>
                        <p>Scan the payment code, complete the payment, then enter your transaction reference for admin verification.</p>
                        <input id="paymentReference" type="text" placeholder="Transaction reference" required>
                    </div>
                </div>
            ` : `<p class="modal-description">This is a free event. Submit your request and track the approval in your student dashboard.</p>`}
            <div class="modal-actions">
                <button class="button button-primary" data-action="register-event" data-event-id="${h(event._id)}" type="button">Submit registration</button>
            </div>
        `;
    }

    els.eventModalBody.innerHTML = `
        <img class="modal-cover" src="${h(getEventImage(event))}" alt="${h(event.title)}">
        <div class="modal-event-content">
            <p class="eyebrow">${h(event.category || "Campus event")}</p>
            <h2 id="eventModalTitle">${h(event.title)}</h2>
            <div class="modal-meta">
                <span class="info-pill">${h(formatDate(event.date))}</span>
                <span class="info-pill">${h(event.time || "Time TBA")}</span>
                <span class="info-pill">${h(event.location || "Venue TBA")}</span>
                <span class="info-pill">${h(formatPrice(event))}</span>
            </div>
            <p class="modal-description">${h(event.description || "More event details will be shared soon.")}</p>
            ${registrationArea}
        </div>
    `;
    openModal("event");
}

document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formData(form);
    try {
        const result = await api("/login", { method: "POST", body: JSON.stringify(payload) });
        setSession({ name: result.name, role: result.role, email: result.email || payload.email }, result.token);
        closeModal("auth");
        form.reset();
        window.location.assign(dashboardPath());
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        const result = await api("/register", { method: "POST", body: JSON.stringify(formData(form)) });
        form.reset();
        els.adminCodeField.classList.add("hidden");
        showAuthTab("login");
        showToast(result.message || "Account created. Log in to continue.");
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#eventForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        const payload = formData(form);
        const coverFile = document.querySelector("#eventCoverFile").files[0];
        const qrFile = document.querySelector("#paymentQrFile").files[0];
        if (coverFile) {
            if (coverFile.size > 1_500_000) {
                throw new Error("Event cover image must be smaller than 1.5 MB");
            }
            payload.image_url = await fileToDataUrl(coverFile);
        }
        if (qrFile) {
            if (qrFile.size > 1_500_000) {
                throw new Error("Scanner image must be smaller than 1.5 MB");
            }
            payload.payment_qr_url = await fileToDataUrl(qrFile);
        }
        const result = await api("/events", { method: "POST", body: JSON.stringify(payload) });
        form.reset();
        els.paymentFields.classList.add("hidden");
        document.querySelector("#eventCoverPreview").classList.add("hidden");
        document.querySelector("#eventCoverPreview").removeAttribute("src");
        document.querySelector("#paymentQrPreview").classList.add("hidden");
        document.querySelector("#paymentQrPreview").removeAttribute("src");
        await refreshAll();
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
        await loadPublic();
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
        await loadPublic();
        showToast(result.message || "Club created.");
    } catch (error) {
        showToast(error.message, true);
    }
});

document.body.addEventListener("click", async (event) => {
    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
        closeModal(closeButton.dataset.closeModal);
        return;
    }

    const authButton = event.target.closest("[data-open-auth]");
    if (authButton) {
        closeModal("event");
        showAuthTab(authButton.dataset.openAuth);
        return;
    }

    const tab = event.target.closest("[data-auth-tab]");
    if (tab) {
        showAuthTab(tab.dataset.authTab);
        return;
    }

    const adminTab = event.target.closest("[data-admin-tab]");
    if (adminTab) {
        document.querySelectorAll(".admin-tab").forEach((button) => button.classList.toggle("active", button === adminTab));
        document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === adminTab.dataset.adminTab));
        return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const { action, eventId, email, status } = actionButton.dataset;

    try {
        if (action === "view-event") {
            openEvent(eventId);
        }

        if (action === "register-event") {
            const paymentReference = document.querySelector("#paymentReference")?.value.trim() || "";
            const result = await api(`/events/${eventId}/register`, {
                method: "POST",
                body: JSON.stringify({ payment_reference: paymentReference }),
            });
            closeModal("event");
            await loadPrivate();
            showToast(result.message);
        }

        if (action === "review-registration") {
            const result = await api(`/events/${eventId}/registrations/status`, {
                method: "POST",
                body: JSON.stringify({ email, status }),
            });
            await refreshAll();
            showToast(result.message);
        }
    } catch (error) {
        showToast(error.message, true);
    }
});

els.eventSearch.addEventListener("input", renderEvents);
els.categoryFilter.addEventListener("change", renderEvents);
els.priceFilter.addEventListener("change", renderEvents);
els.openLoginButton.addEventListener("click", () => showAuthTab("login"));
els.openSignupButton.addEventListener("click", () => showAuthTab("signup"));
els.signupRole.addEventListener("change", () => els.adminCodeField.classList.toggle("hidden", els.signupRole.value === "student"));
els.registrationMode.addEventListener("change", () => els.paymentFields.classList.toggle("hidden", els.registrationMode.value !== "paid"));
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
document.querySelector("#logoutButton").addEventListener("click", () => {
    setSession(null, "");
    showToast("You are logged out.");
});
document.querySelector("#refreshAdminButton").addEventListener("click", async () => {
    try {
        await refreshAll();
        showToast("Approval queue refreshed.");
    } catch (error) {
        showToast(error.message, true);
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal("auth");
        closeModal("event");
    }
});

renderSession();
refreshAll().catch((error) => showToast(error.message, true));
if (new URLSearchParams(window.location.search).get("login") === "1") {
    showAuthTab("login");
}
