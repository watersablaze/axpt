'use client'

import Header from '@/components/layout/Header'

import OriginSurface from '@/components/surfaces/OriginSurface'
import FoundationSurface from '@/components/surfaces/FoundationSurface'
import FrameworkSurface from '@/components/surfaces/FrameworkSurface'
import InterfacesSurface from '@/components/surfaces/InterfacesSurface'
import EthosSurface from '@/components/surfaces/EthosSurface'
import PresenceSurface from '@/components/surfaces/PresenceSurface'
import SurfaceStack from '@/components/system/SurfaceStack'

export default function Home() {

  return (

    <main>

      <Header />

      <SurfaceStack>

          <OriginSurface />

          <FoundationSurface />

          <FrameworkSurface />

          <InterfacesSurface />

          <EthosSurface />

          <PresenceSurface />

      </SurfaceStack>

    </main>

  )

}