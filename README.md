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

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gourab8389/excel-analytics-server.git
cd excel-analytics-server
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
- `DELETE /api/projects/:projectId` - Delete project
- `POST /api/projects/:projectId/update-member` - Update member role
- `DELETE /api/projects/:projectId/remove-member` - Remove a member from project

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
