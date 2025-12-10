require('dotenv').config();
const { app, connectToDatabase } = require('./app');

const PORT = process.env.PORT || 4000;
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => console.log('Server running on', PORT));
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error', err);
    process.exit(1);
  });
