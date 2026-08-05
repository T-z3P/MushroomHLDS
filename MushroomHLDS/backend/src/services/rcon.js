import Rcon from 'node-rcon';

export function executeRcon(ip, port, rconPassword, command) {
  return new Promise((resolve, reject) => {
    const conn = new Rcon(ip, port, rconPassword, { tcp: false, challenge: true });

    const timeout = setTimeout(() => {
      conn.disconnect();
      reject(new Error('RCON Request Timed Out'));
    }, 4000);

    conn.on('auth', () => {
      conn.send(command);
    });

    conn.on('response', (str) => {
      clearTimeout(timeout);
      conn.disconnect();
      resolve(str);
    });

    conn.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    conn.connect();
  });
}