import type { Express } from "express";
import { createServer, type Server } from "http";
import { validateGoogleRequest } from "./middleware/security";

export function registerRoutes(app: Express): Server {
  // Google API proxy endpoint
  app.post('/api/google/generative', validateGoogleRequest, async (req, res) => {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('Google API key not configured');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`,
        'x-goog-api-key': process.env.GOOGLE_API_KEY
      } as const;

      console.log('Making request to Google API with body:', JSON.stringify(req.body));

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Google API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        // Specific error handling for common Google API errors
        if (response.status === 401) {
          return res.status(401).json({ 
            error: 'Authentication failed',
            message: 'Invalid or expired API key'
          });
        }

        if (response.status === 403) {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'API key does not have permission to access this resource'
          });
        }

        throw new Error(`Google API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Successfully received response from Google API');
      res.json(data);
    } catch (error) {
      console.error('Google API request failed:', error);

      // Forward specific error status codes from Google API
      const statusCode = error instanceof Error && error.message.includes('API error') ? 502 : 500;

      res.status(statusCode).json({ 
        error: 'Failed to process Google API request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}