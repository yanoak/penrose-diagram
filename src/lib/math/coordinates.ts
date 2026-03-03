import type { KruskalPoint, PenrosePoint, Point, Region } from './types';

/**
 * Schwarzschild (r, t) → Kruskal (T_K, X_K)
 * Using natural units where r_s = 2GM = 1.
 */
export function schwarzschildToKruskal(r: number, t: number, region: Region): KruskalPoint {
	if (region === 'I' || region === 'III') {
		// Exterior: r > 1
		const factor = Math.sqrt(Math.abs(r - 1)) * Math.exp(r / 2);
		let X = factor * Math.cosh(t / 2);
		let T = factor * Math.sinh(t / 2);
		if (region === 'III') {
			X = -X;
			T = -T;
		}
		return { T, X };
	} else {
		// Interior: r < 1
		const factor = Math.sqrt(Math.abs(1 - r)) * Math.exp(r / 2);
		let X = factor * Math.sinh(t / 2);
		let T = factor * Math.cosh(t / 2);
		if (region === 'IV') {
			X = -X;
			T = -T;
		}
		return { T, X };
	}
}

/**
 * Kruskal (T_K, X_K) → Penrose (T_P, R_P) via compactification
 */
export function kruskalToPenrose(kruskal: KruskalPoint): PenrosePoint {
	const U = kruskal.T - kruskal.X;
	const V = kruskal.T + kruskal.X;
	const u = Math.atan(U);
	const v = Math.atan(V);
	return {
		T: (u + v) / 2,
		R: (v - u) / 2
	};
}

/**
 * Penrose (T_P, R_P) → SVG pixel coordinates
 */
export function penroseToSVG(penrose: PenrosePoint, cx: number, cy: number, scale: number): Point {
	const halfPi = Math.PI / 2;
	return {
		x: cx + scale * penrose.R / halfPi,
		y: cy - scale * penrose.T / halfPi
	};
}

/**
 * Full chain: Schwarzschild → SVG
 */
export function schwarzschildToSVG(
	r: number,
	t: number,
	region: Region,
	cx: number,
	cy: number,
	scale: number
): Point {
	const kruskal = schwarzschildToKruskal(r, t, region);
	const penrose = kruskalToPenrose(kruskal);
	return penroseToSVG(penrose, cx, cy, scale);
}

/**
 * Kruskal → SVG (for singularity curves that are defined directly in Kruskal coords)
 */
export function kruskalToSVG(
	kruskal: KruskalPoint,
	cx: number,
	cy: number,
	scale: number
): Point {
	const penrose = kruskalToPenrose(kruskal);
	return penroseToSVG(penrose, cx, cy, scale);
}

/**
 * Generate Chebyshev nodes on interval [a, b] for n points.
 * Provides better sampling near endpoints where curves change rapidly.
 */
export function chebyshevNodes(a: number, b: number, n: number): number[] {
	const nodes: number[] = [];
	for (let k = 0; k < n; k++) {
		const theta = (Math.PI * (2 * k + 1)) / (2 * n);
		nodes.push((a + b) / 2 + ((b - a) / 2) * Math.cos(theta));
	}
	return nodes.sort((a, b) => a - b);
}
