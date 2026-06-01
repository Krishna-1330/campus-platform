from database import announcements_collection
from models.announcement_model import create_announcement as build_announcement
from models.announcement_model import serialize_announcement
from utils.jwt_helper import get_user_by_email, has_role


def get_announcements_service():
    announcements = list(announcements_collection.find().sort("created_at", -1))
    return [serialize_announcement(announcement) for announcement in announcements], 200


def add_announcement_service(data, email):
    user = get_user_by_email(email)
    if not has_role(user, ["leader", "admin"]):
        return {"error": "Only leaders or admins can post announcements"}, 403

    if not data or not data.get("title") or not data.get("content"):
        return {"error": "Title and content are required"}, 400

    announcement = build_announcement(data, user["name"])
    result = announcements_collection.insert_one(announcement)

    return {
        "message": "Announcement posted successfully!",
        "id": str(result.inserted_id),
    }, 201
