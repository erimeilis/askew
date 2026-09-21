import type { ResidualBuilder } from "@/solver/types";
import { gaugeResiduals } from "./gauge";
import { lengthResiduals } from "./length";
import { thicknessResiduals } from "./thickness";
import { angleResiduals } from "./angle";
import { priorResiduals } from "./prior";
import { alignResiduals } from "./align";

export const residualBuilders: ResidualBuilder[] = [
  gaugeResiduals,
  lengthResiduals,
  thicknessResiduals,
  angleResiduals,
  priorResiduals,
  alignResiduals,
];
