from datetime import date


def create_attendance_record(data, marked_by):
    return {
        "event_id": data["event_id"],
        "student_email": data["student_email"],
        "marked_by": marked_by,
        "date": data.get("date", str(date.today())),
        "status": data.get("status", "present"),
    }


def serialize_attendance(record):
    if not record:
        return None

    record = dict(record)
    record["_id"] = str(record["_id"])
    return record

