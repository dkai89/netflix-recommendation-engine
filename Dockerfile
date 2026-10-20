FROM python:3.13-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package requirements first
COPY requirements.txt .

# Install the required Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend, frontend and saved model files
COPY app.py .
COPY frontend ./frontend
COPY models ./models

# Expose the FastAPI application port
EXPOSE 8000

# Start the FastAPI server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
