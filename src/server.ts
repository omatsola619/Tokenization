import dotenv from 'dotenv';
dotenv.config();
import { app } from './app';

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 ERC-3643 Tokenization Backend running at http://localhost:${PORT}`);
  console.log(`📌 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`✅ Ready for testing!`);
});
