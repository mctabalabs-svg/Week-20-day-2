require('dotenv').config();

const express = require('express');
const telegramRoutes = require('./routes/telegram');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/telegram', telegramRoutes);

app.get('/', (req, res) => {
  res.send('Telegram bot server is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
