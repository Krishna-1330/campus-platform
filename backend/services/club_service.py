from bson import ObjectId
from bson.errors import InvalidId

from database import clubs_collection
from models.club_model import create_club as build_club
from models.club_model import serialize_club
from utils.jwt_helper import get_user_by_email, has_role


def get_clubs_service():
    clubs = list(clubs_collection.find())
    return [serialize_club(club) for club in clubs], 200


def get_club_service(club_id):
    club, error = _find_club(club_id)
    if error:
        return error

    return serialize_club(club), 200


def create_club_service(data, email):
    user = get_user_by_email(email)
    if not has_role(user, ["leader", "admin"]):
        return {"error": "Only leaders or admins can create clubs"}, 403

    if not data or not data.get("name"):
        return {"error": "Club name is required"}, 400

    if clubs_collection.find_one({"name": data["name"]}):
        return {"error": "Club with this name already exists"}, 400

    club = build_club(data["name"], data.get("description", ""), email)
    result = clubs_collection.insert_one(club)

    return {
        "message": "Club created successfully!",
        "club_id": str(result.inserted_id),
    }, 201


def join_club_service(club_id, user_email):
    club, error = _find_club(club_id)
    if error:
        return error

    if user_email in club.get("members", []):
        return {"error": "You are already a member"}, 400

    if user_email in club.get("pending", []):
        return {"error": "Your join request is already pending"}, 400

    clubs_collection.update_one(
        {"_id": club["_id"]},
        {"$push": {"pending": user_email}},
    )

    return {"message": "Join request sent! Waiting for approval."}, 200


def approve_member_service(club_id, approver_email, data):
    approver = get_user_by_email(approver_email)

    if not data or not data.get("email"):
        return {"error": "Email of the user to approve is required"}, 400

    member_email = data["email"]
    club, error = _find_club(club_id)
    if error:
        return error

    is_leader = approver_email == club["leader"]
    is_admin = approver and approver.get("role") == "admin"
    if not is_leader and not is_admin:
        return {"error": "Only the club leader can approve members"}, 403

    if member_email not in club.get("pending", []):
        return {"error": "No pending request from this user"}, 400

    clubs_collection.update_one(
        {"_id": club["_id"]},
        {
            "$pull": {"pending": member_email},
            "$push": {"members": member_email},
        },
    )

    return {"message": f"{member_email} approved and added to the club!"}, 200


def _find_club(club_id):
    try:
        club = clubs_collection.find_one({"_id": ObjectId(club_id)})
    except InvalidId:
        return None, ({"error": "Invalid club ID"}, 400)

    if not club:
        return None, ({"error": "Club not found"}, 404)

    return club, None
