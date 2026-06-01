from pymongo import MongoClient

from config import Config

client = MongoClient(Config.MONGO_URI)
db = client[Config.DB_NAME]

users_collection = db["users"]
clubs_collection = db["clubs"]
events_collection = db["events"]
attendance_collection = db["attendance"]
announcements_collection = db["announcements"]


def test_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully!")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False

