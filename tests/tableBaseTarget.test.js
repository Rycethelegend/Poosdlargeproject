const {tableBaseTarget} = require("../multiplayer/rules");

const TABLE_TARGETS = [250, 600, 1300, 2600, 4800, 8500, 14000, 22000];
const LATE_GROWTH = 1.6;

describe("tests the table number", () => {
    test (" that is less than or equal to length of TABLE_TARGETS", () => {
        expect(tableBaseTarget(3)).toBe(TABLE_TARGETS[3 - 1]);
    });

    test(" that is greater than the length of TABLE_TARGETS", () => {
        expect(tableBaseTarget(9)).toBe(Math.round(22000 * LATE_GROWTH ** (9 - TABLE_TARGETS.length) / 500) * 500);
    });
});