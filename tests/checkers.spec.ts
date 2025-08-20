import { test, expect } from '@playwright/test'
import { CheckerPage } from './../pages/CheckerPage';

//As per problem statement, this control the number of moves before restart of the game
let numberOfMaxMoveBeforeRestart = 5;
test.describe("Play checkers game till 5 moves", () => {
    test("Play checkers", async ({ page, context }) => {
        let checkerPage = new CheckerPage(page, context, expect);
        // Load checker game website
        await page.goto("https://www.gamesforthebrain.com/game/checkers/");
        await page.waitForLoadState();
        // Verify title of page
        expect(page).toHaveTitle("Checkers - Games for the Brain");

        //// Restart the game to ensure all checks are at right place
        await checkerPage.restartGame();

        // This will loop based on number of moves to be played before restart of the game
        for (let i = 0; i < numberOfMaxMoveBeforeRestart; i++) {
            let mapOfBoard = await checkerPage.getBoard();
            // get the next Move
            let nextMoveMap = await checkerPage.calculateNextMove(mapOfBoard);
            // add check to make sure next move is available. Error if use is not able to move further
            expect(nextMoveMap.length, "Next Moves available").toBeGreaterThan(0);
            await checkerPage.makeMove(nextMoveMap[0], nextMoveMap[1]);
        }
        //// Restart the game as expected number of moves are completed
        await checkerPage.restartGame();

    });
});


/*
Due to time contrain, code related to King place or when checks reach to last block are not added.
*/