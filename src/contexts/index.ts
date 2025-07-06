// src/contexts/index.ts
export { default as SiteInfoContext, SiteInfoProvider, useSiteInfo } from './SiteInfoContext';
export { AuthContext, SimpleAuthProvider as AuthProvider, useAuth, createAuthHeader } from './SimpleAuthContext';