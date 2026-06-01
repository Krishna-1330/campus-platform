import bcrypt

from database import users_collection
from models.user_model import create_user
from utils.jwt_helper import generate_token


def signup_service(data):
    if not data or not data.get("name") or not data.get("email") or not data.get("password"):
        return {"error": "Name, email and password are required"}, 400

    name = data["name"]
    email = data["email"].lower()
    password = data["password"]
    role = data.get("role", "student")

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
    }, 200


register_service = signup_service

