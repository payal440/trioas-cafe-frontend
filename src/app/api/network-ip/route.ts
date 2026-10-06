import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; ip: string }[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, ip: iface.address });
      }
    }
  }

  // Find preferred Wi-Fi or Ethernet address
  const preferred =
    addresses.find(
      (a) =>
        !a.name.toLowerCase().includes('virtual') &&
        !a.name.toLowerCase().includes('vethernet') &&
        !a.name.toLowerCase().includes('wsl') &&
        !a.name.toLowerCase().includes('loopback')
    ) || addresses[0];

  return NextResponse.json({
    addresses,
    preferredIp: preferred?.ip || 'localhost',
  });
}
