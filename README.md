# AI-Powered Multi-Sport Tracking Platform

Welcome to the **AI-Powered Multi-Sport Tracking Platform**! This application aggregates events across multiple niches—ESports, Formula 1, skiing, soccer, hiking, American football, tennis, trail running, recreational running, and track running—and uses AI to deliver personalized recommendations. Users can view upcoming events in an interactive calendar, explore trending streams and activities, and easily purchase tickets via external links.

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started](#getting-started)  
   - [Prerequisites](#prerequisites)  
   - [Installation](#installation)  
   - [Environment Variables](#environment-variables)  
4. [Usage](#usage)  
   - [Running Locally](#running-locally)  
   - [Event Tickets](#event-tickets)  
5. [API Integrations](#api-integrations)  
6. [Project Structure](#project-structure)  
7. [Contributing](#contributing)  
8. [License](#license)  
9. [Contact](#contact)

---

## Features

- **Multi-Niche Aggregation**: Pull events from Eventbrite, Twitch, SportsData.io, and more.  
- **AI-Driven Recommendations**: Personalized event suggestions using user profiles, local weather, and trending data.  
- **Interactive Calendar**: Responsive month/week/day calendar view with filters by interest.  
- **Community Feedback**: Users can rate and comment on events to improve future recommendations.  
- **External Ticket Links**: Each sports event listing includes a direct link to purchase tickets from trusted providers—no in-house ticketing needed.  
- **Responsive Design**: Mobile and desktop-friendly UI built with React and Tailwind CSS.  
- **Modular & Extensible**: Easily add new event sources or niches by following provided integration patterns.

---

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL  
- **Frontend**: React, Tailwind CSS, FullCalendar.io  
- **AI/ML**: Python, scikit-learn  
- **Containerization**: Docker, Docker Compose  
- **CI/CD**: GitHub Actions  
- **Deployment**: Heroku or DigitalOcean App Platform

---

## Getting Started

### Prerequisites

- Docker & Docker Compose  
- Node.js (v16+) & npm (v8+)  
- Python (3.10+) & virtualenv  
- Git

### Installation

1. **Clone the repo**  
	```bash
 	git clone https://github.com/yourusername/multi-event-calendar.git
 	cd multi-event-calendar

2. **Backend setutup
	```bash
   	cd backend
   	python -m venv venv
   	source venv/bin/activate   # macOS/Linux
  	venv\Scripts\activate      # Windows
   	pip install -r requirements.txt
 
3. **Frontend setup
   	```bash
    	cd ../frontend
	npm install
    
4. **Start services with Docker
	```bash
 	docker-compose up --build

---
 
### Environmental Variables

Create a .env in backend/:

 	DATABASE_URL=postgresql://user:password@db:5432/events
	EVENTBRITE_API_KEY=your_eventbrite_key
	TWITCH_CLIENT_ID=your_twitch_client_id
	TWITCH_CLIENT_SECRET=your_twitch_secret
	SPORTSDATA_API_KEY=your_sportsdata_key
	OPENWEATHER_API_KEY=your_openweather_key
	JWT_SECRET=your_jwt_secret
| Do not commit .env—use a secrets manager in production.

---

## Usage

### Running Locally

1. **Ensure Docker Compose is running:
	```bash
 	docker-compose up

2. **In another terminal, start the React app:
	```bash
 	cd frontend
	npm start

3. **Visit http://localhost:3000, create a profile, and explore!

### Event Tickets

For all sporting events (F1, soccer, football, tennis, etc.), we list schedules with direct “Buy Tickets” links to providers like Ticketmaster or StubHub. 
Example:

```plaintext
Event		           Date	           Venue	  Tickets
Australian GP	        2025-03-21	Albert Park	Buy Tickets	
Premier League Match	2025-08-17	Old Trafford	Get Tickets
```

### API Integrations

	•	Eventbrite: Public event listings
	•	Twitch: Live esports streams
	•	SportsData.io: Sports schedules (free tier)
	•	OpenWeatherMap: Outdoor activity suggestions
	•	Custom Scrapers: Niche sources without APIs

See docs/api_integrations.md for full specs.


## Project Structure

```plaintext
multi-event-calendar/
├── backend/            # FastAPI service
│	├── app/
│	├── Dockerfile
│	├── requirements.txt
│	└── .env
├── frontend/           # React app
│	├── src/
│	├── public/
|	├── Dockerfile
│	└── package.json
├── docker-compose.yml
├── README.md
└── docs/               # Design docs, wireframes, API specs
```

### Contributing

	1.	Fork the repo
	2.	Create a branch (git checkout -b feature/XYZ)
	3.	Commit (git commit -m "Add XYZ")
	4.	Push (git push origin feature/XYZ)
	5.	Open a PR

Please follow our Code of Conduct and Contributing Guide.


## License

This project is under the GNU License. See LICENSE for details.


## Contact

Maintainer: Oliver Perrin (OliverPerrin)
Feel free to open issues or reach out with questions!
