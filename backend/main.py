from fastapi import FastAPI, HTTPException
import os
import requests
import time
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Guacamole API Wrapper")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configuration
GUAC_URL = os.getenv("GUAC_URL", "http://localhost:8080/guacamole")
GUAC_USERNAME = os.getenv("GUAC_USERNAME", "guacadmin")
GUAC_PASSWORD = os.getenv("GUAC_PASSWORD", "guacadmin")
GUAC_DATASOURCE = os.getenv("GUAC_DATASOURCE", "postgresql")

# Global token cache
guac_token = None
token_expiry = 0


def login_guacamole():
    """Login to Guacamole and get an auth token."""
    global guac_token, token_expiry
    try:
        res = requests.post(
            f"{GUAC_URL}/api/tokens",
            data={"username": GUAC_USERNAME, "password": GUAC_PASSWORD},
            timeout=5
        )
        res.raise_for_status()
        data = res.json()
        guac_token = data["authToken"]
        # Tokens usually last ~60 minutes, so we refresh slightly early
        token_expiry = time.time() + 55 * 60
        print(f"✅ Logged into Guacamole as {GUAC_USERNAME}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log in: {e}")


def get_token():
    """Return a valid Guacamole token, refreshing if necessary."""
    global guac_token, token_expiry
    if not guac_token or time.time() >= token_expiry:
        login_guacamole()
    return guac_token


def guac_request(endpoint: str):
    """Perform an authenticated GET request to Guacamole."""
    token = get_token()
    url = f"{GUAC_URL}/api/{endpoint}"
    headers = {"Guacamole-Token": token}
    try:
        res = requests.get(url, headers=headers, timeout=5)
        # If token expired mid-request, re-login once
        if res.status_code == 403:
            login_guacamole()
            token = guac_token
            headers["Guacamole-Token"] = token
            res = requests.get(url, headers=headers, timeout=5)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Guacamole request failed: {e}")


@app.on_event("startup")
def startup_event():
    """Login once at startup."""
    login_guacamole()


@app.get("/")
def root():
    return {"status": "backend up", "guacamole": GUAC_URL}


@app.get("/users")
def list_users():
    """List all Guacamole users."""
    data = guac_request(f"session/data/{GUAC_DATASOURCE}/users")
    return {"users": list(data.keys())}


@app.get("/connections")
def list_connections():
    """List all available connections."""
    data = guac_request(f"session/data/{GUAC_DATASOURCE}/connections")
    return {"connections": data}
