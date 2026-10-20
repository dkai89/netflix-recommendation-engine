
// Step 2: Set the API address.
// We will connect this to the running FastAPI server later.
const API_BASE_URL = "";

// Step 3: Configure pagination.
const PAGE_SIZE = 12;
let currentPage = 0;
let totalMovies = 0;
let currentQuery = "";

// Step 4: Get HTML elements.
const movieGrid = document.getElementById("movieGrid");
const movieCount = document.getElementById("movieCount");
const pageInfo = document.getElementById("pageInfo");
const statusMessage = document.getElementById("statusMessage");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");

// Step 5: Fetch one page of movies from the API.
async function loadMovies() {
    movieGrid.replaceChildren();
    statusMessage.textContent = "Loading movies...";

    try {
        const params = new URLSearchParams({
            skip: String(currentPage * PAGE_SIZE),
            limit: String(PAGE_SIZE)
        });

        // Add a search term only when the user enters one.
        if (currentQuery) {
            params.set("q", currentQuery);
        }

        const response = await fetch(
            `${API_BASE_URL}/movies?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("The movie API returned an error.");
        }

        const data = await response.json();
        totalMovies = data.total_movies;

        // Update the catalog count.
        movieCount.textContent =
            `${totalMovies.toLocaleString()} movies found`;

        // Create a card for each movie returned by the API.
        data.movies.forEach((movie, index) => {
            const card = document.createElement("article");
            card.className = "movie-card";

            const number = document.createElement("span");
            number.className = "movie-number";
            number.textContent =
                `MOVIE ${currentPage * PAGE_SIZE + index + 1}`;

            const title = document.createElement("h3");
            title.textContent = movie.title;

            const year = document.createElement("p");
            year.className = "movie-year";
            year.textContent = movie.year ?? "Year unavailable";

            card.append(number, title, year);
            movieGrid.appendChild(card);
        });

        // Update pagination controls.
        const totalPages = Math.ceil(totalMovies / PAGE_SIZE);

        pageInfo.textContent =
            `Page ${totalMovies === 0 ? 0 : currentPage + 1} of ${totalPages}`;

        previousButton.disabled = currentPage === 0;
        nextButton.disabled =
            (currentPage + 1) * PAGE_SIZE >= totalMovies;

        statusMessage.textContent = data.movies.length
            ? ""
            : "No matching movies found. Try another search.";

    } catch (error) {
        // Explain connection errors to the user.
        statusMessage.textContent =
            "Could not connect to the movie API. Please check that the API server is running.";
        console.error(error);
    }
}

// Step 6: Search when the Search button is clicked.
searchButton.addEventListener("click", () => {
    currentQuery = searchInput.value.trim();
    currentPage = 0;
    loadMovies();
});

// Step 7: Allow searching by pressing Enter.
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchButton.click();
    }
});

// Step 8: Load the previous page.
previousButton.addEventListener("click", () => {
    if (currentPage > 0) {
        currentPage--;
        loadMovies();
    }
});

// Step 9: Load the next page.
nextButton.addEventListener("click", () => {
    if ((currentPage + 1) * PAGE_SIZE < totalMovies) {
        currentPage++;
        loadMovies();
    }
});

// Step 10: Load the first page when the script starts.
loadMovies();


// Step 11: Get the recommendation section elements.
const customerIdInput = document.getElementById("customerIdInput");
const recommendButton = document.getElementById("recommendButton");
const recommendationGrid = document.getElementById("recommendationGrid");
const recommendationStatus = document.getElementById("recommendationStatus");

// Step 12: Request recommendations when the button is clicked.
recommendButton.addEventListener("click", async () => {
    const customerId = customerIdInput.value.trim();

    // Validate the customer ID before sending the request.
    if (!customerId || Number(customerId) <= 0) {
        recommendationStatus.textContent = "Please enter a valid Customer ID.";
        return;
    }

    recommendationGrid.replaceChildren();
    recommendationStatus.textContent = "Finding your recommendations...";
    recommendButton.disabled = true;

    try {
        // Call the FastAPI recommendation endpoint.
        const response = await fetch(
            `${API_BASE_URL}/recommend/${encodeURIComponent(customerId)}?top_n=5`
        );

        const data = await response.json();

        // Display API errors in the page.
        if (!response.ok) {
            throw new Error(data.detail || "Could not load recommendations.");
        }

        // Create a card for each recommended movie.
        data.recommendations.forEach((movie, index) => {
            const card = document.createElement("article");
            card.className = "movie-card";

            const number = document.createElement("span");
            number.className = "movie-number";
            number.textContent = `TOP PICK ${index + 1}`;

            const title = document.createElement("h3");
            title.textContent = movie.title;

            const rating = document.createElement("p");
            rating.className = "movie-year";
            rating.textContent = `Predicted rating: ${movie.predicted_rating} / 5`;

            card.append(number, title, rating);
            recommendationGrid.appendChild(card);
        });

        recommendationStatus.textContent =
            `Top ${data.recommendations_count} recommendations for Customer ${data.customer_id}`;

    } catch (error) {
        recommendationStatus.textContent = error.message;
    } finally {
        // Re-enable the button after the request finishes.
        recommendButton.disabled = false;
    }
});

// Step 13: Allow Enter to submit the Customer ID.
customerIdInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        recommendButton.click();
    }
});
