import type { Tool, ToolId } from "./types";
import { selectTool } from "./selectTool";
import { roomTool } from "./roomTool";
import { measureTool } from "./measureTool";
import { thicknessTool } from "./thicknessTool";
import { angleTool } from "./angleTool";
import { alignTool } from "./alignTool";
import { openingTool } from "./openingTool";
import { fixtureTool } from "./fixtureTool";

export const tools: Record<ToolId, Tool> = {
  select: selectTool,
  room: roomTool,
  measure: measureTool,
  thickness: thicknessTool,
  angle: angleTool,
  align: alignTool,
  opening: openingTool,
  fixture: fixtureTool,
};
