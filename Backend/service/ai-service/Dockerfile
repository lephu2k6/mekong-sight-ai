FROM python:3.9-slim

WORKDIR /app

COPY Backend/service/ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend/service/ai-service/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
