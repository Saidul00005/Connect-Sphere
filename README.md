# Connect Sphere App

## Description

This repository contains the codebase for Connect Sphere Website.This is a scalable and full-stack microservice application designed for employee interaction, integrating real-time messaging, role management, and employee identification.

## Features

- User authentication with role-based access control (CEO, Manager, Employee).
- Real-time chat functionality (one-on-one and group chats).
- Employee Directory with search and profile view option.
- Chat history and chat history message edit & delete options.
- Scalable single-page application (SPA).
- Employee approval process with 'Approval Pending' status before access.
- Admin panel for managing whole Connect Sphere application works.

## Technologies Used

- **Frontend**: Next.js with App Router, Shadcn for design
- **Backend**: Python Django for REST API, Express.js with Socket.IO for Websocket, Redis as message broker
- **Database**: PostgreSQL with Django ORM, Key-value database for Redis
- **Authentication**: NextAuth (JWT-based authentication)(Frontend), Simple JWT (Django Rest Framework)(Backend)
- **State Management**: Redux Toolkit

## Technical Overview

- Next.js App Router for scalable frontend routing.
- ShadCN for component styling and dashboard UI design.
- Redux Toolkit for efficient state management.
- Socket.IO(WebSocket) for real-time messaging and notifications.
- Django REST API for backend authentication(Simple JWT) and user management.
- Redis as message broker.
- PostgreSQL for relational database structure and storage.

## Getting Started

For setup and running instructions, follow typical workflow of these technologies or install and configure the application locally using the repository files.

For any issues or contributions, feel free to raise an issue or submit a pull request.
