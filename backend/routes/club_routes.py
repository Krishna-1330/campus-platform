from flask import Blueprint, jsonify, request

from middleware.jwt_middleware import token_required
from services.club_service import (
    approve_member_service,
    create_club_service,
    get_club_service,
    get_clubs_service,
    join_club_service,
)

clubs_bp = Blueprint("clubs_bp", __name__)


@clubs_bp.route("/clubs", methods=["GET"])
def get_clubs():
    """
    Get all clubs
    ---
    tags:
      - Clubs
    responses:
      200:
        description: List of clubs
    """

    response, status = get_clubs_service()

    return jsonify(response), status


@clubs_bp.route("/clubs", methods=["POST"])
@token_required
def create_club():
    """
    Create a club
    ---
    tags:
      - Clubs
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: Coding Club
            description:
              type: string
              example: Club for coding and hackathons
    responses:
      201:
        description: Club created
      403:
        description: Only leaders or admins can create clubs
    """

    response, status = create_club_service(
        request.json,
        request.user_email
    )

    return jsonify(response), status


@clubs_bp.route("/clubs/<club_id>/join", methods=["POST"])
@token_required
def join_club(club_id):
    """
    Request to join a club
    ---
    tags:
      - Clubs
    security:
      - Bearer: []
    parameters:
      - in: path
        name: club_id
        required: true
        type: string
    responses:
      200:
        description: Join request sent
      404:
        description: Club not found
    """

    response, status = join_club_service(
        club_id,
        request.user_email
    )

    return jsonify(response), status


@clubs_bp.route("/clubs/<club_id>/approve", methods=["POST"])
@token_required
def approve_member(club_id):
    """
    Approve a pending club member
    ---
    tags:
      - Clubs
    security:
      - Bearer: []
    parameters:
      - in: path
        name: club_id
        required: true
        type: string
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
          properties:
            email:
              type: string
              example: student@example.com
    responses:
      200:
        description: Member approved
      403:
        description: Not allowed
    """

    response, status = approve_member_service(
        club_id,
        request.user_email,
        request.json
    )

    return jsonify(response), status


@clubs_bp.route("/clubs/<club_id>", methods=["GET"])
def get_club(club_id):
    """
    Get one club
    ---
    tags:
      - Clubs
    parameters:
      - in: path
        name: club_id
        required: true
        type: string
    responses:
      200:
        description: Club details
      404:
        description: Club not found
    """

    response, status = get_club_service(club_id)

    return jsonify(response), status
