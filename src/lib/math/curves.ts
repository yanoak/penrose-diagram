import type { Point, KruskalPoint, Region } from './types';
import { schwarzschildToKruskal, kruskalToPenrose, penroseToSVG, kruskalToSVG, chebyshevNodes } from './coordinates';

/**
 * Diamond boundary vertices in SVG coordinates.
 * i⁺ (top), i⁰ right, i⁻ (bottom), i⁰ left
 */
export function diamondVertices(cx: number, cy: number, scale: number): Point[] {
	return [
		{ x: cx, y: cy - scale },         // i⁺ (top)
		{ x: cx + scale, y: cy },          // i⁰ (right)
		{ x: cx, y: cy + scale },          // i⁻ (bottom)
		{ x: cx - scale, y: cy }           // i⁰ (left)
	];
}

/**
 * Generate singularity curve (r = 0) in SVG coordinates.
 * In Kruskal coords: T_K² - X_K² = 1, so T_K = ±√(1 + X_K²)
 */
export function singularityCurve(
	future: boolean,
	cx: number,
	cy: number,
	scale: number,
	numPoints: number = 60
): Point[] {
	const points: Point[] = [];
	// Sweep X_K; the singularity extends over a finite range in Penrose coords
	const xRange = 8; // large enough to cover the diamond
	for (let i = 0; i <= numPoints; i++) {
		const frac = i / numPoints;
		const xK = -xRange + 2 * xRange * frac;
		const tK = (future ? 1 : -1) * Math.sqrt(1 + xK * xK);
		const pt = kruskalToSVG({ T: tK, X: xK }, cx, cy, scale);
		points.push(pt);
	}
	return points;
}

/**
 * Generate sharp zigzag along a base curve for singularity rendering.
 * Resamples the curve at equal arc-length intervals, then offsets every
 * other point by ±amplitude perpendicular to the local tangent.
 */
export function zigzagify(points: Point[], amplitude: number = 6, numTeeth: number = 20): Point[] {
	if (points.length < 2) return points;

	// Build cumulative arc-length table
	const cumLens: number[] = [0];
	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x;
		const dy = points[i].y - points[i - 1].y;
		cumLens.push(cumLens[i - 1] + Math.sqrt(dx * dx + dy * dy));
	}
	const totalLen = cumLens[cumLens.length - 1];
	if (totalLen === 0) return points;

	// Number of zigzag vertices = 2 * numTeeth + 1 (peak, valley, peak, ...)
	const numSamples = numTeeth * 2 + 1;
	const result: Point[] = [];

	for (let s = 0; s < numSamples; s++) {
		const frac = s / (numSamples - 1);
		const targetLen = frac * totalLen;

		// Find segment containing this arc length
		let seg = 0;
		for (let i = 1; i < cumLens.length; i++) {
			if (cumLens[i] >= targetLen) {
				seg = i - 1;
				break;
			}
		}

		// Interpolate position along segment
		const segLen = cumLens[seg + 1] - cumLens[seg];
		const t = segLen > 0 ? (targetLen - cumLens[seg]) / segLen : 0;
		const px = points[seg].x + t * (points[seg + 1].x - points[seg].x);
		const py = points[seg].y + t * (points[seg + 1].y - points[seg].y);

		// Tangent direction from the segment
		const tx = points[seg + 1].x - points[seg].x;
		const ty = points[seg + 1].y - points[seg].y;
		const tLen = Math.sqrt(tx * tx + ty * ty);

		if (tLen === 0) {
			result.push({ x: px, y: py });
			continue;
		}

		// Normal (perpendicular to tangent)
		const nx = -ty / tLen;
		const ny = tx / tLen;

		// Alternate +/- for sharp zigzag: even samples go one way, odd the other
		const sign = s % 2 === 0 ? 1 : -1;

		result.push({
			x: px + nx * amplitude * sign,
			y: py + ny * amplitude * sign
		});
	}

	return result;
}

function pathLength(points: Point[]): number {
	let len = 0;
	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x;
		const dy = points[i].y - points[i - 1].y;
		len += Math.sqrt(dx * dx + dy * dy);
	}
	return len;
}

/**
 * Generate a constant-r curve in a given region.
 */
export function constantRCurve(
	r: number,
	region: Region,
	cx: number,
	cy: number,
	scale: number,
	numPoints: number = 80
): Point[] {
	const points: Point[] = [];
	// Sweep t from -tMax to tMax using Chebyshev nodes for better sampling.
	// Curves close to r=1 need larger t range to fully extend across the diagram.
	let tMax: number;
	if (region === 'II' || region === 'IV') {
		tMax = r < 0.1 ? 3 : r < 0.5 ? 6 : 10;
	} else {
		// Exterior: curves very close to r=1 need huge t sweep
		tMax = r < 1.1 ? 20 : r < 2 ? 15 : 12;
	}

	const tValues = chebyshevNodes(-tMax, tMax, numPoints);

	for (const t of tValues) {
		try {
			const kruskal = schwarzschildToKruskal(r, t, region);
			// Skip points that would be numerically problematic
			if (!isFinite(kruskal.T) || !isFinite(kruskal.X)) continue;
			if (Math.abs(kruskal.T) > 100 || Math.abs(kruskal.X) > 100) continue;

			const penrose = kruskalToPenrose(kruskal);
			const pt = penroseToSVG(penrose, cx, cy, scale);
			points.push(pt);
		} catch {
			continue;
		}
	}
	return points;
}

