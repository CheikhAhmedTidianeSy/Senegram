/**
 * Génère un certificat auto-signé valable pour localhost + toutes les IPv4
 * locales de la machine, valide 365 jours.
 *
 *   Utilisation :
 *     node scripts/gen-cert.js              (auto-détecte les IPs)
 *     node scripts/gen-cert.js 192.168.1.14 (force une IP supplémentaire)
 */
const fs        = require("fs");
const path      = require("path");
const os        = require("os");
const selfsigned = require("selfsigned");

const CERT_DIR = path.join(__dirname, "..", "certs");
fs.mkdirSync(CERT_DIR, { recursive: true });

// ------- Collecte toutes les IP locales -------
const ips = ["127.0.0.1"];
Object.values(os.networkInterfaces()).forEach((ifs) => {
  ifs.forEach((ni) => {
    if (ni.family === "IPv4" && !ni.internal) ips.push(ni.address);
  });
});

// IP supplémentaire passée en argument
process.argv.slice(2).forEach((a) => {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(a) && !ips.includes(a)) ips.push(a);
});

const altNames = [
  { type: 2, value: "localhost" },
  ...ips.map((ip) => ({ type: 7, ip })),
];

console.log("Génération d'un certificat auto-signé pour :");
console.log("    DNS : localhost");
ips.forEach((ip) => console.log(`    IP  : ${ip}`));

const attrs = [{ name: "commonName", value: "Senegram Dev" }];
const pems = selfsigned.generate(attrs, {
  algorithm: "sha256",
  days: 365,
  keySize: 2048,
  extensions: [
    { name: "basicConstraints", cA: false },
    {
      name: "keyUsage",
      keyCertSign: false,
      digitalSignature: true,
      keyEncipherment: true,
      nonRepudiation: false,
      dataEncipherment: false,
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: false,
    },
    { name: "subjectAltName", altNames },
  ],
});

fs.writeFileSync(path.join(CERT_DIR, "key.pem"),  pems.private);
fs.writeFileSync(path.join(CERT_DIR, "cert.pem"), pems.cert);

console.log(`\nCertificat écrit dans : ${CERT_DIR}`);
console.log("    - key.pem  (clé privée)");
console.log("    - cert.pem (certificat)");
console.log("\nRedémarre le backend puis le frontend pour activer le HTTPS.");
