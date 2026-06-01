from database import attendance_collection
from models.attendance_model import create_attendance_record
from models.attendance_model import serialize_attendance
from utils.jwt_helper import get_user_by_email, has_role


def mark_attendance_service(data, email):
    user = get_user_by_email(email)
    if not has_role(user, ["leader", "admin"]):
        return {"error": "Only leaders or admins can mark attendance"}, 403

    if not data or not data.get("event_id") or not data.get("student_email"):
        return {"error": "event_id and student_email are required"}, 400

    existing = attendance_collection.find_one(
        {
            "event_id": data["event_id"],
            "student_email": data["student_email"],
        }
    )
    if existing:
        return {"error": "Attendance already marked for this student"}, 400

    attendance_collection.insert_one(create_attendance_record(data, email))

    return {"message": "Attendance marked successfully!"}, 201


def get_attendance_service(event_id=None, student_email=None):
    filter_query = {}

    if event_id:
        filter_query["event_id"] = event_id

    if student_email:
        filter_query["student_email"] = student_email

    records = list(attendance_collection.find(filter_query))
    return [serialize_attendance(record) for record in records], 200
