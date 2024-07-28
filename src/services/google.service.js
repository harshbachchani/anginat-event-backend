import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../db/config.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://anginat-event-backend.onrender.com/api/v1/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.admin.findUnique({
          where: { googleId: profile.id },
        });
        console.log(`my user is ${user}`);
        if (!user) {
          user = await prisma.admin.create({
            data: {
              googleId: profile.id,
              email: profile.emails[0].value,
            },
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.admin.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
