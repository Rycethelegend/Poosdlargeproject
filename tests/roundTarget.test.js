const {roundTarget, tableBaseTarget} = require("../multiplayer/rules");
const TABLE_TARGETS = [250, 600, 1300, 2600, 4800, 8500, 14000, 22000];
const LATE_GROWTH = 1.6;
const ROUND_SCALES = [1, 1.5, 2];


describe("checks if the roundTarget function", () => {
    test("returns something for table 3 and round 5", () => {
        expect(roundTarget(3, 2)).toBe(Math.round(tableBaseTarget(3) * ROUND_SCALES[2]));
    });

    test("returns  for table 0 and round 0", () => {
        expect(roundTarget(0, 0)).toBe(Math.round(tableBaseTarget(0) * ROUND_SCALES[0]));
    })
});