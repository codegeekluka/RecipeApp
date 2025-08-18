import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Navbar from './components/layout/NavBar.jsx'
import MyRecipes from './pages/MyRecipes.jsx'
import RecipePage from './pages/RecipePage.jsx'
import AddRecipePage from './pages/AddRecipePage.jsx'
import Cheffy from './pages/Cheffy.jsx'
import PrivateRoute from './components/layout/PrivateRoute.jsx'
import ScrollToTop from './components/layout/ScrollToTop.jsx'

function App() {
  
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />}/>
        <Route path="/register" element={<Signup />}/>
        <Route path="/home" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
          }
        />
        <Route path="/recipe/:slug" element={
          <PrivateRoute>
            <RecipePage />
          </PrivateRoute>
          }
        />
        <Route path="/MyRecipes" element={
          <PrivateRoute>
            <MyRecipes />
          </PrivateRoute>
          }
        />
        <Route path="/add-recipe" element={
          <PrivateRoute>
            <AddRecipePage />
          </PrivateRoute>
          }
        />
        <Route path="/cheffy" element={
          <PrivateRoute>
            <Cheffy />
          </PrivateRoute>
          }
        />
      </Routes>
      
    </>
  )
}

export default App

/*
===================================================
MASTER PROMPT: FRONTEND FOR AI CHEF ASSISTANT
===================================================
GOAL:
Implement a chat-like, voice-enabled AI chef assistant interface.
This will connect to the FastAPI backend that handles:
- GPT-4o-mini responses with recipe context
- Hybrid retrieval (structured + semantic)
- Session memory
- STT (speech-to-text) and TTS (text-to-speech)

=================
UI REQUIREMENTS:
=================
1. **Chat Interface**
   - Scrollable chat window (list of messages: user vs AI).
   - Support for both text input and voice input.
   - AI responses can be displayed as text and optionally played as audio.

2. **Controls**
   - Text input box with submit button.
   - Microphone button to start/stop recording voice queries.
   - Playback button if AI sends audio output.

3. **Session Awareness**
   - Track the current `session_id` for the cooking session.
   - Keep local conversation state synced with backend history.
   - Reset UI if user starts a new recipe.

4. **Responsive Design**
   - Use TailwindCSS for mobile-first, responsive layout.
   - Keep buttons large and touch-friendly for kitchen use.

=================
STATE MANAGEMENT:
=================
Use Zustand for lightweight state management:
- `sessionId` (string or null)
- `messages` (array of { role: "user" | "assistant", text: string, audioUrl?: string })
- `currentRecipe` (object with title, ingredients, steps)
- `isRecording` (boolean for mic status)
- `isPlayingAudio` (boolean for audio playback state)

=================
INTEGRATIONS:
=================
1. **Backend API Calls**
   - `/start_session` (POST): starts a cooking session with a given recipe_id.
   - `/ask` (POST): sends a text or audio message, receives AI text + optional audio.
   - `/upload_audio` (POST): sends recorded audio to Whisper STT for transcription.

2. **Speech-to-Text (STT)**
   - Option A: Use Web Speech API (zero-cost, less accurate) for real-time transcription.
   - Option B: Record audio in browser (MediaRecorder API) and send to backend `/upload_audio` for Whisper API transcription.

3. **Text-to-Speech (TTS)**
   - Option A: Play AI’s audio file returned by backend.
   - Option B: Use Web Speech API’s speechSynthesis for quick, low-latency speech.

=================
WORKFLOW:
=================
- On "Begin Cooking":
  1. Call `/start_session` with recipe_id.
  2. Store `sessionId` in Zustand.
  3. Load recipe details into state.

- On user message (text or audio):
  1. If text: POST to `/ask` with message + sessionId.
  2. If audio: record, send to `/upload_audio`, get transcription, then send transcription to `/ask`.
  3. Append AI’s text (and audio if provided) to chat state.
  4. Scroll chat window to bottom.

- On AI response:
  1. Render text in chat bubble.
  2. If audioUrl is provided, auto-play (toggleable in settings).

=================
PROMPT ENGINEERING RULES (FRONTEND SIDE):
=================
- Never send the entire chat history blindly; rely on backend to manage token limits.
- Always include `sessionId` in requests.
- If voice mode is active, prioritize minimal latency (show transcribed text immediately, then update if corrected by backend).

=================
DEVELOPMENT TASKS:
=================
Step 1: Create Zustand store for assistant state.
Step 2: Build chat UI with CSS (bubbles, scrollable container, fixed input bar).
Step 3: Add text input + mic recording component.
Step 4: Implement backend API calls with `fetch` or `axios`.
Step 5: Handle STT via backend Whisper endpoint.
Step 6: Handle TTS via Web Speech API.
Step 7: Add mobile responsiveness and kitchen-friendly design tweaks.
Step 8: Test full flow with backend session + retrieval logic.

End of Master Prompt
===================================================
*/
