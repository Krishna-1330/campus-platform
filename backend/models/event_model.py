def create_event(data, created_by):
    return {
        "title": data["title"],
        "description": data.get("description", ""),
        "date": data["date"],
        "time": data.get("time", ""),
        "location": data.get("location", ""),
        "club": data.get("club", ""),
        "created_by": created_by,
        "registered": [],
    }


def serialize_event(event):
    if not event:
        return None

    event = dict(event)
    event["_id"] = str(event["_id"])
    return event

