import SurfaceStack from '@/components/system/SurfaceStack'
import SurfaceBoundary from '@/components/system/SurfaceBoundary'
import SurfaceObserver from '@/components/system/SurfaceObserver'
import SurfaceSection from '@/components/system/SurfaceSection'
import Header from '@/components/layout/Header'
import GeologicalSubstrate from '@/components/background/GeologicalSubstrate'

import { SURFACES } from '@/lib/surfaces/registry'

export default function Home() {
  return (
    <main className="axptPortal">

      <GeologicalSubstrate />

      <SurfaceObserver />
      <Header />

      <SurfaceStack>
        {SURFACES.map((surface) => {
          const Surface = surface.component;

          return (
            <SurfaceBoundary key={surface.id}>
              <SurfaceSection surface={surface}>
                <Surface />
              </SurfaceSection>
            </SurfaceBoundary>
          );
        })}
      </SurfaceStack>
    </main>
  );
}
