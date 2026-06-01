def create_user(name, email, hashed_password, role="student"):
    return {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role,
        "clubs": [],
    }


def serialize_user(user):
    if not user:
        return None

    user = dict(user)
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    return user

