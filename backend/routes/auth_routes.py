from flask import Blueprint, jsonify, request

from services.auth_service import login_service, signup_service

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/signup", methods=["POST"])
@auth_bp.route("/register", methods=["POST"])
def signup():
    """
    Register a new user
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
            - password
          properties:
            name:
              type: string
              example: John Doe
            email:
              type: string
              example: john@example.com
            password:
              type: string
              example: password123
            role:
              type: string
              example: student
    responses:
      201:
        description: Registration successful
      400:
        description: Invalid request
    """

    response, status = signup_service(request.json)

    return jsonify(response), status


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Login user
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: john@example.com
            password:
              type: string
              example: password123
    responses:
      200:
        description: Login successful
      401:
        description: Wrong password
      404:
        description: User not found
    """

    response, status = login_service(request.json)

    return jsonify(response), status
