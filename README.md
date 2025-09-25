# Big Brain APP
This is a quiz app where admin can create a game and start a session while players can join the session to answer questions to get their results.

## Backend Setup

```bash
cd backend
nvm use 18.19.0
npm install
npm start
```
Backend is provided by unsw course comp6080. It is constructed by Express.js and Swagger UI.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## APP Detail
### 1. Admin Auth
login register & logout features.

### 2. Admin Creating & Editing a Game
A dashboard page is used to display all games, all games can be edit and all questions of all games can be edit as well.

### 3. Admin Start, Stop, Results of game session
Game admin can start stop a game session, all players' results will be registered in the session.

### 4. Player join and play game session
Players can join and play a game session by a url from game admin.

### 5. Results display
Game sessions' results will be displayed.

## Authors
Yiming LU & Tracie Duong (https://facebook.com/tracie.duong.92)