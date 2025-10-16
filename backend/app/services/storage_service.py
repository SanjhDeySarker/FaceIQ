import os
import uuid
from typing import Optional
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.use_s3 = settings.USE_S3
        self.local_storage_path = settings.LOCAL_STORAGE_PATH
        
        if self.use_s3 and settings.AWS_ACCESS_KEY_ID:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.bucket_name = settings.AWS_S3_BUCKET
        else:
            self.use_s3 = False
        
        if not os.path.exists(self.local_storage_path):
            os.makedirs(self.local_storage_path)
    
    async def upload_file(self, file_content: bytes, file_extension: str, user_id: str) -> str:
        file_name = f"{uuid.uuid4()}{file_extension}"
        
        if self.use_s3:
            s3_key = f"uploads/{user_id}/{file_name}"
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=file_content,
                    ContentType='image/jpeg'
                )
                return s3_key
            except ClientError as e:
                raise Exception(f"S3 upload failed: {e}")
        else:
            user_dir = os.path.join(self.local_storage_path, user_id)
            if not os.path.exists(user_dir):
                os.makedirs(user_dir)
            
            file_path = os.path.join(user_dir, file_name)
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            return file_path
    
    async def get_file_url(self, storage_key: str) -> str:
        if self.use_s3:
            try:
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': storage_key},
                    ExpiresIn=3600
                )
                return url
            except ClientError:
                return ""
        else:
            return storage_key

storage_service = StorageService()