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
      case 'q1': // Square Classic
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

      case 'q2': // Round Pantos
        return (
          <g>
            {/* Left Round Lens */}
            <circle cx="220" cy="130" r="72" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />
            {/* Right Round Lens */}
            <circle cx="480" cy="130" r="72" fill={currentTint.fill} stroke={currentTint.stroke} strokeWidth="1.5" />

            {/* Specular Highlight */}
            {showReflection && (
              <>
                <path d="M 175 90 A 68 68 0 0 1 265 85" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 435 90 A 68 68 0 0 1 525 85" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
              </>
            )}

            {/* Outer Frame */}
            <circle cx="220" cy="130" r="76" fill="none" stroke="#201610" strokeWidth="9" />
            <circle cx="480" cy="130" r="76" fill="none" stroke="#201610" strokeWidth="9" />

            {/* High Keyhole Bridge */}
            <path d="M 296 115 C 330 95, 370 95, 404 115" stroke="#201610" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 335 125 C 342 110, 358 110, 365 125" stroke="#201610" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Temples */}
            <path d="M 144 115 L 60 100 Q 30 92 18 75" stroke="#201610" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 556 115 L 640 100 Q 670 92 682 75" stroke="#201610" strokeWidth="6" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'q3': // Double Bridge Minimal Aviator
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

            {/* Thin Titanium Frame */}
            <path
              d="M 130 90 C 140 60, 270 58, 305 85 C 315 130, 290 195, 215 195 C 150 195, 120 150, 130 90 Z"
              fill="none"
              stroke="#201610"
              strokeWidth="7"
            />
            <path
              d="M 395 85 C 430 58, 560 60, 570 90 C 580 150, 550 195, 485 195 C 410 195, 385 130, 395 85 Z"
              fill="none"
              stroke="#201610"
              strokeWidth="7"
            />

            {/* Double Brow Bar Bridge */}
            <path d="M 230 52 L 470 52" stroke="#201610" strokeWidth="5" strokeLinecap="round" />
            <path d="M 305 85 C 330 75, 370 75, 395 85" stroke="#201610" strokeWidth="5" strokeLinecap="round" fill="none" />

            {/* Temples */}
            <path d="M 125 85 L 50 75 Q 25 70 15 55" stroke="#201610" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 575 85 L 650 75 Q 675 70 685 55" stroke="#201610" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'q4': // Octagonal Thin
        return (
          <g>
            {/* Left Octagon Lens */}
            <polygon
              points="160,70 260,70 300,105 300,165 260,195 160,195 125,160 125,105"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />
            {/* Right Octagon Lens */}
            <polygon
              points="440,70 540,70 575,105 575,160 540,195 440,195 400,165 400,105"
              fill={currentTint.fill}
              stroke={currentTint.stroke}
              strokeWidth="1.5"
            />

            {/* Reflection */}
            {showReflection && (
              <>
                <path d="M 150 85 L 270 85" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 430 85 L 550 85" stroke={currentTint.specular} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
              </>
            )}

            {/* Frame */}
            <polygon
              points="160,70 260,70 300,105 300,165 260,195 160,195 125,160 125,105"
              fill="none"
              stroke="#201610"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <polygon
              points="440,70 540,70 575,105 575,160 540,195 440,195 400,165 400,105"
              fill="none"
              stroke="#201610"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Bridge */}
            <path d="M 300 115 C 330 105, 370 105, 400 115" stroke="#201610" strokeWidth="5" strokeLinecap="round" fill="none" />

            {/* Temples */}
            <path d="M 125 110 L 50 100 Q 25 95 15 80" stroke="#201610" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 575 110 L 650 100 Q 675 95 685 80" stroke="#201610" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'q5': // Rectangular Slim
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
