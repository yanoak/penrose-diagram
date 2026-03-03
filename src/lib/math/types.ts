export interface Point {
	x: number;
	y: number;
}

export interface KruskalPoint {
	T: number;
	X: number;
}

export interface PenrosePoint {
	T: number;
	R: number;
}

export type Region = 'I' | 'II' | 'III' | 'IV';

export interface DiagramConfig {
	numConstantR: number;
	numConstantT: number;
	showSingularities: boolean;
	showHorizons: boolean;
	showConstantR: boolean;
	showConstantT: boolean;
	showLightCones: boolean;
	showInfinityLabels: boolean;
	showRegionLabels: boolean;
	clipToSingularities: boolean;
	singularityColor: string;
	horizonColor: string;
	constantRColor: string;
	constantTColor: string;
	zigzagAmplitude: number;
	zigzagTeeth: number;
	futureZigzagOffset: number;
	pastZigzagOffset: number;
	lineThickness: number;
	diagramSize: number;
}

export const defaultConfig: DiagramConfig = {
	numConstantR: 15,
	numConstantT: 15,
	showSingularities: true,
	showHorizons: true,
	showConstantR: true,
	showConstantT: true,
	showLightCones: false,
	showInfinityLabels: false,
	showRegionLabels: false,
	clipToSingularities: true,
	singularityColor: '#cc0000',
	horizonColor: '#000088',
	constantRColor: '#9b4d6e',
	constantTColor: '#5566bb',
	zigzagAmplitude: 3.5,
	zigzagTeeth: 22,
	futureZigzagOffset: -2,
	pastZigzagOffset: -2,
	lineThickness: 1.5,
	diagramSize: 600
};
