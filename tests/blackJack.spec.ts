import { test, expect } from '@playwright/test'

let baseURL = "https://deckofcardsapi.com/api/deck";
let deck_id;
let draw_card_count=3;

test.describe("Black Jack API automation", () => {
    let deck_id:string;
    test("Select and shuffle new deck and get deck id", async ({ request }) => {
        let new_shuffle_deck_url = baseURL+"/new/shuffle/?deck_count=6";
        let response = await request.get(new_shuffle_deck_url);
        // Validate 200 response is received
        expect(response.ok()).toBeTruthy();
        const body = await response.json();

        // Validate Response based on Input value of 6 deck
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('deck_id');
        expect(body).toHaveProperty('remaining', 312);
        expect(body).toHaveProperty('shuffled', true);

        console.log('Deck ID:', body.deck_id);
        deck_id = body.deck_id;
    });
    test("Draw cards for user 1",async ({request})=>{
        expect(deck_id, "Deck id is generated").toBeTruthy();
        let draw_card_url = `${baseURL}/${deck_id}/draw/?count=${draw_card_count}`;

        // Draw for User 1
        let response = await request.get(draw_card_url);
        // Validate 200 response is received
        expect(response.ok()).toBeTruthy();
        let body = await response.json();
        expect(body.cards.length).toBe(draw_card_count);
        
        // Get total points based on cards for user 1
        let user1TotalValue = getBlackJackTotalValue (body.cards);  

        // Draw for user 2
        response = await request.get(draw_card_url);
        // Validate 200 response is received
        expect(response.ok()).toBeTruthy();
        body = await response.json();
        expect(body.cards.length).toBe(draw_card_count);
      
        // Get total points based on cards for user 2
        let user2TotalValue = getBlackJackTotalValue (body.cards);  

        expect.soft(user1TotalValue, "User 1 have black Jack?").toBe(21);
        expect.soft(user2TotalValue, "User 2 have black Jack?").toBe(21);
        
    })
    

})

function getBlackJackTotalValue(cards){
      let numberOfAce=0;
        let totalValue=0;
        for(let card of cards){   
            console.log(card.code+":"+card.value);
            // console.log(totalValue);         
            if(['ACE'].includes(card.value)){
                numberOfAce++;
                totalValue+=11;
            }
            else if(['KING','QUEEN','JACK',].includes(card.value) || card.value==0){
                totalValue+=10;
            }else{
                totalValue=totalValue + Number(card.value);
            }            
        }
        for(let i=0;i<numberOfAce;i++){
            if(totalValue>21){
                totalValue = totalValue-10;
            }
        }    
        // console.log(totalValue);
    return totalValue;
}