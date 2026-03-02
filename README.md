# Recipe App

**Live app:** [Try it here] https://recipe-app-fawn-six.vercel.app/ (when signing up may take upto 1 min for server to start up)

A modern recipe app with an **AI cooking assistant** you can talk to while you cook. Save recipes, plan meals, and get voice-powered help in the kitchen.

---

## About the app

- **Recipes** — Add and organize recipes (from URLs or manually), with ingredients and step-by-step instructions.
- **Cheffy AI** — Chat or use voice to ask questions about the recipe you’re cooking (e.g. substitutions, timing, techniques). Uses your current recipe as context.
- **Meal planning** — Plan your week with a simple drag-and-drop planner.
- **Profile & preferences** — Set dietary goals and preferences for a more personalized experience.

Built with **React**, **FastAPI**, **PostgreSQL** (with pgvector for semantic search), and **OpenAI** for the assistant. Deployed on **Vercel** (frontend) and **Render** (backend).

---

## 🚀 **Quick Start (developers)**

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- OpenAI API key (for AI features)
- ElevenLabs API key (for voice features)

### **Setup**
```bash
# Clone the repository
git clone <repository-url>
cd Recipe-App

# Backend setup
cd backend
pip install -r requirements.txt
python -m alembic upgrade head

# Frontend setup
cd ../frontend
npm install
npm run dev

# Start the backend server
cd ../backend
uvicorn backend.Apis.main:app --reload --host 0.0.0.0 --port 8000
```

## 📁 **Project Structure**

```
Recipe App/
├── backend/                 # FastAPI backend
│   ├── Apis/               # API endpoints
│   ├── database/           # Database models and config
│   ├── services/           # Business logic
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   └── public/             # Static assets
├── docs/                   # Documentation
│   ├── setup/              # Setup guides
│   ├── development/        # Development docs
│   └── debug/              # Debugging notes
├── performance/            # Performance testing tools
├── load_test_results/      # Load test reports
├── uploads/                # User uploads
└── migrations/             # Database migrations
```

## 🎯 **Key Features**

- **Recipe Management**: Create, edit, and organize recipes
- **AI Cooking Assistant**: Voice-powered cooking guidance
- **User Profiles**: Personalized preferences and dietary restrictions
- **Performance Optimized**: Supports 100+ concurrent users
- **Voice-First Design**: Optimized for hands-free cooking

## 📚 **Documentation**

- **Setup Guides**: `/docs/setup/` - API keys, AI assistant setup
- **Development**: `/docs/development/` - Component structure, CSS organization
- **Performance**: `/performance/` - Testing tools and optimization guides
- **Load Testing**: `/load_test_results/` - Performance reports and results

## 🧪 **Testing**

### **Performance Testing**
```bash
# Run performance tests
python performance/performance_test.py

# Run load tests
python load_test_results/run_load_test.py
```

### **Unit Tests**
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🔧 **Configuration**

See `/docs/setup/` for detailed configuration guides:
- **API Keys**: OpenAI, ElevenLabs setup
- **Database**: PostgreSQL configuration
- **Environment**: Environment variables setup

## 📊 **Performance**

- **Response Times**: <500ms for 95th percentile
- **Concurrent Users**: 100+ supported
- **Success Rate**: >99% under load
- **Database**: Optimized with indexes and connection pooling

## 🤝 **Contributing**

1. Check the development documentation in `/docs/development/`
2. Follow the component and CSS organization guidelines
3. Run performance tests before submitting changes
4. Update documentation as needed

## 📄 **License**

[Add your license information here]
