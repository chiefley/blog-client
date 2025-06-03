# WordPress JWT Authentication - React Client Reference
The examples below show getting the token and then getting posts from the applefinch blog which is a subsite of the multi-site headless Wordpress installation.

## Authentication Endpoint
```
POST https://wpcms.thechief.com/applefinch/wp-json/api/v1/token
Content-Type: application/x-www-form-urlencoded

Body (form data):
username=your_username&password=your_password
```

## Token Response
```json
{
    "token_type": "Bearer",
    "iat": 1748795225,
    "expires_in": 1906475225,
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Using Token for API Requests
```
Authorization: Bearer {jwt_token}
```

## Example React Implementation
```javascript
// Get token
const response = await fetch('https://wpcms.thechief.com/applefinch/wp-json/api/v1/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'your_username',
    password: 'your_password'
  })
});

const { jwt_token } = await response.json();

// Use token for protected requests
const postsResponse = await fetch('https://wpcms.thechief.com/applefinch/wp-json/wp/v2/posts', {
  headers: {
    'Authorization': `Bearer ${jwt_token}`
  }
});
```

## Key Points
- Use `jwt_token` field from response (not `token`)
- Send credentials as form data, not JSON
- Use token exactly as received - no additional processing
- Token expires at Unix timestamp in `expires_in` field