# Worknoon Chat - Backend

Real-time chat system backend built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- JWT Authentication (Signup/Login)
- User Roles: admin, agent, customer, designer, merchant
- Real-time messaging via Socket.IO
- CRUD for conversations and messages
- Read/unread status with timestamps
- Typing indicators
- Online/offline status
- Email notifications for offline users
- Admin endpoints for user & message management

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JSON Web Tokens (JWT)
- Nodemailer
- Winston (logging)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Gmail account (for email notifications)

## Installation

1. Clone the repository:
```bash
git clone <https://github.com/Godwinprince/worknoon-job-test.git>
cd worknoon-chat-backend