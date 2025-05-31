# API Documentation

This document outlines the REST API endpoints exposed by the server in the `server/` directory. The application uses JSON for request and response bodies and listens on port `3000` by default.

## Authentication
Some endpoints require a valid JSON Web Token (JWT). Clients should include the token in the `Authorization` header using the `Bearer <token>` scheme.

---

## Endpoints

### `POST /signup`
Create a new user account.

**Request Body**
```json
{
  "username": "string",
  "password": "string"
}
```

**Responses**
- `201 Created` – user record created.
- `4xx` – on validation failure.

---

### `POST /login`
Authenticate a user and receive a JWT.

**Request Body**
```json
{
  "username": "string",
  "password": "string"
}
```

**Responses**
- `200 OK` – `{ "token": "<jwt>" }` on success.
- `401 Unauthorized` – when credentials are invalid.

---

### `GET /users`
Retrieve a list of users. Requires a valid JWT.

**Headers**
```
Authorization: Bearer <token>
```

**Responses**
- `200 OK` – array of users, each with `id` and `username`.
- `401 Unauthorized` – when the token is missing or invalid.

---

### `GET /tools`
Return all tools in the database. Each tool object includes an
`owner_username` field from the user who owns the tool.

**Responses**
- `200 OK` – array of tool objects, each with owner information.
- `500 Internal Server Error` – on database errors.

---

### `GET /tools/name/:name`
Fetch a tool by its `name` field.

**URL Parameters**
- `name` – string name of the tool.

**Responses**
- `200 OK` – tool object.
- `404 Not Found` – when no matching tool exists.
- `500 Internal Server Error` – on database errors.

---

### `GET /tools/:id`
Fetch a tool by its numeric `id`.

**URL Parameters**
- `id` – numeric tool identifier.

**Responses**
- `200 OK` – tool object.
- `404 Not Found` – when no matching tool exists.
- `500 Internal Server Error` – on database errors.

---

### `POST /tools`
Create a new tool.

Tool names do not need to be unique. The `owner_id` field should reference an existing user.

**Request Body**
```json
{
  "name": "string",
  "price": 0,
  "description": "string",
  "owner_id": 0
}
```

**Responses**
- `201 Created` – newly created tool object.
- `400 Bad Request` – on validation or database errors.

---

### `PUT /tools/:id`
Update an existing tool.

**URL Parameters**
- `id` – numeric tool identifier.

**Request Body** Same fields as in `POST /tools`.

**Responses**
- `200 OK` – updated tool object.
- `404 Not Found` – when the tool does not exist.
- `400 Bad Request` – on validation or database errors.

---

### `DELETE /tools/:id`
Remove a tool from the database.

**URL Parameters**
- `id` – numeric tool identifier.

**Responses**
- `204 No Content` – on successful deletion.
- `404 Not Found` – when the tool does not exist.
- `400 Bad Request` – on database errors.

---

### `GET /chats`
Retrieve all chat messages.

**Responses**
- `200 OK` – array of chat objects.
- `500 Internal Server Error` – on database errors.

---

### `POST /chats`
Create a new chat message.

**Request Body**
```json
{
  "user_id": 0,
  "message": "string"
}
```

**Responses**
- `201 Created` – newly created chat object.
- `400 Bad Request` – on validation or database errors.

---

## Error Responses
Every endpoint returns a JSON object containing an `error` field when a request fails. The message provides a short description of the problem.

