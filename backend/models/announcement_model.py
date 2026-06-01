from datetime import datetime


def create_announcement(data, posted_by):
    return {
        "title": data["title"],
        "content": data["content"],
        "posted_by": posted_by,
        "club": data.get("club", "General"),
        "created_at": datetime.utcnow(),
    }


def serialize_announcement(announcement):
    if not announcement:
        return None

    announcement = dict(announcement)
    announcement["_id"] = str(announcement["_id"])
    return announcement

