import type { ScoreStep } from './run';

export function formatMult(mult: number): string {
    return Number.isInteger(mult) ? String(mult) : mult.toFixed(1);
}

// +5 for buffs, −5 for debuffs
function signed(n: number): string {
    return `${n < 0 ? '−' : '+'}${formatMult(Math.abs(n))}`;
}

export function stepText(step: ScoreStep): string {
    const parts: string[] = [];
    if (step.chips) parts.push(`${signed(step.chips)} chips`);
    if (step.mult) parts.push(`${signed(step.mult)} mult`);
    if (step.xmult) parts.push(`×${formatMult(step.xmult)} mult`);
    return parts.length ? parts.join(', ') : 'no effect';
}

// True when a scoring step takes something away
export function isDebuff(step: ScoreStep): boolean {
    return (step.chips ?? 0) < 0 || (step.mult ?? 0) < 0 || (step.xmult !== undefined && step.xmult < 1);
}
