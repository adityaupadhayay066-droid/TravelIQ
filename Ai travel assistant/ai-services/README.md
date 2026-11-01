# 🧠 TravelIQ AI Services Microservice

> High-throughput Python microservice built with **FastAPI**, **scikit-learn**, and **Google Gemini** for delay forecasting, dynamic fare estimation, station crowd density predictions, and semantic knowledge retrieval (RAG).

---

## 🚀 Key Capabilities

1. **Transit Delay Prediction:**
   - Supervised regression models predicting arrival delay (in minutes) based on train schedule, historical punctuality, regional corridor, day-of-week, and weather features.
2. **Dynamic Fare Forecast:**
   - Multi-variate pricing models forecasting demand surge, seasonal factors, and travel-class premiums across Indian Railway routes.
3. **Station Crowd & Platform Occupancy:**
   - Classification models estimating rush-hour congestion levels (Low, Moderate, High, Critical) across major Indian terminals.
4. **Retrieval-Augmented Generation (RAG):**
   - Contextual vector retrieval over verified transit rules, refund policies, and tatkal booking regulations.
   - Grounded LLM generation using active Gemini models (`gemini-3.5-flash-lite`, `gemini-3.8-flash`).
5. **Internal Service Authentication:**
   - Inter-service endpoints are secured with `X-Internal-Service-Key` header verification.

---

## 📁 Directory Architecture

```
ai-services/
├── main.py                     # FastAPI application entry point & API endpoints
├── rag_engine.py               # RAG document retriever & Gemini grounding engine
├── routing.py                  # NetworkX graph-based multi-modal routing algorithms
├── train_models.py             # Model training pipelines for delay, fare, and crowd
├── generate_data.py            # Synthetic transit telemetry generator
├── data_cleaner.py             # Feature normalization & preprocessing utilities
├── transport_schema.py         # Pydantic request / response validation schemas
├── models/                     # Serialized scikit-learn model artifacts (.pkl)
│   ├── delay_model.pkl
│   ├── fare_model.pkl
│   ├── crowd_model.pkl
│   └── label_encoders.pkl
├── tests/                      # Automated security & ML validation tests
│   └── test_security_and_metrics.py
├── requirements.txt            # Python dependencies
└── Dockerfile                  # Containerization specification
```

---

## 🛠️ Setup & Installation

### 1. Create Virtual Environment
```bash
# Windows PowerShell:
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in `ai-services/`:
```env
PORT=8000
INTERNAL_SERVICE_KEY=your_internal_service_key_matching_backend
GEMINI_API_KEY=your_gemini_api_key
```

### 4. (Optional) Retrain Machine Learning Models
```bash
python generate_data.py
python train_models.py
```

### 5. Start the Microservice
```bash
python main.py
```
*(Or run with Uvicorn: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`)*

The service will be live at: **`http://localhost:8000`**  
Interactive Swagger API documentation: **`http://localhost:8000/docs`**

---

## 🧪 Testing & Verification

Run the automated Pytest test suite:
```bash
python -m pytest tests/test_security_and_metrics.py
```
*Validates:*
- Internal service authentication enforcement (`X-Internal-Service-Key`).
- Delay prediction schema constraints and reasonable error boundaries.
- Fare forecasting regression bounds.
- Crowd classification probability distributions.
- Semantic RAG vector retrieval accuracy.

