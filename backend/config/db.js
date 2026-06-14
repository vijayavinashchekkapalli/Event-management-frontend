const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');

const envPath = path.resolve(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath, 'utf8'));

Object.assign(process.env, envConfig);

let memoryServerPromise;
let mongoInstrumentationInstalled = false;

function instrumentSlowMongoQueries() {
  if (mongoInstrumentationInstalled) return;
  mongoInstrumentationInstalled = true;

  const slowQueryThresholdMs = Number(process.env.SLOW_QUERY_THRESHOLD_MS || 250);

  const originalQueryExec = mongoose.Query.prototype.exec;
  mongoose.Query.prototype.exec = async function instrumentedQueryExec(...args) {
    const startedAt = process.hrtime.bigint();
    try {
      return await originalQueryExec.apply(this, args);
    } finally {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      if (durationMs >= slowQueryThresholdMs) {
        console.warn('[MongoDB][Slow Query]', {
          model: this.model?.modelName || 'unknown',
          op: this.op,
          durationMs: Number(durationMs.toFixed(2)),
          query: this.getQuery(),
          options: this.getOptions?.()
        });
      }
    }
  };

  const originalAggregateExec = mongoose.Aggregate.prototype.exec;
  mongoose.Aggregate.prototype.exec = async function instrumentedAggregateExec(...args) {
    const startedAt = process.hrtime.bigint();
    try {
      return await originalAggregateExec.apply(this, args);
    } finally {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      if (durationMs >= slowQueryThresholdMs) {
        console.warn('[MongoDB][Slow Aggregate]', {
          model: this._model?.modelName || 'unknown',
          durationMs: Number(durationMs.toFixed(2)),
          pipeline: this.pipeline()
        });
      }
    }
  };
}

instrumentSlowMongoQueries();

async function connectWithUri(uri) {
  return mongoose.connect(uri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 100),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 10),
    maxIdleTimeMS: Number(process.env.MONGO_MAX_IDLE_TIME_MS || 60000),
    serverSelectionTimeoutMS: 15000, // Increased from 5000 to 15000 for Atlas
    socketTimeoutMS: 45000,
    waitQueueTimeoutMS: Number(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS || 10000),
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    directConnection: false
  });
}

async function connectMemoryDatabase() {
  if (!memoryServerPromise) {
    memoryServerPromise = MongoMemoryServer.create({
      instance: {
        dbName: process.env.MONGO_DB_NAME || 'event_management'
      }
    });
  }

  const memoryServer = await memoryServerPromise;
  const memoryUri = memoryServer.getUri();
  const conn = await connectWithUri(memoryUri);
  console.warn('Using in-memory MongoDB for development because Atlas is unreachable.');
  return conn;
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI?.trim().replace(/^['\"]|['\"]$/g, '');

  if (!mongoUri) {
    console.warn('[MongoDB] MONGO_URI is not defined. Falling back to in-memory MongoDB.');
    return connectMemoryDatabase();
  }

  let lastError;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MongoDB] Attempt ${attempt}/${maxRetries}: Connecting to Atlas...`);
      const conn = await connectWithUri(mongoUri);
      console.log("✅ MongoDB Atlas Connected: " + conn.connection.host);
      return conn;
    } catch (error) {
      lastError = error;
      console.warn(`[MongoDB] Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`[MongoDB] Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.warn(`[MongoDB] All ${maxRetries} Atlas connection attempts failed. Falling back to in-memory MongoDB.`);
  console.warn(`[MongoDB] Last error:`, lastError?.message);

  return connectMemoryDatabase();
};

module.exports = connectDB;