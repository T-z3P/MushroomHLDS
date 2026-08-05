import Rcon from 'rcon';

export function executeRcon(ip, port, password, command) {
  return new Promise((resolve, reject) => {
    const conn = new Rcon(ip, port, password, { tcp: false });

    conn.on('auth', () => {
      conn.send(command);
    });

    conn.on('response', (str) => {
      conn.disconnect();
      resolve(str);
    });

    conn.on('error', (err) => {
      conn.disconnect();
      reject(err);
    });

    conn.connect();
  });
}