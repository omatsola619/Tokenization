const IORedis = require('ioredis');
const redis = new IORedis({
  host: '127.0.0.1',
  port: 6379,
});

redis.ping().then(res => {
  console.log('Redis Ping Response:', res);
  process.exit(0);
}).catch(err => {
  console.error('Redis Ping Error:', err);
  process.exit(1);
});
