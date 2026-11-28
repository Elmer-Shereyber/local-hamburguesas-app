import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const HOST = '127.0.0.1';
const PORT = 4173;
const RAIZ_PUBLICA = resolve(process.cwd(), 'public');

const TIPOS = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function resolverRuta(url = '/') {
  const pathname = decodeURIComponent(new URL(url, `http://${HOST}:${PORT}`).pathname);
  const relativa = normalize(pathname).replace(/^([/\\])+/, '');
  let archivo = resolve(join(RAIZ_PUBLICA, relativa || 'index.html'));
  if (!archivo.startsWith(RAIZ_PUBLICA)) return null;
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, 'index.html');
  return archivo;
}

const servidor = createServer((solicitud, respuesta) => {
  const archivo = resolverRuta(solicitud.url);
  if (!archivo || !existsSync(archivo) || !statSync(archivo).isFile()) {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end('404 - Archivo no encontrado');
    return;
  }

  respuesta.writeHead(200, {
    'Content-Type': TIPOS[extname(archivo).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  createReadStream(archivo).pipe(respuesta);
});

servidor.listen(PORT, HOST, () => {
  console.log(`Servidor E2E disponible en http://${HOST}:${PORT}`);
});

function cerrar() {
  servidor.close(() => process.exit(0));
}

process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
