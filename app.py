
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Define the project and data directories
PROJECT_DIR = Path(__file__).resolve().parent
DATA_DIR = PROJECT_DIR / "models"
FRONTEND_DIR = PROJECT_DIR / "frontend"

# Load the saved model and movie data
model = joblib.load(DATA_DIR / "svd_model.pkl")
movie_titles = pd.read_pickle(DATA_DIR / "movie_titles.pkl")
trained_movie_ids = joblib.load(DATA_DIR / "trained_movie_ids.pkl")
ratings = pd.read_pickle(DATA_DIR / "final_ratings.pkl")

# Create the FastAPI application
app = FastAPI(title="Netflix Recommendation API")

# Serve the homepage
@app.get("/")
def homepage():
    return FileResponse(FRONTEND_DIR / "index.html")

# Serve CSS and JavaScript files
app.mount(
    "/static",
    StaticFiles(directory=str(FRONTEND_DIR)),
    name="static"
)

# Return movie catalog pages and search results
@app.get("/movies")
def get_movies(
    q: str = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100)
):
    movies = movie_titles.copy()

    if q:
        movies = movies[
            movies["Name"].str.contains(
                q, case=False, na=False, regex=False
            )
        ]

    total = len(movies)
    movies = movies.iloc[skip:skip + limit]

    movie_list = []
    for _, movie in movies.iterrows():
        year = movie["Year"]
        movie_list.append({
            "movie_id": int(movie["Movie_ID"]),
            "year": int(year) if pd.notna(year) else None,
            "title": str(movie["Name"])
        })

    return {
        "total_movies": total,
        "skip": skip,
        "limit": limit,
        "movies": movie_list
    }

# Generate personalized recommendations
@app.get("/recommend/{customer_id}")
def recommend_movies(
    customer_id: int,
    top_n: int = Query(default=5, ge=1, le=12)
):
    customer_ratings = ratings[
        ratings["Cust_Id"] == customer_id
    ]

    if customer_ratings.empty:
        raise HTTPException(
            status_code=404,
            detail="Customer not found in the training data"
        )

    rated_movies = set(
        customer_ratings["Movie_ID"].astype(int)
    )

    recommendations = []

    for movie_id in trained_movie_ids:
        movie_id = int(movie_id)

        if movie_id not in rated_movies:
            prediction = model.predict(customer_id, movie_id)

            recommendations.append({
                "movie_id": movie_id,
                "predicted_rating": round(float(prediction.est), 2)
            })

    recommendations.sort(
        key=lambda item: item["predicted_rating"],
        reverse=True
    )

    titles_lookup = movie_titles.set_index("Movie_ID")["Name"]

    for movie in recommendations[:top_n]:
        movie["title"] = str(
            titles_lookup.get(movie["movie_id"], "Unknown Movie")
        )

    return {
        "customer_id": customer_id,
        "recommendations_count": min(
            top_n, len(recommendations)
        ),
        "recommendations": recommendations[:top_n]
    }
