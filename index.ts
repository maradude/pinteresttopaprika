import {
    PaprikaApi
} from 'paprika-api';
import * as puppeteer from 'puppeteer';
var PDK = require('node-pinterest');

/*
1. log in to paprika
2. parse pinterest board urs
3. parse pinterest usr boards
4. JSON file as input
*/
const access_token_martti = "AoWd6Hg6z0Dyn-PymT9oQfXV8xU7FUSedqkYzrlFGysiFIA-tgU8ADAAAPAkRRvEhf_AOzEAAAAA"
var pinterest = PDK.init(access_token_martti);


var options = {
    qs: {
        fields: "link",
        limit: 2
    }
};
async function getPins() {
    var linkArray = [];
    try {
        var pinterestJSON = await pinterest.api('boards/aukia/recipes-for-the-impatient/pins', options);
    } catch (e) {
        console.log(e)
    }
    for (let data of pinterestJSON.data) {
        linkArray.push(data.link);
    }
    if (pinterestJSON.page) {
        try {
            var pinterestNEXT = await pinterest.api(pinterestJSON.next, options);
            console.log(pinterestNEXT)
        } catch (e) {
            console.log(e)
        }
    }
    console.log(linkArray);
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

async function saveArrayToPaprika(linkArray) {
    var fails = []
    let paprikaApi = new PaprikaApi('martti@aukia.com', 'aWDNrPw7Zyq');
    var paprikaRecipeCount = await paprikaApi.recipes().then((recipes) => {
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
    return fails
};

// var links = getPins();
// saveArrayToPaprika(links);

let paprikaApi = new PaprikaApi('martti@aukia.com', 'aWDNrPw7Zyq');

paprikaApi.recipes().then((recipes) => {
    console.log(recipes.length)
});

// console.log(paprikaApi.status())
