# Mapbox Setup Instructions

## 🗺️ Setting up Mapbox for FRA Atlas

To enable the interactive map functionality in your FRA Atlas application, you need to set up a Mapbox access token.

### Step 1: Get a Mapbox Access Token

1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for a free account or log in
3. Navigate to your [Account page](https://account.mapbox.com/)
4. Go to the "Access tokens" section
5. Copy your default public token or create a new one

### Step 2: Set the Environment Variable

Create a `.env` file in the `frontend` directory with the following content:

```bash
# FRA Atlas Frontend Environment Variables
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
REACT_APP_API_URL=http://localhost:8000
```

Replace `your_mapbox_token_here` with your actual Mapbox token.

### Step 3: Restart the Development Server

After setting up the environment variable, restart your React development server:

```bash
cd frontend
npm start
```

### Alternative: Use the Default Token

If you don't want to set up your own Mapbox account, the application will use a default token that should work for development purposes. However, for production use, you should always use your own token.

### Troubleshooting

- **Map not loading**: Check that your Mapbox token is correctly set in the `.env` file
- **Token errors**: Ensure your token has the correct permissions for map styles
- **CORS errors**: Make sure you're using the correct token format

### Map Features

Once set up, you'll have access to:
- Interactive map with FRA claims visualization
- Multiple map styles (Satellite, Streets, Terrain)
- Zoom and navigation controls
- Filtering by status, type, and district
- Real-time statistics and analytics

The map will display FRA claims as color-coded markers:
- 🟢 Green: Granted claims
- 🟠 Orange: Pending claims  
- 🔴 Red: Rejected claims

---

**Note**: The default token provided is for development only. For production deployment, always use your own Mapbox account and token.
