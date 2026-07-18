# API Documentation

Base URL: `http://localhost:5000/api`

### Authentication 
All protected routes require an `Authorization` header with a valid Bearer token.
Format: `Authorization: Bearer <token>`

| Endpoint | Method | Description | Body / Params | Access |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Authenticate user and receive JWT | `{ email, password }` | Public |
| `/auth/me` | `GET` | Get current logged-in user details | None | All Authenticated Users |

### Employee Management
| Endpoint | Method | Description | Body / Params | Access |
| :--- | :--- | :--- | :--- | :--- |
| `/employees` | `GET` | Fetch all employees | None | All Authenticated Users |
| `/employees/:id` | `GET` | Fetch a single employee by ID | `id` (URL Param) | All Authenticated Users |
| `/employees` | `POST` | Create a new employee record | `{ firstName, lastName, email, department, role... }` | Admin / HR Only |
| `/employees/:id` | `PUT` | Update an existing employee | `{ fields to update }` | Admin / HR Only |
| `/employees/:id` | `DELETE` | Delete an employee record | `id` (URL Param) | Admin / HR Only |

### System
| Endpoint | Method | Description | Body / Params | Access |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | Server health check endpoint | None | Public |