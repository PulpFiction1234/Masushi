export interface User {
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
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

const options: MongoClientOptions = {
  tls: true,
  tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
  minTLSVersion: 'TLS1.2',
};

if (process.env.MONGODB_CA) {
  options.ca = fs.readFileSync(process.env.MONGODB_CA);
}

if (process.env.MONGODB_CERT) {
  options.cert = fs.readFileSync(process.env.MONGODB_CERT);
}

const client = new MongoClient(uri, options);
const clientPromise = client.connect();

export async function getUsersCollection(): Promise<Collection<User>> {
  const conn = await clientPromise;
  return conn.db().collection<User>('users');
}

export async function getSettingsCollection(): Promise<Collection<Setting>> {␊
  const conn = await clientPromise;␊
  return conn.db().collection<Setting>('settings');␊
}