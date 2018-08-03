import {
    PaprikaApi
} from 'paprika-api';
import * as puppeteer from 'puppeteer';
// var PDK = require('node-pinterest');
import * as PDK from 'node-pinterest'
import * as toml from 'toml';
import * as fs from 'fs';
import {join} from 'path';

/*
0. Rewrite code into OOPh
*/
/*
1. log in to paprika
2. parse pinterest board urs
3. parse pinterest usr boards
4. JSON file as input
*/

interface Config {
    PinterestToken: string;
    PaprikaBookmarkletToken: string;
    PaprikaUser: string;
    PaprikaPassword: string;
}

interface PinterestData {
    link: string;
    id: string;
}

interface PinterestPage {
    cursor: string;
    next: string;
}

interface PinterestJSON{
    data: Array<PinterestData>
    page: PinterestPage
}

const filePath = join(__dirname, 'config.toml');
const configData: Config = toml.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
console.log(configData.PinterestToken)

class PinteresttoPaprika{
    pinterest;
    constructor(token: string){
        this.pinterest = PDK.init(configData.PinterestToken)
    }
}

const access_token_martti: string = "AoWd6Hg6z0Dyn-PymT9oQfXV8xU7FUSedqkYzrlFGysiFIA-tgU8ADAAAPAkRRvEhf_AOzEAAAAA"
var pinterest = PDK.init(access_token_martti);


const options = {
    qs: {
        fields: "link",
        limit: 20
    }
};
async function getLinks(JSONBoard: PinterestJSON, Arr: Array<string>) {
    for (let data of JSONBoard.data) {
        Arr.push(data.link);
    }
    if (JSONBoard.page) {
        const links = pinterest.api(JSONBoard.page.next, options).then((result) => {
            console.log(result)
            getLinks(result, Arr)
    }).catch((err) => {
            console.log(`SUCCESSIVE PINTEREST API CALL ERROR ${err}`)
    });
}
    return Arr
}
async function getPins(boardName: string) {
    const links = pinterest.api(boardName, options).then((result) => {
        console.log(result)
        getLinks(result, [])
    }).catch((err) => {
        console.log(`INITIAL PINTEREST API CALL ERROR: ${err}`)
    });
    var linkArray: Array<string> = [];
    linkArray.concat(links);
    console.log(`Following LINKS: ${linkArray}`);
    return linkArray
}

function save_paprika_recipe() {
    var d = document;
    if (!d.body) return;
    try {
        var s = d.createElement('scr' + 'ipt');
        s.setAttribute('src', d.location.protocol + '//www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=' + (new Date().getTime()));
        d.body.appendChild(s);
    } catch (e) {}
};

const timeoutOptions = {
    timeout: 60000
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveArrayToPaprika(linkArray: Array<string>) {
    var fails: Array<string> = []
    let paprikaApi = new PaprikaApi('martti@aukia.com', 'aWDNrPw7Zyq');
    var paprikaRecipeCount: number = await paprikaApi.recipes().then((recipes) => {
        return recipes.length
    });
    console.log("function start")
    const browser = await puppeteer.launch();
    console.log("puppeteer open")
    const page = await browser.newPage();
    console.log("new page open")
    await page.setViewport({
        width: 1000,
        height: 500
    });
    console.log("Browser open...")
    for (let recipe of linkArray) {
        await page.goto(recipe, timeoutOptions);
        console.log(`Page loaded... ${recipe}`);
        try {
            var x = page.evaluate(save_paprika_recipe);
            await sleep(10000);
        } catch (e) {
            console.log(e);
        }
        console.log(`Script added`)
        paprikaApi.recipes().then((recipes) => {
            if (recipes.length > paprikaRecipeCount) {
                paprikaRecipeCount = recipes.length;
            } else {
                fails.push(recipe)
            }

        });
        await page.reload(timeoutOptions)
    }
    console.log("Done")

    await browser.close();
    console.log(fails)
    return fails
};

function convertUrlToBoard(str: string) {
    var loc: URL = new URL(str);
    return 'boards' + loc.pathname + 'pins'
}

// let testBoard = 'boards/aukia/recipes-for-the-impatient/pins'
let testBoard = convertUrlToBoard('https://fi.pinterest.com/aukia/recipes-for-bbq/')
getPins(testBoard).then((result) => {
    saveArrayToPaprika(result)
}).catch((err) => {
    console.log(`ISSUE WITH GETTING PINS ${err}`)
});;

// let paprikaApi = new PaprikaApi('martti@aukia.com', 'aWDNrPw7Zyq');

// paprikaApi.recipes().then((recipes) => {
//     console.log(recipes.length)
// });

// console.log(paprikaApi.status())
// export { convertUrlToBoard, saveArrayToPaprika, getPins, getLinks }