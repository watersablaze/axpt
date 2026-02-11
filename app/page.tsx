'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroCeremonial from '@/components/sigil/HeroCeremonial';

export default function Home() {
  return (
    <>
      <Header />

      <main>

        {/* Vestibule */}
        <HeroCeremonial />

        {/* Chamber Threshold */}
        <section className="chamberThreshold">
          <div className="responsivePageContainer">

            <div className="thresholdDivider" />

            <div className="thresholdStatement">
              <p className="techFont axpt-label">
                Sovereign Declaration
              </p>

              <h2>
                AXPT serves as a neutral public standard for
                culturally rooted economic continuity.
              </h2>

              <p className="statementSub">
                Governance clarity. Indigenous alignment.
                Regenerative capital architecture.
              </p>
            </div>

            <div className="accessBlock">
              <p className="techFont axpt-label">
                Access
              </p>

              <div className="accessRow">
                <button className="axpt-btn">Council Access</button>
                <button className="axpt-btn">Partner Entry</button>
              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}