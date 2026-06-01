from flask import Blueprint, jsonify, request

from middleware.jwt_middleware import token_required
from services.attendance_service import (
    get_attendance_service,
    mark_attendance_service,
)

attendance_bp = Blueprint("attendance_bp", __name__)


@attendance_bp.route("/attendance", methods=["POST"])
@token_required
def mark_attendance():
    """
    Mark attendance
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - event_id
            - student_email
          properties:
            event_id:
              type: string
              example: 665a1234567890abcdef1234
            student_email:
              type: string
              example: student@example.com
            date:
              type: string
              example: 2026-05-30
            status:
              type: string
              example: present
    responses:
      201:
        description: Attendance marked
      403:
        description: Only leaders or admins can mark attendance
    """

    response, status = mark_attendance_service(
        request.json,
        request.user_email
    )

    return jsonify(response), status


@attendance_bp.route("/attendance", methods=["GET"])
@token_required
def get_attendance():
    """
    Get attendance records
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - in: query
        name: event_id
        required: false
        type: string
      - in: query
        name: student_email
        required: false
        type: string
    responses:
      200:
        description: List of attendance records
    """

    response, status = get_attendance_service(
        request.args.get("event_id"),
        request.args.get("student_email")
    )

    return jsonify(response), status
