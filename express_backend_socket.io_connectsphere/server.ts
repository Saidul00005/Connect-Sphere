import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

interface DecodedToken {
  user_id: number;
  email: string;
  exp: number;
}

interface CustomSocket extends Socket {
  user?: {
    id: number;
    email: string;
  };
}

interface MessageEvent {
  event: 'new_message' | 'delete_message' | 'edit_message';
  roomId: string;
  data: any;
}

interface RoomEvent {
  event: 'mark_read' | 'room_deleted' | 'participants_added' | 'participant_removed';
  roomId: string;
  data: any;
}

interface ClientToServerEvents {
  join: (roomId: string) => void;
  // send_message: (message: MessageEvent) => void;
}

interface ServerToClientEvents {
  new_message: (message: MessageEvent) => void;
  delete_message: (message: MessageEvent) => void;
  edit_message: (message: MessageEvent) => void;
  // room_event: (event: MessageEvent) => void;
  mark_read: (message: RoomEvent) => void;
  room_deleted: (message: RoomEvent) => void;
  participants_added: (message: RoomEvent) => void;
  participant_removed: (message: RoomEvent) => void;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_FRONTEND_URL: string;
      REDIS_URL: string;
      JWT_SECRET_KEY: string;
      PORT: string;
    }
  }
}

const app = express();
app.use(cors({
  origin: ['*']
}));
const httpServer = createServer(app);


const redisPub = createClient({
  url: process.env.REDIS_URL,
  // socket: {
  //   // tls: true,
  //   rejectUnauthorized: false
  // }
  socket: {
    connectTimeout: 10000,
    keepAlive: 5000,
    reconnectStrategy: (retries) => {
      console.log(`Reconnecting to Redis... Attempt #${retries}`);
      return Math.min(retries * 100, 3000);
    },
  },
});

const redisSub = redisPub.duplicate();

[redisPub, redisSub].forEach(client => {
  client.on('error', (err) => console.error('Redis error:', err));
  client.on('reconnecting', () => console.log('Redis reconnecting...'));
});

async function startServer() {
  try {
    await Promise.all([redisPub.connect(), redisSub.connect()]);
    console.log('Connected to Redis');

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: {
        origin: process.env.NEXT_FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
        // allowedHeaders: ["Authorization", "Content-Type"],
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 50000,
      adapter: createAdapter(redisPub, redisSub),
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000
      },
    });

    io.engine.on("connection_error", (err) => {
      console.error("Socket.IO connection error:", err.req.headers);
      console.error("Error details:", err.message, err.context);
    });

    const MESSAGE_CHANNEL = 'message_events';
    const ROOM_CHANNEL = 'room_events';

    await redisSub.subscribe(MESSAGE_CHANNEL, (message: string) => {
      try {
        const parsedMessage: MessageEvent = JSON.parse(message);
        io.to(parsedMessage.roomId).emit(parsedMessage.event, parsedMessage.data);
      } catch (error) {
        console.error('Error processing Redis message:', error);
      }
    });

    await redisSub.subscribe(ROOM_CHANNEL, (message: string) => {
      try {
        const parsedMessage: RoomEvent = JSON.parse(message);
        if (parsedMessage.event === 'room_deleted') {
          io.emit(parsedMessage.event, parsedMessage.data);
        } else {
          io.to(parsedMessage.roomId).emit(parsedMessage.event, parsedMessage.data);
        }
      } catch (error) {
        console.error('Error processing Redis message:', error);
      }
    });

    const verifyToken = (token: string): Promise<DecodedToken> => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
          if (err || !decoded) return reject(err || new Error('Invalid token'));
          resolve(decoded as DecodedToken);
        });
      });
    };

    io.use(async (socket: CustomSocket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      try {
        const decoded = await verifyToken(token);
        socket.user = {
          id: decoded.user_id,
          email: decoded.email
        };
        console.log(`User ${socket.user.id} authenticated`);
        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket: CustomSocket) => {
      if (!socket.user) return socket.disconnect(true);

      console.log(`User ${socket.user.id} connected`);

      socket.on('join', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.user?.id} joined room: ${roomId}`);
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.user?.id} disconnected`);
      });
    });

    httpServer.on('error', (error) => {
      console.error('Server error:', error);
    });

    app.get('/health', (req, res) => {
      res.status(200).json({
        redis: redisPub.isReady ? 'connected' : 'disconnected',
        status: 'OK'
      });
    });

    const PORT = parseInt(process.env.PORT || '3001');

    httpServer.listen(PORT, () => {
      console.log(`Socket server running on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down server...');

      await redisPub.quit();
      await redisSub.quit();

      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();