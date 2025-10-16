# 🧠 FaceIQ — AI-Powered Face Detection & Comparison SaaS

**FaceIQ** is a cloud-based SaaS platform for intelligent **face detection**, **face comparison**, and **facial metadata analysis**.  
It provides developers and businesses with a simple API and dashboard to **analyze, compare, and verify faces** with customizable confidence thresholds — all built with cutting-edge AI.

---

## 🚀 Features

- 🧩 **Face Detection** – Detect multiple faces with bounding boxes, landmarks, and confidence scores.  
- 🔍 **Face Comparison** – Verify whether two faces match with a user-defined confidence threshold.  
- 📊 **Face Metadata** – Extract useful attributes such as confidence, quality, and optional demographic info.  
- ☁️ **SaaS API** – RESTful API for easy integration with your own apps.  
- 🔑 **User Authentication** – Secure login and API key access via JWT.  
- ⚙️ **Threshold Customization** – Define match criteria per user (e.g., 70%–90%).  
- 💾 **Image Storage** – Store user uploads and embeddings in MongoDB / AWS S3.  
- 🧱 **Scalable Architecture** – Built with Python (FastAPI), React, and MongoDB.  

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React + TailwindCSS + ShadCN/UI |
| **Backend** | FastAPI (Python 3.11+) |
| **Database** | MongoDB (async with Motor) |
| **AI/ML** | DeepFace / InsightFace for embeddings |
| **Storage** | AWS S3 or GridFS (fallback) |
| **Auth** | JWT or API Key |
| **Containerization** | Docker + Docker Compose |

---

## 📂 Project Structure

