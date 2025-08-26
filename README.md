# MultiSportApp: AI-Powered Multi-Sport Tracking Platform

Welcome to MultiSportApp! This application aggregates events across multiple niches—ESports, Formula 1, skiing, soccer, hiking, American football, tennis, trail running, recreational running, and track running—and uses AI to deliver personalized recommendations. Users can view upcoming events in an interactive calendar, explore trending streams and activities, and easily purchase tickets via external links.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Running Locally](#running-locally)
- [Event Tickets](#event-tickets)
- [API Integrations](#api-integrations)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **Multi-Niche Aggregation**: Pull events from TicketMaster, Meetup, Twitch, SportsData.io, and more.
- **AI-Driven Recommendations**: Personalized event suggestions using user profiles, local weather, and trending data.
- **Interactive Calendar**: Responsive month/week/day calendar view with filters by interest.
- **Community Feedback**: Users can rate and comment on events to improve future recommendations.
- **External Ticket Links**: Each sports event listing includes a direct link to purchase tickets from trusted providers—no in-house ticketing needed.
- **Responsive Design**: Mobile and desktop-friendly UI built with React and Tailwind CSS.
- **Modular & Extensible**: Easily add new event sources or niches by following provided integration patterns.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, Tailwind CSS, FullCalendar.io
- **AI/ML**: Python, scikit-learn
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Heroku or DigitalOcean App Platform

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (v16+) & npm (v8+)
- Python (3.10+) & `venv`
- Git

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/OliverPerrin/MultiSportApp.git
    cd MultiSportApp
    ```

2.  **Backend setup**
    ```sh
    cd backend
    python -m venv venv
    source venv/bin/activate   # macOS/Linux
    # venv\Scripts\activate    # Windows
    pip install -r requirements.txt
    ```

3.  **Frontend setup**
    ```sh
    cd ../frontend
    npm install
    ```

4.  **Start services with Docker**
    This will build and start the backend, database, and any other services defined in `docker-compose.yml`.
    ```sh
    docker-compose up --build
    ```

### Environment Variables

Create a `.env` file in the `backend/` directory and add your secret keys. These are required for the backend service to connect to the database and external APIs.

```env
DATABASE_URL=postgresql://user:password@db:5432/events
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_secret
SPORTSDATA_API_KEY=your_sportsdata_key
OPENWEATHER_API_KEY=your_openweather_key
JWT_SECRET=your_jwt_secret
```

> **Note:** Do not commit the `.env` file. It's recommended to add `.env` to your `.gitignore` file and use a secrets manager in production environments.

## Usage

### Running Locally

1.  **Ensure Docker Compose is running**:
    This keeps the backend and database services active.
    ```sh
    docker-compose up
    ```

2.  **In another terminal, start the React development server**:
    ```sh
    cd frontend
    npm start
    ```

3.  Visit `http://localhost:3000` in your browser to see the application, create a profile, and explore events!

## Event Tickets

For all sporting events (F1, soccer, football, tennis, etc.), we list schedules with direct “Buy Tickets” links to providers like Ticketmaster or StubHub. We do not handle any ticketing in-house.

| Event                | Date       | Venue        | Tickets     |
| -------------------- | ---------- | ------------ | ----------- |
| Australian GP        | 2025-03-21 | Albert Park  | Buy Tickets |
| Premier League Match | 2025-08-17 | Old Trafford | Get Tickets |

## API Integrations

- **Eventbrite**: Public event listings
- **Twitch**: Live esports streams
- **SportsData.io**: Sports schedules (free tier)
- **OpenWeatherMap**: Outdoor activity suggestions
- **Custom Scrapers**: Niche sources without APIs

See `docs/api_integrations.md` for full specifications.

## Project Structure

```
MultiSportApp/
├── backend/            # FastAPI service
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example    # Example environment variables
├── frontend/           # React app
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── README.md
└── docs/               # Design docs, wireframes, API specs
```

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes and commit them (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeature`).
5.  Open a Pull Request.

Please follow our Code of Conduct and Contributing Guide.

## License

This project is under the GNU License. See `LICENSE` for details.

## Contact

Maintainer: Oliver Perrin (@OliverPerrin)

Feel free to open issues or reach out with questions!