from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.MONGO_DB]


# Collections
users_collection = db.get_collection("users")
images_collection = db.get_collection("images")
faces_collection = db.get_collection("faces")
embeddings_collection = db.get_collection("embeddings")
settings_collection = db.get_collection("settings")