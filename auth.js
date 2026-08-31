const passport = require('passport');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const { findOrCreateUser, getUserById, getLocalUserByEmail } = require('./db');

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  try {
    const user = getUserById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// ---- Email + password (no external setup needed — works immediately) ----
passport.use(
  new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, (email, password, done) => {
    try {
      const user = getLocalUserByEmail(email.trim().toLowerCase());
      if (!user || !user.password_hash) return done(null, false, { message: 'Email ya password galat hai.' });
      bcrypt.compare(password, user.password_hash, (err, ok) => {
        if (err) return done(err);
        if (!ok) return done(null, false, { message: 'Email ya password galat hai.' });
        done(null, user);
      });
    } catch (err) {
      done(err);
    }
  })
);

// ---- Google ----
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const user = findOrCreateUser({
            provider: 'google',
            providerId: profile.id,
            name: profile.displayName,
            avatar: profile.photos && profile.photos[0] && profile.photos[0].value,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn('⚠  GOOGLE_CLIENT_ID/SECRET missing — Google login button will show an error until you add them to .env');
}

// ---- Twitter / X (OAuth 1.0a via passport-twitter) ----
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: '/auth/twitter/callback',
        includeEmail: true,
      },
      (token, tokenSecret, profile, done) => {
        try {
          const user = findOrCreateUser({
            provider: 'twitter',
            providerId: profile.id,
            name: profile.displayName,
            avatar: profile.photos && profile.photos[0] && profile.photos[0].value,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn('⚠  TWITTER_CONSUMER_KEY/SECRET missing — Twitter login button will show an error until you add them to .env');
}

module.exports = passport;
