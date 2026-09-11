import { LeadCaptureForm } from "@/components/lead-capture-form";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-24">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-neutral-500">Innoligo</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          You&apos;re paying for Microsoft 365 licences nobody is using.
        </h1>
        <p className="text-lg text-neutral-600">
          Most IT and finance teams have no cheap way to find out how much -
          checking means digging through admin-centre exports by hand.
          Upload yours and we&apos;ll tell you the number in minutes, free.
        </p>
      </div>

      <LeadCaptureForm />

      <p className="text-xs text-neutral-400">
        No credit card. We&apos;ll email you when your free scan is ready.
      </p>
    </main>
  );
}
