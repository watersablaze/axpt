import AxisSpine from '@/components/system/AxisSpine'
import AxisGravity from '@/components/system/AxisGravity'
import AxisRuntime from '@/components/system/AxisRuntime'
import SurfaceStack from '@/components/system/SurfaceStack'
import SurfaceBoundary from '@/components/system/SurfaceBoundary'
import SurfaceObserver from '@/components/system/SurfaceObserver'
import SurfaceMagnet from '@/components/system/SurfaceMagnet'
import SurfaceEngine from '@/components/system/SurfaceEngine'
import SurfaceSection from '@/components/system/SurfaceSection'
import CommandCompass from '@/components/navigation/CommandCompass'
import Header from '@/components/layout/Header'

import { SURFACES } from '@/lib/surfaces/registry'

export default function Home() {
  return (
    <main>
      <AxisSpine />
      <AxisGravity />
      <AxisRuntime />
      <SurfaceObserver />
      <SurfaceMagnet />
      <SurfaceEngine />
      <CommandCompass />
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