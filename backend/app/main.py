from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import emails_router, health_router, items_router

app = FastAPI(title="Backend Exercise API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(emails_router)
app.include_router(items_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
