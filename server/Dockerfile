FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to the system's PATH. The installer places it in /root/.local/bin.
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Create virtual environment and install dependencies
COPY requirements.txt .
RUN uv venv env && \
    . env/bin/activate && \
    uv pip install -r requirements.txt

# Copy application code
COPY . .

# Make the virtual environment activate script executable
RUN chmod +x env/bin/activate

EXPOSE 8000

# Use the virtual environment to run the application
CMD ["/bin/bash", "-c", "source env/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000"]