/**
 * Generate a constant-t curve in a given region.
 * For constant t, we sweep r while keeping t fixed.
 */
export function constantTCurve(
	t: number,
	region: Region,
	cx: number,
	cy: number,
	scale: number,
	numPoints: number = 80
): Point[] {
	const points: Point[] = [];

	let rMin: number, rMax: number;
	if (region === 'I' || region === 'III') {
		// Exterior: r from very close to 1 (horizon) to large r
		rMin = 1 + 1e-6;
		rMax = 30;
	} else {
		// Interior: r from just above 0 to very close to 1 (horizon)
		rMin = 0.001;
		rMax = 1 - 1e-6;
	}

	const rValues = chebyshevNodes(rMin, rMax, numPoints);

	// At r=1 (horizon), Kruskal coords → (0,0) → Penrose center.
	// Explicitly include the center point so curves visually meet there.
	const centerPt: Point = { x: cx, y: cy };

	if (region === 'II' || region === 'IV') {
		// Interior: sweep r from 0 toward 1, then add center
		for (const r of rValues) {
			try {
				const kruskal = schwarzschildToKruskal(r, t, region);
				if (!isFinite(kruskal.T) || !isFinite(kruskal.X)) continue;
				if (Math.abs(kruskal.T) > 100 || Math.abs(kruskal.X) > 100) continue;
				const penrose = kruskalToPenrose(kruskal);
				points.push(penroseToSVG(penrose, cx, cy, scale));
			} catch { continue; }
		}
		points.push(centerPt);
	} else {
		// Exterior: start from center, sweep r from 1 outward
		points.push(centerPt);
		for (const r of rValues) {
			try {
				const kruskal = schwarzschildToKruskal(r, t, region);
				if (!isFinite(kruskal.T) || !isFinite(kruskal.X)) continue;
				if (Math.abs(kruskal.T) > 100 || Math.abs(kruskal.X) > 100) continue;
				const penrose = kruskalToPenrose(kruskal);
				points.push(penroseToSVG(penrose, cx, cy, scale));
			} catch { continue; }
		}
	}

	return points;
}

/**
 * Generate constant-r curve values to display.
 * Returns nicely distributed r values in exterior and interior.
 */
export function generateRValues(count: number): { r: number; regions: Region[] }[] {
	if (count === 0) return [];
	const result: { r: number; regions: Region[] }[] = [];

	// Split between exterior and interior
	const exteriorCount = Math.ceil(count / 2);
	const interiorCount = count - exteriorCount;

	// Exterior r values (r > 1): start very close to horizon, spread outward
	const exteriorRs = [1.01, 1.03, 1.07, 1.15, 1.3, 1.5, 2, 2.5, 3, 4, 5, 8, 20];
	for (let i = 0; i < exteriorCount && i < exteriorRs.length; i++) {
		result.push({ r: exteriorRs[i], regions: ['I', 'III'] });
	}

	// Interior r values (0 < r < 1): start close to horizon, spread toward singularity
	const interiorRs = [0.95, 0.9, 0.8, 0.65, 0.5, 0.35, 0.2, 0.1];
	for (let i = 0; i < interiorCount && i < interiorRs.length; i++) {
		result.push({ r: interiorRs[i], regions: ['II', 'IV'] });
	}

	return result;
}

/**
 * Generate constant-t values to display.
 */
export function generateTValues(count: number): { t: number; regions: Region[] }[] {
	if (count === 0) return [];
	const result: { t: number; regions: Region[] }[] = [];

	// Generate symmetric t values
	const tValues: number[] = [0];
	const steps = [0.5, 1, 1.5, 2, 3, 4, 6];
	for (let i = 0; i < steps.length && tValues.length < count; i++) {
		tValues.push(steps[i]);
		if (tValues.length < count) {
			tValues.push(-steps[i]);
		}
	}

	for (let i = 0; i < count && i < tValues.length; i++) {
		result.push({ t: tValues[i], regions: ['I', 'II', 'III', 'IV'] });
	}

	return result;
}

/**
 * Generate light cone indicators at sample points.
 * Returns pairs of lines (past and future light cone).
 */
export function lightConePositions(cx: number, cy: number, scale: number): { center: Point; region: string }[] {
	const positions: { center: Point; region: string }[] = [];

	// Place light cones at a few representative points in each region
	const samplePoints: { T: number; R: number; label: string }[] = [
		// Region I
		{ T: 0, R: 0.35, label: 'I' },
		// Region II
		{ T: 0.35, R: 0, label: 'II' },
		// Region III
		{ T: 0, R: -0.35, label: 'III' },
		// Region IV
		{ T: -0.35, R: 0, label: 'IV' },
	];

	const halfPi = Math.PI / 2;
	for (const sp of samplePoints) {
		positions.push({
			center: {
				x: cx + scale * sp.R / halfPi,
				y: cy - scale * sp.T / halfPi
			},
			region: sp.label
		});
	}

	return positions;
}
