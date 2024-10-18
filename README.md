# User Management System

This is a backend user management system built with Node.js, Express, and NeDB. It provides functionality for user registration, login, account verification, and password reset using asynchronous methods. Testing can be done using Postman, and the system includes OTP-based account verification and Two-Factor Authentication (2FA).

## Features

- User registration with email validation
- Secure login with JWT tokens
- Email-based account verification using OTP
- Password reset functionality
- 2FA using OTP
- RESTful API endpoints

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file with the following variables:**
   ```bash
   PORT=3000
   JWT_SECRET="your-secret-key"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-email-password"
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Register

- **POST** `/api/register`
  - **Request body:** `{ "email": "example@example.com", "password": "password123" }`
  - **Response:** User object

### Login

- **POST** `/api/login`
  - **Request body:** `{ "email": "example@example.com", "password": "password123" }`
  - **Response:** JWT token

### Verify Account

- **POST** `/api/verify`
  - **Request body:** `{ "email": "example@example.com", "otp": "123456" }`
  - **Response:** Success message

### Request Password Reset

- **POST** `/api/request-password-reset`
  - **Request body:** `{ "email": "example@example.com" }`
  - **Response:** Success message

### Reset Password

- **POST** `/api/reset-password`
  - **Request body:** `{ "token": "reset-token", "newPassword": "newpassword123" }`
  - **Response:** Success message

### 2FA Setup

- **POST** `/api/setup-2fa`
  - **Request body:** `{ "email": "example@example.com" }`
  - **Response:** OTP secret

### 2FA Verify

- **POST** `/api/verify-2fa`
  - **Request body:** `{ "email": "example@example.com", "otp": "123456" }`
  - **Response:** Success message

## Testing

Use Postman to test the API endpoints.

## Security Enhancement

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Email verification is required before login
- Password reset tokens have a limited lifetime
