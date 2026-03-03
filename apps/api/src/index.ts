import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth';
import { retailersRouter } from './routes/retailers';
import { calculatorsRouter } from './routes/calculators';
import { quotesRouter } from './routes/quotes';
import { ordersRouter } from './routes/orders';
import { assetsRouter } from './routes/assets';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_URL as string,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/retailers', authenticateToken, retailersRouter);
app.use('/api/calculators', authenticateToken, calculatorsRouter);
app.use('/api/quotes', authenticateToken, quotesRouter);
app.use('/api/orders', authenticateToken, ordersRouter);
app.use('/api/assets', authenticateToken, assetsRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
});

export default app;
