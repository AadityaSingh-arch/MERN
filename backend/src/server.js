import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import connectDatabase from './config/database.js';

const port = process.env.PORT || 5000;
await connectDatabase();
app.listen(port, () => console.log(`API listening on ${port}`));
