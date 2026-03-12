import type { SVGProps } from 'react';

export function DataLensLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      fill="none"
      role="img"
      aria-label="DataLens"
      {...props}
    >
      {/* Database cylinder body */}
      <ellipse cx={52} cy={42} rx={32} ry={12} fill="#7C3AED" />
      <rect x={20} y={42} width={64} height={40} fill="#7C3AED" />
      <ellipse cx={52} cy={82} rx={32} ry={12} fill="#6D28D9" />

      {/* Cylinder middle ring */}
      <ellipse
        cx={52}
        cy={62}
        rx={32}
        ry={12}
        fill="none"
        stroke="#C4B5FD"
        strokeWidth={1.5}
        opacity={0.5}
      />

      {/* Cylinder top highlight */}
      <ellipse cx={52} cy={42} rx={32} ry={12} fill="#8B5CF6" />
      <ellipse
        cx={52}
        cy={42}
        rx={24}
        ry={8}
        fill="none"
        stroke="#DDD6FE"
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Lens circle */}
      <circle cx={82} cy={78} r={24} fill="none" stroke="#8B5CF6" strokeWidth={5} />
      <circle cx={82} cy={78} r={24} fill="#7C3AED" fillOpacity={0.15} />

      {/* Lens handle */}
      <line
        x1={99}
        y1={95}
        x2={114}
        y2={110}
        stroke="#8B5CF6"
        strokeWidth={6}
        strokeLinecap="round"
      />

      {/* Lens shine */}
      <path
        d="M70 68 A16 16 0 0 1 90 64"
        fill="none"
        stroke="#DDD6FE"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Data rows inside lens */}
      <line
        x1={72}
        y1={74}
        x2={92}
        y2={74}
        stroke="#C4B5FD"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <line
        x1={72}
        y1={79}
        x2={88}
        y2={79}
        stroke="#C4B5FD"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      <line
        x1={72}
        y1={84}
        x2={90}
        y2={84}
        stroke="#C4B5FD"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}
