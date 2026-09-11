import { ConstellationField as AuthoredConstellationField } from '@designcodeio/threeui';

interface Props {
  density?: number;
  speed?: number;
  className?: string;
}

/** The packaged source named by bg.md, retained as its own isolated renderer. */
export function ConstellationField({ density = 1, speed = 1, className = '' }: Props) {
  return (
    <AuthoredConstellationField
      variant="constellation-field"
      mode="auto"
      density={density}
      speed={speed}
      className={className}
    />
  );
}
