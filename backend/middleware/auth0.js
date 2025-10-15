import { auth } from 'express-oauth2-jwt-bearer';

// Auth0 JWT verification middleware
export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});

// Optional: User info ko request mein add karne ke liye
export const addUserInfo = (req, res, next) => {
  if (req.auth) {
    req.user = {
      id: req.auth.sub,
      permissions: req.auth.permissions || []
    };
  }
  next();
};