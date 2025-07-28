# Excel Analytics Platform - Backend

A powerful MERN stack backend for Excel file analytics with 2D/3D chart generation capabilities.

## Features

- **User Authentication**: JWT-based authentication system
- **Role-Based Access**: Project-specific admin and member roles
- **Excel Processing**: Upload and parse .xlsx/.xls files using SheetJS
- **Chart Generation**: Backend processing for 2D/3D chart data
- **Project Management**: Single usage vs Organization projects
- **Email Invitations**: Nodemailer integration for project invitations
- **File Management**: Secure file upload with Multer
- **Database**: MongoDB with Prisma ORM
- **TypeScript**: Full TypeScript support for better development experience

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **ORM**: Prisma
- **Authentication**: JWT
- **File Processing**: SheetJS (xlsx)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Joi

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd excel-analytics-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mongodb://localhost:27017/excel_analytics"
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@excelanalytics.com
FROM_NAME=Excel Analytics Platform

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get user projects
- `GET /api/projects/:projectId` - Get project details
- `POST /api/projects/:projectId/invite` - Invite user to project
- `POST /api/projects/accept-invitation` - Accept project invitation
- `PUT /api/projects/:projectId` - Update project details
- `DELETE /api/projects/:projectId` - delete project

### File Uploads
- `POST /api/uploads/:projectId` - Upload Excel file
- `GET /api/uploads/:projectId` - Get project uploads
- `GET /api/uploads/file/:uploadId` - Get upload details
- `DELETE /api/uploads/file/:uploadId` - Delete upload

### Charts
- `POST /api/charts/upload/:uploadId` - Create chart
- `GET /api/charts/upload/:uploadId` - Get upload charts
- `GET /api/charts/:chartId` - Get chart details
- `PUT /api/charts/:chartId` - Update chart
- `DELETE /api/charts/:chartId` - Delete chart

### Users
- `GET /api/users/dashboard` - Get user dashboard data

## Database Schema

The application uses MongoDB with Prisma ORM. Key models include:

- **User**: User authentication and profile data
- **Project**: Project information and settings
- **ProjectMember**: User-project relationships with roles
- **Upload**: File upload records and metadata
- **ExcelData**: Processed Excel file data
- **Chart**: Chart configurations and data
- **Invitation**: Project invitation system

## Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── routes/         # API route definitions
├── services/       # Business logic services
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── config/         # Configuration files
├── templates/      # Email templates
└── app.ts         # Application entry point
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation with Joi
- File type validation
- Role-based access control

## Development Guidelines

1. **TypeScript**: Use proper typing for all functions and data structures
2. **Error Handling**: Use the asyncHandler wrapper for async routes
3. **Validation**: Validate all inputs using Joi schemas
4. **Security**: Follow security best practices for file uploads and data handling
5. **Documentation**: Document all API endpoints and complex functions