interface HubHeaderProps {
  greeting?: string;
  subtitle?: string;
}

export default function HubHeader({
  greeting = 'Bem-vinda ao Maternar',
  subtitle = 'Como você quer se cuidar hoje?',
}: HubHeaderProps) {
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-support-1 mb-2">
        {greeting}
      </h1>
      <p className="text-support-2 text-base sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}
