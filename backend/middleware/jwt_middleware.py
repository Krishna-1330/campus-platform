from functools import wraps

from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


def token_required(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        request.user_email = get_jwt_identity()
        request.user_id = request.user_email
        return route_function(*args, **kwargs)

    return wrapper

