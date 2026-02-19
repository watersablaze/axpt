'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroCeremonial from '@/components/sigil/HeroCeremonial';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Header />

      <main>
        <HeroCeremonial />

        <section className="constitutionalSurface">
          <div className="constitutionalInner">
            <p className="techFont axpt-label">
              Sovereign Declaration
            </p>

            <h2>
              AXPT serves as a neutral public standard for culturally
              rooted economic continuity.
            </h2>

            <p className="statementSub">
              Governance clarity. Indigenous alignment.
              Regenerative capital architecture.
            </p>

            <div className="accessBlock">
              <div className="accessRow">
            <button
              type="button"
              className="axpt-btn"
              onClick={() => router.push('/council/login')}
            >
              Council Access
            </button>

                <button className="axpt-btn">
                  Partner Entry
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}