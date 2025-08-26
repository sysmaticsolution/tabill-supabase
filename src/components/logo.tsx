import Image from 'next/image';

type LogoProps = {
  showText?: boolean;
  size?: number;
  className?: string;
};

export default function Logo({ showText = true, size = 28, className = '' }: LogoProps) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <Image src="/icons/icon-192.png?v=2" alt="Tabill logo" width={size} height={size} className="rounded-md" priority />
      {showText && <span className="text-xl font-bold font-headline">Tabill</span>}
    </span>
  );
}
