import type { ScoreStep } from './run';

export function formatMult(mult: number): string {
    return Number.isInteger(mult) ? String(mult) : mult.toFixed(1);
}

export function stepText(step: ScoreStep): string {
    const parts: string[] = [];
    if (step.chips) parts.push(`+${step.chips} chips`);
    if (step.mult) parts.push(`+${formatMult(step.mult)} mult`);
    if (step.xmult) parts.push(`×${formatMult(step.xmult)} mult`);
    return parts.length ? parts.join(', ') : 'no effect';
}
