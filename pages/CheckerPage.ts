import { Page, BrowserContext, Expect, expect } from '@playwright/test';

export class CheckerPage {
  constructor(private page: Page, private context: BrowserContext, private expect: Expect) { }
  async getBoard() {
    let listOfRows = this.page.locator('#board > .line');
    await listOfRows.first().waitFor({ state: 'visible', timeout: 50000 });
    let map = new Map();
    for (let row of await listOfRows.all()) {
      let listOfColumns = await row.locator('img').all();
      for (let column of listOfColumns) {
        await column.waitFor({ state: 'visible', timeout: 50000 });
        let spaceOwner = await column.getAttribute('src');
        let spaceName = await column.getAttribute('name');
        map.set(spaceName, spaceOwner);
        // console.log(spaceOwner);
      }
    }
    return map;

  }
  // Moves check from source to destination
  async makeMove(selectorFrom, selectorTo) {
    let fromLocator = "img[name='" + selectorFrom + "']";
    let toLocator = "img[name='" + selectorTo + "']";
    //click on source
    let sourceLocator = this.page.locator(fromLocator);
    await sourceLocator.waitFor({ state: 'attached', timeout: 50000 });
    await sourceLocator.click();
    // click on destination move
    let destLocator = this.page.locator(toLocator);
    destLocator.waitFor({ state: 'attached', timeout: 50000 });
    await destLocator.click();
    this.page.waitForLoadState('load', { timeout: 50000 });
    // this.page.waitForTimeout(10000);
  }
  async calculateNextMove(map: Map<string, string>) {
    // get map of simple moves
    let simpleMoves = new Map();
    // get map of move which will capture opponent check
    let captureMove = new Map();
    // loop through all checks identify my check for further move
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        let keyName = "space" + x + y;
        if (map.get(keyName) == "you1.gif") {
          let nextY = y + 1;
          let nextRightX = x - 1 >= 0 ? x - 1 : x;
          let nextLeftX = x + 1 <= 7 ? x + 1 : x;
          // If next left move is gray then add to simple move
          if (nextLeftX != x && map.get("space" + nextLeftX + nextY) == "gray.gif") {
            let value: String[] = [];
            if (simpleMoves.get(keyName)) {
              value = simpleMoves.get(keyName);
              value.push("space" + nextLeftX + nextY);
            } else {
              value.push("space" + nextLeftX + nextY);
            }
            simpleMoves.set(keyName, value);
          } else if (nextLeftX != x && map.get("space" + nextLeftX + nextY) == "me1.gif") {
            let value: String[] = [];
            // If next Left move is me1 and next to next left is emplty then add to capture move
            if ((nextY + 1) <= 8 && (nextLeftX + 1) < 8 && map.get("space" + (nextLeftX + 1) + (nextY + 1))?.includes("gray.gif")) {
              if (captureMove.get(keyName)) {
                value = captureMove.get(keyName);
                value.push("space" + (nextLeftX + 1) + (nextY + 1));
              } else {
                value.push("space" + (nextLeftX + 1) + (nextY + 1));
              }
              captureMove.set(keyName, value);
            }
          }
          /// Validate next move for right side
          if (nextRightX != x && map.get("space" + nextRightX + nextY)?.includes("gray.gif")) {
            let value: String[] = [];
            if (simpleMoves.get(keyName)) {
              value = simpleMoves.get(keyName);
              value.push("space" + nextRightX + nextY);
            } else {
              value.push("space" + nextRightX + nextY);
            }
            simpleMoves.set(keyName, value);
          } else if (nextRightX != x && map.get("space" + nextRightX + nextY) == "me1.gif") {
            // If next Right move is me1 and next to next Right is emplty then add to capture move
            if ((nextY + 1) <= 8 && (nextRightX - 1) >= 0 && map.get("space" + (nextRightX - 1) + (nextY + 1))?.includes("gray.gif")) {
              let value: String[] = [];
              if (captureMove.get(keyName)) {
                value = captureMove.get(keyName);
                value.push("space" + (nextRightX - 1) + (nextY + 1));
              } else {
                value.push("space" + (nextRightX - 1) + (nextY + 1));
              }
              captureMove.set(keyName, value);
            }
          }
        }
      }
    }

    // Prioritize capture moves over simple moves and return Preffered move
    if (captureMove.size > 0) {
      return await this.getPreferredMove(captureMove);
    } else {
      return await this.getPreferredMove(simpleMoves);
    }
  }

  // Prioritize move based on check close to the center
  async getPreferredMove(preferredMove: Map<string, string[]>) {
    let positionX;
    let positionY;
    let x = 0;
    let y = 8;

    // get the next move which closer to center and towords the bottom
    for (let key of preferredMove.keys()) {
      // this.expect(true, "Map Keys and Values: " + key + ":" + preferredMove.get(key)).toBe(true);
      // get x and y positions of source
      if (key != null) {
        x = parseInt(key.slice(5, 6)); // Extracts '0'
        y = parseInt(key.slice(6, 7)); // Extracts '9'
      }
      if (positionX == undefined && positionY == undefined) {
        positionY = y;
        positionX = x;
      } else if (y < positionY && x >= positionX && x <= 4) {
        positionY = y;
        positionX = x;
      }
    }
    // let value: String[] = [];
    let value = preferredMove.get("space" + positionX + positionY);
    // expect(true, "Current : space" + positionX + positionY + " Next: " + value).toBe(true);
    return ["space" + positionX + positionY, value ? value[0] : null];
  }
  /// It restarts the game
  async restartGame() {
    await this.page.getByText("Restart...").click();
    await this.page.waitForLoadState('load', { timeout: 50000 });
    this.expect(this.page.getByText("Select an orange piece to move.")).toBeVisible();
  }
}
