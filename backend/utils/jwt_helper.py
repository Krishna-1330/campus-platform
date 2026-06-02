from flask_jwt_extended import create_access_token

from database import users_collection


def generate_token(email):
    return create_access_token(identity=email)


def get_user_by_email(email):
    return users_collection.find_one({"email": email})


def has_role(user, allowed_roles):
    return bool(user and user.get("role") in allowed_roles)

