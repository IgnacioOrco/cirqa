import React from 'react';

/**
 * High-end minimalist vector rendering of CIRQA frames with customizable crystal filters.
 * Pure vector lines, bevel reflections, and optical tint matching CIRQA specifications.
 */
export default function GlassesRender({
  modelId = 'q1',
  filterId = 'dia',
  className = 'w-full h-auto',
  showReflection = true,
  scale = 1,
}) {
  // Tint configuration based on CIRQA laboratory specs
  const tints = {
    clear: {
      fill: 'rgba(230, 240, 250, 0.28)',
      stroke: 'rgba(203, 213, 225, 0.6)',
      specular: 'rgba(255, 255, 255, 0.75)',
      ambient: 'rgba(240, 245, 255, 0.15)',
    },
    dia: {
      fill: 'rgba(243, 185, 58, 0.48)',
      stroke: 'rgba(243, 185, 58, 0.8)',
      specular: 'rgba(254, 240, 138, 0.7)',
      ambient: 'rgba(243, 185, 58, 0.25)',
    },
    transicion: {
      fill: 'rgba(232, 74, 15, 0.58)',
      stroke: 'rgba(232, 74, 15, 0.85)',
      specular: 'rgba(253, 186, 116, 0.7)',
      ambient: 'rgba(232, 74, 15, 0.25)',
    },
    noche: {
      fill: 'rgba(172, 25, 23, 0.78)',
      stroke: 'rgba(172, 25, 23, 0.95)',
      specular: 'rgba(252, 165, 165, 0.65)',
      ambient: 'rgba(172, 25, 23, 0.35)',
    },
    carmin: {
      fill: 'rgba(172, 25, 23, 0.78)',
      stroke: 'rgba(172, 25, 23, 0.95)',
      specular: 'rgba(252, 165, 165, 0.65)',
      ambient: 'rgba(172, 25, 23, 0.35)',
    },
  };

  const currentTint = tints[filterId] || tints.dia;

  // Frame geometries for Q1, Q2, Q3, Q4, Q5
  const renderLensesAndFrame = () => {
    switch (modelId) {
      case 'q001':
      case 'q1': // Q 001: Square Classic Negro
        return (
          <g>
            {/* Left Lens Glass */}
            <path
              d="M 120 100 C 120 70, 150 60, 220 60 C 290 60, 310 70, 310 100 C 310 170, 280 200, 220 200 C 150 200, 120 170, 120 100 Z"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />
            {/* Right Lens Glass */}
            <path
              d="M 390 100 C 390 70, 410 60, 480 60 C 550 60, 580 70, 580 100 C 580 170, 550 200, 480 200 C 420 200, 390 170, 390 100 Z"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />

            {/* Lens Specular Glass Highlights (Optical Reflection) */}
            {showReflection && (
              <>
                <path
                  d="M 140 75 Q 210 70 280 90"
                  stroke={currentTint.specular}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.8"
                />
                <path
                  d="M 410 75 Q 480 70 550 90"
                  stroke={currentTint.specular}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.8"
                />
              </>
            )}

            {/* Outer Matte Black Frame */}
            <path
              d="M 90 95 C 90 55, 130 45, 220 45 C 300 45, 325 60, 335 75 C 345 68, 355 68, 365 75 C 375 60, 400 45, 480 45 C 570 45, 610 55, 610 95 C 610 185, 560 218, 480 218 C 410 218, 375 180, 365 145 C 355 145, 345 145, 335 145 C 325 180, 290 218, 220 218 C 140 218, 90 185, 90 95 Z"
              fill="none"
              stroke="#201610"
              strokeWidth="13"
              strokeLinejoin="round"
            />

            {/* Bridge */}
            <path
              d="M 312 85 C 335 78, 365 78, 388 85"
              stroke="#201610"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />

            {/* Temples / Hinges */}
            <path d="M 92 88 L 45 78 Q 25 72 15 60" stroke="#201610" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 608 88 L 655 78 Q 675 72 685 60" stroke="#201610" strokeWidth="8" strokeLinecap="round" fill="none" />

            {/* Minimal CIRQA laser engraving dot on left temple */}
            <circle cx="80" cy="85" r="2" fill="#E4B070" />
            <circle cx="620" cy="85" r="2" fill="#E4B070" />
          </g>
        );

      case 'q002':
      case 'q4': // Q 002: Aviator Wire Dorado
        return (
          <g>
            {/* Left Teardrop Lens */}
            <path
              d="M 130 90 C 140 60, 270 58, 305 85 C 315 130, 290 195, 215 195 C 150 195, 120 150, 130 90 Z"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />
            {/* Right Teardrop Lens */}
            <path
              d="M 395 85 C 430 58, 560 60, 570 90 C 580 150, 550 195, 485 195 C 410 195, 385 130, 395 85 Z"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />

            {/* Reflection */}
            {showReflection && (
              <>
                <path d="M 155 75 Q 220 68 285 85" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 415 85 Q 480 68 545 75" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
              </>
            )}

            {/* Thin Golden Aviator Frame */}
            <path
              d="M 130 90 C 140 60, 270 58, 305 85 C 315 130, 290 195, 215 195 C 150 195, 120 150, 130 90 Z"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="5"
            />
            <path
              d="M 395 85 C 430 58, 560 60, 570 90 C 580 150, 550 195, 485 195 C 410 195, 385 130, 395 85 Z"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="5"
            />

            {/* Double Brow Bar Bridge */}
            <path d="M 230 52 L 470 52" stroke="#D4AF37" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 305 85 C 330 75, 370 75, 395 85" stroke="#D4AF37" strokeWidth="4.5" strokeLinecap="round" fill="none" />

            {/* Temples */}
            <path d="M 125 85 L 50 75 Q 25 70 15 55" stroke="#D4AF37" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 575 85 L 650 75 Q 675 70 685 55" stroke="#D4AF37" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'q003':
      case 'q2': // Q 003: Navigator Flat-Top Negro
        return (
          <g>
            {/* Left Navigator Lens */}
            <path
              d="M 125 85 L 305 85 C 310 135, 295 195, 215 195 C 145 195, 120 145, 125 85 Z"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />
            {/* Right Navigator Lens */}
            <path
              d="M 395 85 L 575 85 C 580 145, 555 195, 485 195 C 405 195, 390 135, 395 85 Z"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />

            {showReflection && (
              <>
                <path d="M 140 95 L 285 95" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 415 95 L 560 95" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              </>
            )}

            {/* Flat-top Brow bar */}
            <path d="M 100 70 L 600 70" stroke="#201610" strokeWidth="12" strokeLinecap="round" />

            {/* Lower Rims */}
            <path
              d="M 100 70 L 125 85 C 120 145, 145 195, 215 195 C 295 195, 310 135, 305 85 L 325 85"
              fill="none"
              stroke="#201610"
              strokeWidth="9"
              strokeLinejoin="round"
            />
            <path
              d="M 375 85 L 395 85 C 390 135, 405 195, 485 195 C 555 195, 580 145, 575 85 L 600 70"
              fill="none"
              stroke="#201610"
              strokeWidth="9"
              strokeLinejoin="round"
            />
            {/* Central Bridge Accent */}
            <path d="M 315 105 L 385 105" stroke="#201610" strokeWidth="6" strokeLinecap="round" />

            {/* Temples */}
            <path d="M 100 70 L 40 65 Q 20 60 10 50" stroke="#201610" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 600 70 L 660 65 Q 680 60 690 50" stroke="#201610" strokeWidth="7" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'q004':
      case 'q3': // Q 004: Oval Carey Havana
        return (
          <g>
            {/* Left Oval Lens */}
            <ellipse cx="220" cy="130" rx="90" ry="60" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />
            {/* Right Oval Lens */}
            <ellipse cx="480" cy="130" rx="90" ry="60" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />

            {showReflection && (
              <>
                <path d="M 160 95 Q 220 85 280 100" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 420 100 Q 480 85 540 95" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
              </>
            )}

            {/* Carey Havana Frame (rich warm mottled brown) */}
            <ellipse cx="220" cy="130" rx="92" ry="62" fill="none" stroke="#5A3825" strokeWidth="11" />
            <ellipse cx="480" cy="130" rx="92" ry="62" fill="none" stroke="#5A3825" strokeWidth="11" />

            {/* Bridge */}
            <path d="M 310 120 C 335 108, 365 108, 390 120" stroke="#5A3825" strokeWidth="10" strokeLinecap="round" fill="none" />

            {/* Temples */}
            <path d="M 128 120 L 55 105 Q 30 98 18 80" stroke="#5A3825" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 572 120 L 645 105 Q 670 98 682 80" stroke="#5A3825" strokeWidth="8" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'q005':
      case 'q5': // Q 005: Round Minimal Wire
        return (
          <g>
            {/* Left Round Lens */}
            <circle cx="220" cy="130" r="72" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />
            {/* Right Round Lens */}
            <circle cx="480" cy="130" r="72" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />

            {showReflection && (
              <>
                <path d="M 175 90 A 68 68 0 0 1 265 85" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 435 90 A 68 68 0 0 1 525 85" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
              </>
            )}

            {/* Wire Rim */}
            <circle cx="220" cy="130" r="74" fill="none" stroke="#71717A" strokeWidth="5" />
            <circle cx="480" cy="130" r="74" fill="none" stroke="#71717A" strokeWidth="5" />

            {/* Bridge */}
            <path d="M 294 125 C 330 110, 370 110, 406 125" stroke="#71717A" strokeWidth="5" strokeLinecap="round" fill="none" />

            {/* Temples */}
            <path d="M 146 125 L 60 115 Q 30 108 18 90" stroke="#71717A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 554 125 L 640 115 Q 670 108 682 90" stroke="#71717A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'qkids':
      case 'kids': // Q KIDS: Edición Infantil Cristal Rosa
        return (
          <g>
            {/* Left Round Lens (Compact) */}
            <circle cx="230" cy="130" r="64" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />
            {/* Right Round Lens (Compact) */}
            <circle cx="470" cy="130" r="64" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />

            {showReflection && (
              <>
                <path d="M 190 95 A 58 58 0 0 1 270 90" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 430 95 A 58 58 0 0 1 510 90" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
              </>
            )}

            {/* Translucent Rose Frame */}
            <circle cx="230" cy="130" r="68" fill="none" stroke="#F4B7B2" strokeWidth="8" opacity="0.9" />
            <circle cx="470" cy="130" r="68" fill="none" stroke="#F4B7B2" strokeWidth="8" opacity="0.9" />

            {/* Keyhole Bridge */}
            <path d="M 298 122 C 328 108, 372 108, 402 122" stroke="#F4B7B2" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.9" />

            {/* Temples */}
            <path d="M 162 122 L 80 110 Q 50 102 30 85" stroke="#F4B7B2" strokeWidth="6.5" strokeLinecap="round" fill="none" opacity="0.9" />
            <path d="M 538 122 L 620 110 Q 650 102 670 85" stroke="#F4B7B2" strokeWidth="6.5" strokeLinecap="round" fill="none" opacity="0.9" />
          </g>
        );

      default:
        return (
          <g>
            {/* Left Slim Lens */}
            <rect x="120" y="85" width="180" height="95" rx="20" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />
            {/* Right Slim Lens */}
            <rect x="400" y="85" width="180" height="95" rx="20" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />

            {/* Reflection */}
            {showReflection && (
              <>
                <path d="M 140 100 L 280 100" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 420 100 L 560 100" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              </>
            )}

            {/* Frame */}
            <rect x="120" y="85" width="180" height="95" rx="20" fill="none" stroke="#201610" strokeWidth="10" />
            <rect x="400" y="85" width="180" height="95" rx="20" fill="none" stroke="#201610" strokeWidth="10" />

            {/* Bridge */}
            <path d="M 300 115 L 400 115" stroke="#201610" strokeWidth="8" strokeLinecap="round" />

            {/* Temples */}
            <path d="M 120 110 L 45 100 Q 25 95 15 80" stroke="#201610" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 580 110 L 655 100 Q 675 95 685 80" stroke="#201610" strokeWidth="7" strokeLinecap="round" fill="none" />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 700 260"
        className="w-full h-auto drop-shadow-sm select-none transition-all duration-700 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        {renderLensesAndFrame()}
      </svg>
    </div>
  );
}
