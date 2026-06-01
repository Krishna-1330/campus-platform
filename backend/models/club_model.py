def create_club(name, description, leader_email):
    return {
        "name": name,
        "description": description,
        "leader": leader_email,
        "members": [leader_email],
        "pending": [],
    }


def serialize_club(club):
    if not club:
        return None

    club = dict(club)
    club["_id"] = str(club["_id"])
    return club

