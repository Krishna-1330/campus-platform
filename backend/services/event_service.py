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

    event = build_event(data, email)
    result = events_collection.insert_one(event)

    return {
        "message": "Event created successfully!",
        "event_id": str(result.inserted_id),
    }, 201


def register_for_event_service(event_id, user_email):
    event, error = _find_event(event_id)
    if error:
        return error

    if user_email in event.get("registered", []):
        return {"error": "You are already registered for this event"}, 400

    events_collection.update_one(
        {"_id": event["_id"]},
        {"$push": {"registered": user_email}},
    )

    return {"message": "Successfully registered for the event!"}, 200


def _find_event(event_id):
    try:
        event = events_collection.find_one({"_id": ObjectId(event_id)})
    except InvalidId:
        return None, ({"error": "Invalid event ID"}, 400)

    if not event:
        return None, ({"error": "Event not found"}, 404)

    return event, None
