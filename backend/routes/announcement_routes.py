from flask import Blueprint, jsonify, request

from middleware.jwt_middleware import token_required
from services.announcement_service import (
    add_announcement_service,
    get_announcements_service,
)

announcements_bp = Blueprint("announcements_bp", __name__)


@announcements_bp.route("/announcements", methods=["GET"])
def get_announcements():
    """
    Get all announcements
    ---
    tags:
      - Announcements
    responses:
      200:
        description: List of announcements
    """

    response, status = get_announcements_service()

    return jsonify(response), status


@announcements_bp.route("/announcements", methods=["POST"])
@token_required
def add_announcement():
    """
    Add an announcement
    ---
    tags:
      - Announcements
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - title
            - content
          properties:
            title:
              type: string
              example: Meeting
            content:
              type: string
              example: Club meeting at 4 PM
            club:
              type: string
              example: General
    responses:
      201:
        description: Announcement posted
      403:
        description: Only leaders or admins can post announcements
    """

    response, status = add_announcement_service(
        request.json,
        request.user_email
    )

    return jsonify(response), status
