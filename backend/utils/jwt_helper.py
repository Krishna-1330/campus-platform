from flask_jwt_extended import create_access_token

from database import users_collection


def generate_token(email):
    """Generate JWT access token for the given email."""
    return create_access_token(identity=email)


def get_user_by_email(email):
    """Fetch user document from DB by email."""
    return users_collection.find_one({"email": email})


def has_role(user, allowed_roles):
    """Check if user has one of the allowed roles."""
    if not user:
        return False
    return user.get("role") in allowed_roles
