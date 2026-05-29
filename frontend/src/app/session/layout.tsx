import type { ReactNode } from "react";

import SessionShellClient from "@/app/session/_components/SessionLayout/SessionShellClient";
import { SessionResourcesProvider } from "../../context/Resource/SessionResourcesContext";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return(    
   <SessionResourcesProvider>
  <SessionShellClient>
    {children}
  </SessionShellClient>
  </SessionResourcesProvider> 
    )
}
