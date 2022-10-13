import { describe, expect, it } from 'vitest'
import { getSlideHeightRespectingAspectAsPossible } from "../packages/client/utils"

describe('client', () => {
    describe('utils', () => {
        it('getSlideHeightRespectingAspectAsPossible', () => {
            expect(getSlideHeightRespectingAspectAsPossible(400, 16 / 9)).toBe(225);
            expect(getSlideHeightRespectingAspectAsPossible(960, 16 / 9)).toBe(540);
            expect(getSlideHeightRespectingAspectAsPossible(980, 16 / 9)).toBe(552);
            expect(getSlideHeightRespectingAspectAsPossible(1280, 16 / 9)).toBe(720);
            expect(getSlideHeightRespectingAspectAsPossible(1920, 16 / 9)).toBe(1080);
            expect(getSlideHeightRespectingAspectAsPossible(2560, 16 / 9)).toBe(1440);
            expect(getSlideHeightRespectingAspectAsPossible(3840, 16 / 9)).toBe(2160);
        });
    });
});
