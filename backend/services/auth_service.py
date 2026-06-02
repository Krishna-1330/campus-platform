import bcrypt

from config import Config
from database import users_collection
from models.user_model import create_user
from utils.jwt_helper import generate_token


def signup_service(data):
    if not data or not data.get("name") or not data.get("email") or not data.get("password"):
        return {"error": "Name, email and password are required"}, 400

    name = data["name"]
    email = data["email"].lower()
    password = data["password"]
    role = data.get("role", "student").lower()

    if role not in ["student", "leader", "admin"]:
        return {"error": "Choose a valid account type"}, 400

    if role != "student":
        if not Config.ADMIN_SIGNUP_CODE or data.get("admin_code") != Config.ADMIN_SIGNUP_CODE:
            return {"error": "A valid staff access code is required"}, 403

    if users_collection.find_one({"email": email}):
        return {"error": "Email already registered"}, 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    users_collection.insert_one(create_user(name, email, hashed_password, role))

    return {"message": "Registration successful!"}, 201


def login_service(data):
    if not data or not data.get("email") or not data.get("password"):
        return {"error": "Email and password are required"}, 400

    email = data["email"].lower()
    password = data["password"]

    user = users_collection.find_one({"email": email})
    if not user:
        return {"error": "User not found"}, 404

    stored_password = user["password"]
    if isinstance(stored_password, str):
        stored_password = stored_password.encode("utf-8")

    if not bcrypt.checkpw(password.encode("utf-8"), stored_password):
        return {"error": "Wrong password"}, 401

    return {
        "message": "Login successful!",
        "token": generate_token(user["email"]),
        "role": user["role"],
        "name": user["name"],
        "email": user["email"],
    }, 200


register_service = signup_service
