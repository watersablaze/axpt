// ✅ File: app/cada/confirmation/page.tsx
export default function CadaConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f0e6] text-black px-4 text-center">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2">✅ Welcome to CADA!</h1>
        <p className="mb-4">
          Your registration is confirmed. You’ll receive an email when event registration opens or when there’s a major update.
        </p>
        <a href="/" className="text-blue-600 underline">Back to Home</a>
      </div>
    </div>
  );
}