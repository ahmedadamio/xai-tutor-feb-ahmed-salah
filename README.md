# Fullstack Developer Challenge: Email Client Application

## Overview
This is a timed coding exercise to evaluate your ability to build a fullstack application matching the provided design. Your task is to replicate the email client interface shown below.

![Implementation](implementation.jpeg)

## Time Limit
**90 minutes** – Prioritize core functionality and visual accuracy.

## Tech Stack
- **Frontend:** Next.js 16+ (App Router) with Tailwind CSS
- **Backend:** Python FastAPI

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (for containerized setup)

## Setup

### Quick Start with Makefile

```bash
# Run backend + frontend locally with hot reload
make dev
```

```bash
# Run backend + frontend using Docker
make docker-all
```

### Quick Start with Docker Compose

The easiest way to run the entire application:

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# Stop all services
docker-compose down
```

This will start:
- **Backend API** at http://localhost:8000
- **Frontend** at http://localhost:3000

### Running Manually

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Database Migrations

```bash
cd backend

# Apply all migrations
python migrate.py upgrade

# Revert all migrations
python migrate.py downgrade

# List migration status
python migrate.py list
```

## Required Scope

Build the following sections from `implementation.jpeg`:

### 1. Header
- Logo (orange star icon)
- Collapse sidebar button
- Search bar with keyboard shortcut (⌘K)
- "Emails" page title
- "Search Email" input and "+ New Message" button (dark)

### 2. Left Sidebar
- Main navigation: Dashboard, Notifications, Tasks, Calendar, Widgets
- Marketing section: Product, Emails (active with highlight), Integration, Contacts
- Favorite section with color-coded items:
  - Opportunity Stages (red)
  - Key Metrics (green)
  - Product Plan (orange)
- Bottom section: Settings, Help & Center
- User profile (Richard Brown) with storage indicator (6.2GB of 10GB)

### 3. Email List Panel
- Tab filters: All Mails, Unread, Archive
- Email list items showing:
  - Sender avatar
  - Sender name
  - Subject line (with emoji support)
  - Preview text
  - Date/time
  - Unread indicator (blue dot)
  - Action icons on hover (archive, forward, more)

### 4. Email Detail View (Core Feature)
- Sender info header: avatar, name, email address, recipient, date/time
- Action icons: mark as read, archive, forward, more options
- Email subject with emoji
- Full email body content
- Attachment section with file info and download link

### 5. Reply Composer
- Recipient selector dropdown
- Rich text email body
- "Send Now" button with schedule option
- Attachment, emoji, template, and more options icons

## API Requirements

Create REST endpoints to support:
- `GET /emails` – Fetch all emails
- `GET /emails/{id}` – Fetch single email details
- `POST /emails` – Send/create a new email
- `PUT /emails/{id}` – Update email (mark as read, archive, etc.)
- `DELETE /emails/{id}` – Delete an email

## What NOT to Build
- User authentication
- Mobile/responsive layouts
- Real-time updates
- Actual email sending functionality
- Settings, Analytics, or other secondary pages
- Drag-and-drop functionality

## Evaluation Criteria

| Category | Weight | Details |
|----------|--------|---------|
| **Visual Accuracy** | 40% | Match colors, typography, spacing, shadows, borders |
| **Functionality** | 30% | CRUD operations work, data persists, UI updates correctly |
| **Code Quality** | 20% | Clean component structure, proper API design, readable code |
| **Layout & Structure** | 10% | Correct use of flex/grid, semantic HTML |

Good luck!
