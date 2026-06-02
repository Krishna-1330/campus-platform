from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId

from database import events_collection
from models.event_model import create_event as build_event
from models.event_model import serialize_event
from utils.jwt_helper import get_user_by_email, has_role


def get_events_service():
    events = list(events_collection.find())
    return [serialize_event(event) for event in events], 200


def get_event_service(event_id):
    event, error = _find_event(event_id)
    if error:
        return error

    return serialize_event(event), 200


def create_event_service(data, email):
    user = get_user_by_email(email)
    if not has_role(user, ["leader", "admin"]):
        return {"error": "Only leaders or admins can create events"}, 403

    if not data or not data.get("title") or not data.get("date"):
        return {"error": "Title and date are required"}, 400

    if data.get("registration_mode") == "paid":
        if not data.get("price") or not data.get("payment_qr_url"):
            return {"error": "Paid events require a price and payment scanner image URL"}, 400

    event = build_event(data, email)
    result = events_collection.insert_one(event)

    return {
        "message": "Event created successfully!",
        "event_id": str(result.inserted_id),
    }, 201


def register_for_event_service(event_id, user_email, data=None):
    event, error = _find_event(event_id)
    if error:
        return error

    if user_email in event.get("registered", []):
        return {"error": "You are already registered for this event"}, 400

    registrations = event.get("registrations", [])
    if any(registration.get("email") == user_email for registration in registrations):
        return {"error": "Your registration request is already submitted"}, 400

    data = data or {}
    is_paid = event.get("registration_mode") == "paid"
    payment_reference = data.get("payment_reference", "").strip()
    if is_paid and not payment_reference:
        return {"error": "Enter your payment transaction reference"}, 400

    registration = {
        "email": user_email,
        "status": "pending",
        "payment_reference": payment_reference,
        "submitted_at": datetime.utcnow(),
    }
    events_collection.update_one(
        {"_id": event["_id"]},
        {"$push": {"registrations": registration}},
    )

    return {"message": "Registration submitted! You will see the approval update in your dashboard."}, 200


def get_my_registrations_service(user_email):
    events = events_collection.find(
        {
            "$or": [
                {"registrations.email": user_email},
                {"registered": user_email},
            ]
        }
    )
    registrations = []

    for event in events:
        matching_registration = next(
            (
                registration
                for registration in event.get("registrations", [])
                if registration.get("email") == user_email
            ),
            None,
        )
        if not matching_registration:
            matching_registration = {
                "email": user_email,
                "status": "approved",
                "payment_reference": "",
            }

        registrations.append(
            {
                "event": serialize_event(event),
                "registration": matching_registration,
            }
        )

    return registrations, 200


def get_registration_requests_service(approver_email):
    approver = get_user_by_email(approver_email)
    if not has_role(approver, ["admin"]):
        return {"error": "Only admins can review event registrations"}, 403

    events = events_collection.find({"registrations.0": {"$exists": True}})
    return [
        {
            "event": serialize_event(event),
            "registrations": event.get("registrations", []),
        }
        for event in events
    ], 200


def update_registration_status_service(event_id, approver_email, data):
    approver = get_user_by_email(approver_email)
    if not has_role(approver, ["admin"]):
        return {"error": "Only admins can review event registrations"}, 403

    if not data or not data.get("email") or data.get("status") not in ["approved", "rejected"]:
        return {"error": "Email and a valid approval status are required"}, 400

    event, error = _find_event(event_id)
    if error:
        return error

    student_email = data["email"].lower()
    registration = next(
        (
            registration
            for registration in event.get("registrations", [])
            if registration.get("email") == student_email
        ),
        None,
    )
    if not registration:
        return {"error": "Registration request not found"}, 404

    update = {
        "$set": {
            "registrations.$.status": data["status"],
            "registrations.$.reviewed_by": approver_email,
            "registrations.$.reviewed_at": datetime.utcnow(),
        }
    }
    if data["status"] == "approved":
        update["$addToSet"] = {"registered": student_email}
    else:
        update["$pull"] = {"registered": student_email}

    events_collection.update_one(
        {"_id": event["_id"], "registrations.email": student_email},
        update,
    )

    return {"message": f"Registration {data['status']} successfully!"}, 200


def _find_event(event_id):
    try:
        event = events_collection.find_one({"_id": ObjectId(event_id)})
    except InvalidId:
        return None, ({"error": "Invalid event ID"}, 400)

    if not event:
        return None, ({"error": "Event not found"}, 404)

    return event, None
