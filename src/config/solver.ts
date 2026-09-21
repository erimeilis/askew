export interface SolverConfig {
  sigma: {
    lengthMm: number;
    thicknessMm: number;
    angleDeg: number;
    priorDeg: number;
    alignMm: number;
    gaugeMm: number;
  };
  priorStepDeg: number; // corners snap toward multiples of this angle
  maxIterations: number;
  stepToleranceMm: number;
  jacobianStepMm: number;
  flagSigmaFactor: number; // |residual| > factor*sigma → flagged
  rankTolerance: number; // relative pivot threshold for free-variable detection
  lm: {
    initialLambda: number;
    lambdaUpFactor: number;
    lambdaDownFactor: number;
    lambdaMin: number;
    maxInnerTries: number;
    gradientTolerance: number;
  };
}
export const SOLVER_CONFIG: SolverConfig = {
  sigma: { lengthMm: 2, thicknessMm: 2, angleDeg: 0.5, priorDeg: 5, alignMm: 1, gaugeMm: 0.001 },
  priorStepDeg: 90,
  maxIterations: 50,
  stepToleranceMm: 0.01,
  jacobianStepMm: 0.001,
  flagSigmaFactor: 3,
  rankTolerance: 1e-8,
  lm: {
    initialLambda: 1e-3,
    lambdaUpFactor: 10,
    lambdaDownFactor: 10,
    lambdaMin: 1e-12,
    maxInnerTries: 20,
    gradientTolerance: 1e-12,
  },
};
