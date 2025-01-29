import { Express } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "@db";
import { crypto } from "./crypto";
import { z } from "zod";

// Define validation schema
export const userSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6)
});

export function setupAuth(app: Express) {
  // Passport configuration
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Attempting login for username:', username);
      
      const result = await db.query<User>(
        'SELECT * FROM users WHERE username = $1 OR email = $1 LIMIT 1',
        [username]
      );
      const user = result.rows[0];

      if (!user) {
        console.log('User not found:', username);
        return done(null, false, { message: "Invalid username or email" });
      }

      console.log('User found, verifying password...');
      const isValid = await crypto.compare(password, user.password);
      
      if (!isValid) {
        console.log('Invalid password for user:', username);
        return done(null, false, { message: "Invalid password" });
      }

      console.log('Login successful for user:', username);
      return done(null, user);
    } catch (err) {
      console.error('Login error:', err);
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 LIMIT 1',
        [id]
      );
      const user = result.rows[0];
      
      if (!user) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  return passport;
} 