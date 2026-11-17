import { defineConfig } from 'vite';
import { networkInterfaces } from 'node:os';

export default defineConfig(({ command }) => {
  const port = 5180;
  const interfaces = networkInterfaces();
  const addresses = [...(interfaces.en0 || []), ...Object.values(interfaces).flat()];
  const lan = addresses.find((address) => address.family === 'IPv4' && !address.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address));
  return {
    server: { host: '0.0.0.0', port, strictPort: true },
    preview: { host: '0.0.0.0', port: 4173 },
    define: {
      __PHONE_ORIGIN__: JSON.stringify(command === 'serve' && lan ? `http://${lan.address}:${port}` : ''),
    },
  };
});
