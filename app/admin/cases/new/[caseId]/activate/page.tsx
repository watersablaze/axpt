'use client';

export default function ActivateCasePage({
  params,
}: {
  params: { caseId: string };
}) {
  async function activate() {
    await fetch(`/api/axpt/cases/${params.caseId}/activate`, {
      method: 'POST',
    });
    window.location.href = `/admin/cases/${params.caseId}`;
  }

  return (
    <main>
      <h1>Activate Case</h1>
      <p>This action is irreversible.</p>
      <button onClick={activate}>Confirm Activation</button>
    </main>
  );
}