from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

mongodb = MongoDB()

async def connect_to_mongo():
    mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
    mongodb.database = mongodb.client[settings.MONGODB_DB_NAME]
    
    await mongodb.database.users.create_index("email", unique=True)
    await mongodb.database.users.create_index("api_key", unique=True)
    await mongodb.database.images.create_index("user_id")
    await mongodb.database.embeddings.create_index("face_id", unique=True)

async def close_mongo_connection():
    mongodb.client.close()

def get_database():
    return mongodb.database

def get_user_collection():
    return mongodb.database.users

def get_image_collection():
    return mongodb.database.images

def get_embedding_collection():
    return mongodb.database.embeddings