'use client';

interface Props {
  onCouncilOpen: () => void;
}

export default function ConstitutionalSurface({ onCouncilOpen }: Props) {
  return (
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
          <p className="techFont axpt-label">Access</p>

          <div className="accessRow">
            <button
              className="axpt-btn"
              onClick={onCouncilOpen}
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
  );
}