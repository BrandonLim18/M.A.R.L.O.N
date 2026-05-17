# M.A.R.L.O.N. (Management and Access of Library Resources Online)

M.A.R.L.O.N. is a next-generation, full-stack Library Management System (LMS) designed to streamline school library operations. It features a robust Python/Django backend administration dashboard, a responsive React web ecosystem for borrowers, and a cross-platform React Native (Expo) mobile application. 

The crown jewel of the system is the **MARLON AI Library Assistant**, a localized Large Language Model (LLM) utilizing **Retrieval-Augmented Generation (RAG)** and **Dynamic Context Injection** to provide real-time database lookups, transactional status alerts, and automated catalog navigation for students.

---

## 🚀 Key Features

### 💻 1. Core Library Management System
* **Live Inventory Math:** Real-time stock increments and decrements as books are requested, approved, or returned.
* **Double-Booking Prevention:** Algorithmic safeguards blocking students from borrowing duplicate copies of active books.
* **Automated Transactions:** 3-tier status system (`Pending` $\rightarrow$ `Active` $\rightarrow$ `Returned`) managed directly via a secured administration console.
* **History Logging:** Immutable historical logs calculating exact overdue timelines through a unified `@property` schema.

### 🧠 2. MARLON AI Chatbot (Dynamic RAG System)
* **Student Account & Transaction Status:** Seamlessly tracks personal borrowed books, counts overdue timelines, and warns users of deadline penalties.
* **Smart Catalog & Fallback Search:** Cleans and tokenizes conversational user input, stripping punctuation to run complex keyword `Q()` queries matching titles, authors, or genres. Falls back to generating a top-5 broad inventory preview when generic terms are used.
* **Deterministic Guardrails:** Engineered system prompts that suppress hallucinations, keeping responses under 3 sentences and formatted inside scannable UI components.
* **UI Utilities:** Includes front-end quick-reply pill matrices and high-performance layout clearing routines.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Python 3.11+, Django, Django REST Framework | REST API Architecture, ORM, Permissions, Core Business Logic |
| **Web Frontend** | React, TypeScript, Tailwind CSS | Responsive Browser Ecosystem for Students and Borrowers |
| **Mobile App** | React Native, Expo, TypeScript | Cross-Platform Android/iOS Application |
| **AI Engine** | Ollama Engine (`qwen2.5:0.5b`) | Edge-Computing Local LLM Inference |
| **Database** | SQLite (Default development environment) | Relational Database Management System |

---

## 📂 Project Architecture

```text
E:\M.A.R.L.O.N>
│
├── Backend/                 # Django Core System
│   ├── borrow/              # App managing Books, Borrowings, and History logs
│   │   ├── models.py        # Relational database models (Book, Borrowing, History, etc.)
│   │   └── views.py         # Transaction logic and Dynamic Chatbot endpoints
│   └── manage.py
│
├── frontend/                # React Web Dashboard
│   └── src/
│       ├── components/      # UI Layouts (Chatbot.tsx with quick replies)
│       └── services/        # Web client API handlers
│
└── MobileApp/               # React Native (Expo) Client
    └── src/
        ├── components/      # Mobile UI Layouts (ChatbotModal.tsx)
        └── services/        # Mobile Axios/Fetch network layers


Here are the completed sections for your **Installation & Setup Guide**, **Database Schema Summary**, and **Security & Authorization Parameters**. You can directly append this text to the bottom of your existing markdown file.

---
```
## ⚙️ Installation & Setup Guide

### 1. Prerequisites

Ensure you have the following installed on your host system:

* **Python** (v3.10 or higher)
* **Node.js** (v18 or higher)
* **Git**
* **Ollama** (For local AI functionalities)

---

### 2. Backend Setup (Django)

1. Open a terminal instance and navigate to the backend folder:
```bash
cd Backend

```


2. Activate your Python virtual environment:
* **Windows (CMD):** `venv\Scripts\activate`
* **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
* **Mac/Linux:** `source venv/bin/activate`


3. Apply the structural database migrations to build your SQLite tables:
```bash
python manage.py makemigrations

```


```bash
python manage.py migrate

```


4. Create your master Administrator account (Superuser):
```bash
python manage.py createsuperuser

```


