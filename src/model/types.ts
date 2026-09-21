import { CURRENT_VERSION } from "./migrations";
export type Id = string;
export type Side = "left" | "right";
export type Axis = "x" | "y";
export interface Floor {
  id: Id;
  name: string;
  elevation: number;
}
export interface Point {
  id: Id;
  floorId: Id;
  x: number;
  y: number;
}
export interface Wall {
  id: Id;
  floorId: Id;
  a: Id;
  b: Id;
  thickness: number;
  side: Side;
}
export interface Room {
  id: Id;
  floorId: Id;
  name: string;
  pointIds: Id[];
}
export type OpeningKind = "door" | "window";
export interface Opening {
  id: Id;
  wallId: Id;
  kind: OpeningKind;
  offset: number;
  width: number;
  sill?: number;
  height?: number;
}
export interface Fixture {
  id: Id;
  floorId: Id;
  name: string;
  anchor: { wallId: Id; offset: number; depth: number };
  w: number;
  d: number;
}
export type Measurement =
  | { id: Id; kind: "length"; a: Id; b: Id; value: number }
  | { id: Id; kind: "thickness"; wallA: Id; wallB: Id; value: number }
  | { id: Id; kind: "angle"; a: Id; b: Id; c: Id; value: number }
  | { id: Id; kind: "align"; a: Id; b: Id; axis: Axis };
export type MeasurementKind = Measurement["kind"];
export interface Plan {
  version: typeof CURRENT_VERSION;
  name: string;
  floors: Floor[];
  points: Point[];
  walls: Wall[];
  rooms: Room[];
  openings: Opening[];
  fixtures: Fixture[];
  measurements: Measurement[];
}
