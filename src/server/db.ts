import { MongoClient, Collection } from 'mongodb';

export interface User {
  username: string;
  passwordHash: string;
}

export interface Setting {
  _id: string;
  value: boolean;
  updatedAt: Date;
}
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined');
}

const client = new MongoClient(uri);
const clientPromise = client.connect();

export async function getUsersCollection(): Promise<Collection<User>> {
  const conn = await clientPromise;
  return conn.db().collection<User>('users');
}

export async function getSettingsCollection(): Promise<Collection<Setting>> {
  const conn = await clientPromise;
  return conn.db().collection<Setting>('settings');
}