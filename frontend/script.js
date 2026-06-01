const API_BASE = window.location.protocol === "file:" ? "http://localhost:5000" : window.location.origin;

const state = {
    token: localStorage.getItem("campusToken") || "",
    user: JSON.parse(localStorage.getItem("campusUser") || "null"),
    clubs: [],
    events: [],
    announcements: [],
};

const els = {
    toast: document.querySelector("#toast"),
    sessionStatus: document.querySelector("#sessionStatus"),
    clubCount: document.querySelector("#clubCount"),
    eventCount: document.querySelector("#eventCount"),
    announcementCount: document.querySelector("#announcementCount"),
    clubList: document.querySelector("#clubList"),
    eventList: document.querySelector("#eventList"),
    announcementList: document.querySelector("#announcementList"),
    attendanceList: document.querySelector("#attendanceList"),
};

function showToast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.toggle("error", isError);
    els.toast.classList.add("show");
    window.setTimeout(() => els.toast.classList.remove("show"), 3200);
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
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
    }
    return data;
}

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function setSession(user, token) {
    state.user = user;
    state.token = token || "";

    if (token) {
        localStorage.setItem("campusToken", token);
        localStorage.setItem("campusUser", JSON.stringify(user));
    } else {
        localStorage.removeItem("campusToken");
        localStorage.removeItem("campusUser");
    }

    renderSession();
}

function renderSession() {
    if (!state.token || !state.user) {
        els.sessionStatus.textContent = "Not logged in";
        return;
    }
    els.sessionStatus.textContent = `${state.user.name} signed in as ${state.user.role}`;
}

function empty(message) {
    return `<p class="empty-state">${message}</p>`;
}

function renderClubs() {
    els.clubCount.textContent = state.clubs.length;
    if (!state.clubs.length) {
        els.clubList.innerHTML = empty("No clubs yet. Create one after logging in as leader or admin.");
        return;
    }

    els.clubList.innerHTML = state.clubs.map((club) => `
        <article class="data-card">
            <h3>${club.name}</h3>
            <p>${club.description || "No description added."}</p>
            <span class="badge">Leader: ${club.leader}</span>
            <span class="badge">${club.members?.length || 0} members</span>
            <span class="badge">${club.pending?.length || 0} pending</span>
            <div class="data-card-footer">
                <button class="mini-button" data-action="join-club" data-id="${club._id}">Join</button>
                <button class="mini-button ghost-button" data-action="approve-club" data-id="${club._id}">Approve pending</button>
            </div>
        </article>
    `).join("");
}

function renderEvents() {
    els.eventCount.textContent = state.events.length;
    if (!state.events.length) {
        els.eventList.innerHTML = empty("No events scheduled yet.");
        return;
    }

    els.eventList.innerHTML = state.events.map((event) => `
        <article class="data-card">
            <h3>${event.title}</h3>
            <p>${event.description || "No description added."}</p>
            <span class="badge">${event.date || "No date"}</span>
            <span class="badge">${event.time || "Time TBA"}</span>
            <span class="badge">${event.location || "Location TBA"}</span>
            <span class="badge">ID: ${event._id}</span>
            <div class="data-card-footer">
                <button class="mini-button" data-action="register-event" data-id="${event._id}">Register</button>
            </div>
        </article>
    `).join("");
}

function renderAnnouncements() {
    els.announcementCount.textContent = state.announcements.length;
    if (!state.announcements.length) {
        els.announcementList.innerHTML = empty("No announcements posted yet.");
        return;
    }

    els.announcementList.innerHTML = state.announcements.map((item) => `
        <article class="data-card">
            <h3>${item.title}</h3>
            <p>${item.content}</p>
            <span class="badge">${item.club || "General"}</span>
            <span class="badge">By ${item.posted_by || "Campus team"}</span>
        </article>
    `).join("");
}

function renderAttendance(records) {
    if (!records.length) {
        els.attendanceList.innerHTML = empty("No attendance records found.");
        return;
    }

    els.attendanceList.innerHTML = records.map((record) => `
        <article class="data-card">
            <h3>${record.student_email}</h3>
            <p class="muted">Event ID: ${record.event_id}</p>
            <span class="badge">${record.status || "present"}</span>
            <span class="badge">${record.date || "No date"}</span>
        </article>
    `).join("");
}

async function loadDashboard() {
    const [clubs, events, announcements] = await Promise.all([
        api("/clubs"),
        api("/events"),
        api("/announcements"),
    ]);

    state.clubs = clubs;
    state.events = events;
    state.announcements = announcements;

    renderClubs();
    renderEvents();
    renderAnnouncements();
}

document.querySelector("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formData(form);

    try {
        const result = await api("/register", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        showToast(result.message || "Account created");
        form.reset();
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formData(form);

    try {
        const result = await api("/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        setSession({ name: result.name, role: result.role, email: payload.email }, result.token);
        showToast(result.message || "Logged in");
        form.reset();
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#logoutButton").addEventListener("click", () => {
    setSession(null, "");
    showToast("Logged out");
});

document.querySelector("#refreshButton").addEventListener("click", async () => {
    try {
        await loadDashboard();
        showToast("Dashboard refreshed");
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#clubForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        const result = await api("/clubs", {
            method: "POST",
            body: JSON.stringify(formData(form)),
        });
        showToast(result.message || "Club created");
        form.reset();
        await loadDashboard();
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#eventForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        const result = await api("/events", {
            method: "POST",
            body: JSON.stringify(formData(form)),
        });
        showToast(result.message || "Event created");
        form.reset();
        await loadDashboard();
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#announcementForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        const result = await api("/announcements", {
            method: "POST",
            body: JSON.stringify(formData(form)),
        });
        showToast(result.message || "Announcement posted");
        form.reset();
        await loadDashboard();
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#attendanceForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
        const result = await api("/attendance", {
            method: "POST",
            body: JSON.stringify(formData(form)),
        });
        showToast(result.message || "Attendance marked");
        form.reset();
    } catch (error) {
        showToast(error.message, true);
    }
});

document.querySelector("#loadAttendanceButton").addEventListener("click", async () => {
    const eventId = document.querySelector("#attendanceEventFilter").value.trim();
    const query = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";

    try {
        const records = await api(`/attendance${query}`);
        renderAttendance(records);
    } catch (error) {
        showToast(error.message, true);
    }
});

document.body.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    try {
        if (action === "join-club") {
            const result = await api(`/clubs/${id}/join`, { method: "POST", body: "{}" });
            showToast(result.message || "Join request sent");
        }

        if (action === "approve-club") {
            const email = window.prompt("Student email to approve");
            if (!email) return;
            const result = await api(`/clubs/${id}/approve`, {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            showToast(result.message || "Member approved");
        }

        if (action === "register-event") {
            const result = await api(`/events/${id}/register`, { method: "POST", body: "{}" });
            showToast(result.message || "Registered for event");
        }

        await loadDashboard();
    } catch (error) {
        showToast(error.message, true);
    }
});

renderSession();
loadDashboard().catch((error) => showToast(error.message, true));
