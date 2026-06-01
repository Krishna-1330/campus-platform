from flask import Blueprint, jsonify, request

from middleware.jwt_middleware import token_required
from services.event_service import (
    create_event_service,
    get_event_service,
    get_events_service,
    register_for_event_service,
)

events_bp = Blueprint("events_bp", __name__)


@events_bp.route("/events", methods=["GET"])
def get_events():
    """
    Get all events
    ---
    tags:
      - Events
    responses:
      200:
        description: List of events
    """

    response, status = get_events_service()

    return jsonify(response), status


@events_bp.route("/events", methods=["POST"])
@token_required
def create_event():
    """
    Create an event
    ---
    tags:
      - Events
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
            - date
          properties:
            title:
              type: string
              example: Tech Fest
            description:
              type: string
              example: Annual technology event
            date:
              type: string
              example: 2026-06-10
            time:
              type: string
              example: 10:00 AM
            location:
              type: string
              example: Auditorium
            club:
              type: string
              example: Coding Club
    responses:
      201:
        description: Event created
      403:
        description: Only leaders or admins can create events
    """

    response, status = create_event_service(
        request.json,
        request.user_email
    )

    return jsonify(response), status


@events_bp.route("/events/<event_id>/register", methods=["POST"])
@token_required
def register_for_event(event_id):
    """
    Register for an event
    ---
    tags:
      - Events
    security:
      - Bearer: []
    parameters:
      - in: path
        name: event_id
        required: true
        type: string
    responses:
      200:
        description: Registered successfully
      404:
        description: Event not found
    """

    response, status = register_for_event_service(
        event_id,
        request.user_email
    )

    return jsonify(response), status


@events_bp.route("/events/<event_id>", methods=["GET"])
def get_event(event_id):
    """
    Get one event
    ---
    tags:
      - Events
    parameters:
      - in: path
        name: event_id
        required: true
        type: string
    responses:
      200:
        description: Event details
      404:
        description: Event not found
    """

    response, status = get_event_service(event_id)

    return jsonify(response), status
