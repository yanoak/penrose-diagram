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

/**
 * Convert an array of points into a smooth SVG path string using
 * Catmull-Rom → cubic Bézier conversion.
 */
export function pointsToSmoothPath(points: Point[], tension: number = 0.5): string {
	if (points.length < 2) return '';
	if (points.length === 2) {
		return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
	}

	const alpha = tension;
	let d = `M${points[0].x},${points[0].y}`;

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[Math.max(0, i - 1)];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[Math.min(points.length - 1, i + 2)];

		// Catmull-Rom to cubic Bézier control points
		const cp1x = p1.x + (p2.x - p0.x) * alpha / 3;
		const cp1y = p1.y + (p2.y - p0.y) * alpha / 3;
		const cp2x = p2.x - (p3.x - p1.x) * alpha / 3;
		const cp2y = p2.y - (p3.y - p1.y) * alpha / 3;

		d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
	}

	return d;
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
/**
 * Compute the Penrose R_P coordinate at t=0 for a given r in the exterior (r > 1).
 * R_P = atan(√(r-1)·e^(r/2))
 */
function exteriorRToPenroseR(r: number): number {
	return Math.atan(Math.sqrt(r - 1) * Math.exp(r / 2));
}

/**
 * Compute the Penrose T_P coordinate at t=0 for a given r in the interior (r < 1).
 * At t=0: X_K=0, T_K=√(1-r)·e^(r/2), so T_P = atan(T_K)
 */
function interiorRToPenroseT(r: number): number {
	return Math.atan(Math.sqrt(1 - r) * Math.exp(r / 2));
}

/**
 * Find exterior r that maps to a target Penrose R_P value, using bisection.
 */
function penroseRToExteriorR(targetRP: number): number {
	let lo = 1 + 1e-8, hi = 100;
	for (let i = 0; i < 60; i++) {
		const mid = (lo + hi) / 2;
		if (exteriorRToPenroseR(mid) < targetRP) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / 2;
}

/**
 * Find interior r that maps to a target Penrose T_P value, using bisection.
 */
function penroseTToInteriorR(targetTP: number): number {
	let lo = 1e-6, hi = 1 - 1e-8;
	for (let i = 0; i < 60; i++) {
		const mid = (lo + hi) / 2;
		if (interiorRToPenroseT(mid) < targetTP) hi = mid;
		else lo = mid;
	}
	return (lo + hi) / 2;
}

export function generateRValues(count: number): { r: number; regions: Region[] }[] {
	if (count === 0) return [];
	const result: { r: number; regions: Region[] }[] = [];

	// Split between exterior and interior
	const exteriorCount = Math.ceil(count / 2);
	const interiorCount = count - exteriorCount;

	// Exterior r values: uniformly spaced in Penrose R_P from near 0 to near π/2
	const maxRP = Math.PI / 2 * 0.98;
	for (let i = 0; i < exteriorCount; i++) {
		const targetRP = maxRP * (i + 1) / (exteriorCount + 1);
		const r = penroseRToExteriorR(targetRP);
		result.push({ r, regions: ['I', 'III'] });
	}

	// Interior r values: uniformly spaced in Penrose T_P from near 0 to near π/4
	const maxTP = Math.PI / 4 * 0.98;
	for (let i = 0; i < interiorCount; i++) {
		const targetTP = maxTP * (i + 1) / (interiorCount + 1);
		const r = penroseTToInteriorR(targetTP);
		result.push({ r, regions: ['II', 'IV'] });
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
