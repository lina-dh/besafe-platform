# BeSafe Platform

BeSafe Platform is a web application developed as part of the **BeSafe Hackathon 2026**, organized by **QueenB** in collaboration with **AppsFlyer**.

The project explores how technology — and specifically AI-assisted interactions — can be used to improve **digital safety for youth**, with a focus on protecting and empowering **girls in the online space**.

---

## 🌍 Problem Statement

Young people spend a significant part of their lives online, where they are exposed to harassment, manipulation, and unsafe interactions.  
Girls and young women are particularly vulnerable in digital environments.

BeSafe was created to explore how a **conversation-based web experience** can help raise awareness, guide users, and encourage safer online behavior through thoughtful design and AI-assisted logic.

---

## 🚀 What We Built

- A **Web application** with a clean, accessible UI
- A **conversation-based AI layer** that responds based on carefully designed prompts
- Context-aware message flow that gives the chat a sense of continuity
- A modular structure prepared for future extension (e.g. SDK or integration into other platforms)

---

## 🧠 AI Layer – Design Approach

This project focuses on the **product and UX side of AI**, rather than low-level infrastructure.

The AI component was built by:

- Designing structured prompts
- Planning the conversation flow
- Managing contextual messages to maintain continuity across a session

This creates a chat experience that feels responsive and “aware”, without implementing heavy backend state or model training logic.

---

## 🛠️ Tech Stack

### Frontend

- React (Vite)
- JavaScript
- CSS

### Backend

- Node.js
- Express
- MVC architecture

### AI & Logic

- Prompt design
- Message structure & context handling
- OpenAI-based responses (with mock fallback for development)

### Tooling

- Git & GitHub
- npm
- Environment variable configuration with `.env`

---

## 📂 Project Structure

```text
besafe-platform/
├── client/                 // React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── assets/
│   └── index.html
│
├── server/                 // Express backend
│   ├── controllers/
│   ├── routes/
│   ├── utils/
│   │   └── prompts.js
│   ├── server.js
│   └── .env.example
│
└── README.md
```

---

## ⚙️ Installation

### Prerequisites

- **Node.js**
  Version 20.x or higher (latest LTS recommended)
  https://nodejs.org/en

- **npm**
  Version 10.x or higher
  Update with:
  ```bash
  npm install -g npm@latest --no-optional
  ```

### Clone the Repository

1. git clone https://github.com/so-ellie/besafe-platform.git
2. cd besafe-platform

### Server Setup

1. Navigate to the server directory: `cd server`
2. Install server dependencies: `npm install`
3. Run command: `npm run dev`

### Client Setup (in a new terminal)

1. Navigate to the client directory: `cd ../client`
2. Install client dependencies: `npm install`
3. Run command: `npm run dev`

---

## Configuration

### Environment Variables

Environment variables are used to configure your application without hardcoding sensitive information into your code. For this project, you need to set up the following environment variables in `.env` files located both in the `server` directory and `client` directory.

#### Configure the Backend (server)

Make a copy of the `.env.example` file under the `server` folder and name it `.env`. This file contains the following environment variables:

- `CLIENT_URL` - this should match the URL of the client, which is what you'll see at the address bar of your browser after running your client (via `npm start`).
  `PORT=your_server_port_here // Example: 5000
CLIENT_URL=your_client_url_here // Example: http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here`

#### Configure the Frontend (client)

Make a copy of the `.env.example` file under the `client` folder and name it `.env`.
This file contains the following environment variable (you don't need to touch them at this point):

- `VITE_SERVER_API_URL`: This variable contains the URL of your backend API. It tells your client where to send requests to interact with the server. By default, this should be set to http://localhost:5000/, but you should change it to match your server's actual URL if different (where 5000 is the `PORT` you defined in the server `.env` file above).
