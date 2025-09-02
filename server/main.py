from fastapi import FastAPI
from controllers.user_controllers import user_routes
from fastapi.middleware.cors import CORSMiddleware
from utils.create_admin import create_admin

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
create_admin()
app.include_router(user_routes)
@app.get("/")
def root():
    return {"message": "Hello World"}