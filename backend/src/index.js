require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use('/auth',           require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/companies',  require('./routes/companies'));
app.use('/api/listings',   require('./routes/listings'));
app.use('/api/bids',       require('./routes/bids'));
app.use('/api/dealrooms',  require('./routes/dealrooms'));
app.use('/api/valuations', require('./routes/valuations'));
app.use('/api/admin',      require('./routes/admin'));
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`StartMarket API på port ${PORT}`));
