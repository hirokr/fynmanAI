import type { ReactNode } from "react";

import SessionShellClient from "@/app/session/_components/SessionShellClient";
import { SessionResourcesProvider } from "./_components/SessionResourcesContext";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return(    
   <SessionResourcesProvider>
  <SessionShellClient>
    {children}
  </SessionShellClient>
  </SessionResourcesProvider> 
    )
}
