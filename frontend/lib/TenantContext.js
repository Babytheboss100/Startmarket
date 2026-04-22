'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { TENANTS, DEFAULT_TENANT_ID, resolveTenant } from './tenant';

const TenantContext = createContext(TENANTS[DEFAULT_TENANT_ID]);

export function TenantProvider({ initialId, children }) {
  const [tenant, setTenant] = useState(TENANTS[initialId] || TENANTS[DEFAULT_TENANT_ID]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const param = url.searchParams.get('tenant');
    const resolved = resolveTenant({ host: window.location.host, tenantParam: param });
    if (resolved.id !== tenant.id) {
      setTenant(resolved);
      document.documentElement.setAttribute('data-tenant', resolved.id);
    }
  }, []);

  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
