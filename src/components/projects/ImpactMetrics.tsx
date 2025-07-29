type ImpactProps = {
  impact?: {
    axgRaised?: number;
    beneficiaries?: number;
    landRestored?: number;
    jobsCreated?: number;
  };
};

export default function ImpactMetrics({ impact }: ImpactProps) {
  if (!impact) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>📊 Impact Metrics</h3>
      <ul>
        {impact.axgRaised && <li>AXG Raised: {impact.axgRaised.toLocaleString()} AXG</li>}
        {impact.beneficiaries && <li>Beneficiaries: {impact.beneficiaries.toLocaleString()}</li>}
        {impact.landRestored && <li>Land Restored: {impact.landRestored} hectares</li>}
        {impact.jobsCreated && <li>Jobs Created: {impact.jobsCreated}</li>}
      </ul>
    </div>
  );
}