5. Boot up the local server, exposing it to your local network area:
```bash
python manage.py runserver 0.0.0.0:8000

```



---

### 3. Local AI Engine Setup (Ollama)

1. Open a separate, standalone terminal environment.
2. Pull and initialize the lightweight, optimized Qwen model:
```bash
ollama run qwen2.5:0.5b

```


3. Keep this terminal window minimized. Your Django view hooks into this local container process at `http://localhost:11434`.

---

### 4. Web Frontend Setup (React)

1. Open a new terminal instance and enter the directory:
```bash
cd frontend

```


2. Install the production node modules:
```bash
npm install

```


3. Boot the local development instance:
```bash
npm run dev

```



---

### 5. Mobile App Setup (React Native / Expo)

1. Navigate into the mobile root directory:
```bash
cd MobileApp

```


2. Fetch your local host machine's internal network address (`ipconfig` on Windows or `ifconfig` on Mac $\rightarrow$ Look for your **IPv4 Address**).
3. Open `src/services/api.ts` and update the base routing URL to match your host network string:
```typescript
const BASE_URL = 'http://192.168.1.X:8000/api'; // Replace with your actual IPv4 address

```


4. Install all native applications and packages:
```bash
npm install

```


5. Boot up the Expo network bundler:
```bash
npx expo start

```


6. Install the **Expo Go** app on your physical iOS or Android device, ensure your phone is connected to the exact same Wi-Fi network as your computer, and scan the terminal's QR code.

---

## 📊 Database Schema Summary

### 1. `Book` Model

Tracks physical literature data and manages live automated inventory logic.

* `title` / `author`: Structural identification text fields.
* `isbn`: 13-character system unique identifier.
* `genre`: Custom dropdown array selection based on `GENRE_CHOICES`.
* `copies_available` / `copies_borrowed`: Positive integers tracking algorithmic data modifications.
* `status`: Tracks availability conditions (`Available`, `Borrowed`, `Reserved`).

### 2. `Borrowing` Model

Maintains active library checkout profiles and structural user assignment mappings.

* `borrower_name` / `borrower_contact_number` / `borrower_email_address`: Contact metadata string layers matching active user authentication hooks.
* `book`: ForeignKey relational link to the target `Book` entry.
* `borrow_date` / `due_date` / `return_date`: Core handling dates for processing checkouts.
* `status`: Tracks application lifecycle parameters (`Pending`, `Active`, `Returned`).
* `@property def overdue_days`: Live model property calculation engine returning exact integer deltas between active date objects and expiration boundaries.

### 3. `History` Model

An immutable transaction lookup table evaluating structural check-in milestones.

* `transaction`: ForeignKey lookup tied to primary `Borrowing` events.
* `borrow_date` / `return_date`: Definitive metrics documenting checkout boundaries.

### 4. `KnowledgeBase` Model

* `text_content`: Text payload structure processing base rules, operating hours, structural layouts, and standard FAQs utilized by MARLON AI during prompt conditioning.

### 5. `ChatMessage` Model

* Tracks user interaction profiles, maintaining records of structural conversational histories utilizing relational `role` indicators (`user` / `assistant`).

---

## 🔒 Security & Authorization Parameters

The system handles endpoint accessibility using custom, multi-layered permission filters to cleanly separate standard Student Borrowers from Librarians.

### 🔑 Role-Based Access Controls (RBAC)

* **`IsAdmin`**: Restricts access explicitly to authenticated users where `request.user.role == 'admin'`. This permission locks down administrative features like approving pending borrow requests, marking books as returned, and handling dashboard deletion tasks.
* **`IsBorrower`**: Restricts access to standard accounts where `request.user.role == 'borrower'`, granting them permissions to use self-service operations such as requesting checkouts (`borrow_for_me`).
* **`IsAuthenticatedOrReadOnly`**: Open public catalog views (`GET` lists) while blocking destructive actions.

### 🛡️ AI Endpoint Protection

* **`ChatbotView` Security Layer**: The chatbot view uses strict `[IsAuthenticated]` permission classes. This ensures that only logged-in users can open WebSocket/HTTP connection lines to MARLON AI, allowing the system to securely fetch `request.user.email` and pass personal transaction contexts to the local LLM.
