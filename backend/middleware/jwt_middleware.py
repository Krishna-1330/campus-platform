from functools import wraps

from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity


def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            email = get_jwt_identity()
            request.user_email = email
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Invalid or missing token", "details": str(e)}), 401
    return wrapper
