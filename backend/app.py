import os

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database import test_connection
from routes.announcement_routes import announcements_bp
from routes.attendance_routes import attendance_bp
from routes.auth_routes import auth_bp
from routes.club_routes import clubs_bp
from routes.event_routes import events_bp
from swagger.swagger_config import swagger_config, swagger_template

try:
    from flasgger import Swagger
except ImportError:
    Swagger = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "frontend"))
if not os.path.exists(os.path.join(FRONTEND_DIR, "index.html")):
    FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.config.from_object(Config)

CORS(app)
JWTManager(app)
if Swagger:
    Swagger(app, config=swagger_config, template=swagger_template)

app.register_blueprint(auth_bp)
app.register_blueprint(clubs_bp)
app.register_blueprint(events_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(announcements_bp)


@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/health")
def health():
    return {"message": "Campus Platform API is running!"}


@app.route("/app-routes")
def app_routes():
    return {
        "frontend_dir": FRONTEND_DIR,
        "routes": sorted(str(rule) for rule in app.url_map.iter_rules()),
    }


if __name__ == "__main__":
    test_connection()

    print("Starting Campus Platform backend...")
    print("API running at: http://localhost:5000")

    port = int(os.getenv("PORT", "5000"))
    app.run(debug=True, host="0.0.0.0", port=port)
