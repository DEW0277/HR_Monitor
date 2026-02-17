
export const hikvisionConfig = {
  user: process.env.HIKVISION_DB_USER || 'sa',
  password: process.env.HIKVISION_DB_PASSWORD || 'Hikvision123',
  server: process.env.HIKVISION_DB_HOST || '192.168.1.200',
  database: process.env.HIKVISION_DB_NAME || 'ivms_db',
  port: parseInt(process.env.HIKVISION_DB_PORT || '1433', 10),
  options: {
    encrypt: false, // Use true for Azure
    trustServerCertificate: true, // Change to false for production if using valid certs
    debug: {
      packet: true,
      data: true,
      payload: true,
      token: false,
      log: true
    },
  },
};
