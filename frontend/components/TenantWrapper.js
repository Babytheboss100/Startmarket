'use client';
import { TenantProvider } from '../lib/TenantContext';

export default function TenantWrapper({ initialId, children }) {
  return <TenantProvider initialId={initialId}>{children}</TenantProvider>;
}
