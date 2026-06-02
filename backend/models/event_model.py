from datetime import datetime


def create_event(data, created_by):
    registration_mode = "paid" if data.get("registration_mode") == "paid" else "free"

    return {
        "title": data["title"],
        "description": data.get("description", ""),
        "date": data["date"],
        "time": data.get("time", ""),
        "location": data.get("location", ""),
        "club": data.get("club", ""),
        "category": data.get("category", "Campus"),
        "image_url": data.get("image_url", ""),
        "registration_mode": registration_mode,
        "price": data.get("price", "") if registration_mode == "paid" else "",
        "payment_qr_url": data.get("payment_qr_url", "") if registration_mode == "paid" else "",
        "capacity": data.get("capacity", ""),
        "created_by": created_by,
        "registered": [],
        "registrations": [],
        "created_at": datetime.utcnow(),
    }


def serialize_event(event, include_registrations=False):
    if not event:
        return None

    event = dict(event)
    event["_id"] = str(event["_id"])
    registrations = event.get("registrations", [])
    legacy_registered = event.get("registered", [])
    approved_emails = {
        registration["email"]
        for registration in registrations
        if registration.get("email") and registration.get("status") == "approved"
    }
    approved_emails.update(legacy_registered)
    event["registration_count"] = len(approved_emails)
    event["pending_count"] = sum(
        registration.get("status") == "pending"
        for registration in registrations
    )

    if not include_registrations:
        event.pop("registered", None)
        event.pop("registrations", None)

    return event
