import { PaprikaApi } from 'paprika-api';
import * as puppeteer from 'puppeteer';
import * as rm from 'typed-rest-client'

interface Board {
    data: Array<Data>;
    page: Page;
}

interface Data {
    url: string;
    note: string;
    link: string;
    id: string;
}

interface Page {
    cursor: string;
    next: string;
}

async function getPins(boardName: string) {
    /*
    gathers urls from given url
    */
    let rest: rm.RestClient = new rm.RestClient('demo-app')
    // let params = { access_token: access_token_martti, limit: 100}
    console.log(boardName)
    let data = await rest.get<Board>(boardName)
    let board: Board = data["result"]
    getLinks(board)
}

function getLinks(board: Board) {
    for (let item in board["data"]) {
        console.log(item["link"]) // replace with paprika function
    }
    console.log(board)
    if (board["page"]["next"]) {
        setTimeout(() => {
            getPins(board["page"]["next"])
        }, 5000);
    }
}

function parseBoard(url:string) {
    /*
    modify url into just the name of the board, add options and pass string to getPins
    */
    if (url.lastIndexOf('/') == url.length - 1) {
        var slice_value = -3
    }
    else {
        var slice_value = -3
    }
    let board: string = 'boards/' + url.split('/').slice(slice_value).join('/') + 'pins'
    let url_params = `?access_token=${access_token_martti}&limit=100`
    let boardSection = pinterestBaseUrl + board + url_params
    getPins(boardSection)
}

/*
1. log in to paprika
2. parse pinterest board urs
3. parse pinterest usr boards
4. JSON file as input
*/

const testPage = "https://www.jamieoliver.com/recipes/salmon-recipes/sorta-salmon-nicoise/"

const pinterestBaseUrl = "https://api.pinterest.com/v1/"

const paprika = {
    //url:"https://www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=1532454061328",
    //url:"",
    path:"./savePaprika.js",
    // content:"",
    //type:""
};
const access_token_martti = "AoWd6Hg6z0Dyn-PymT9oQfXV8xU7FUSedqkYzrlFGysiFIA-tgU8ADAAAPAkRRvEhf_AOzEAAAAA&state=768uyFys"
// const access_code_martti = "06a3c044209cd720"

// /*
// example request:
// https://api.pinterest.com/v1/boards/aukia/recipes-for-the-impatient/pins/
// ?access_token=AoWd6Hg6z0Dyn-PymT9oQfXV8xU7FUSedqkYzrlFGysiFIA-tgU8ADAAAPAkRRvEhf_AOzEAAAAA&state=768uyFys
// &limit=100
// */

// // TODO: check if recipe scrapping was succesfull, if not log url

const recipeList = ["https://www.kotikokki.net/reseptit/nayta/224721/Jauhelihak%C3%A4%C3%A4ryleet/",
    "https://www.kotikokki.net/reseptit/nayta/34852/Pizzapohja%20%28pellillinen%29/",
    "https://www.kotikokki.net/reseptit/nayta/137/Makaronilaatikko/",
    "https://www.kotikokki.net/reseptit/nayta/113651/Karjalanpaisti/",
    "https://www.kotikokki.net/reseptit/nayta/85886/BROILERIGRATIINI/",
    "https://www.kotikokki.net/reseptit/nayta/42423/Pizza%20Dennis/"
]

const recipeList2 = [
    "https://www.kotikokki.net/reseptit/nayta/84941/Kaalilaatikko/",
    "https://www.kotikokki.net/reseptit/nayta/46056/Mets%C3%A4nvartijan%20ROSVOPAISTI/",
    "https://www.kotikokki.net/reseptit/nayta/65923/Lihapullat/",
    "https://www.kotikokki.net/reseptit/nayta/37662/Lanttulaatikko/",
    "https://www.kotikokki.net/reseptit/nayta/2048/Kanapasta/"
]

function save_paprika_recipe() {
    var d = document;
    if (!d.body) return;
    try {
        var s = d.createElement('scr' + 'ipt');
        s.setAttribute('src', d.location.protocol + '//www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=' + (new Date().getTime()));
        d.body.appendChild(s);
    } catch (e) { }
};

const timeoutOptions = {
        // networkIdleTimeout: 5000,
        // waitUntil: 'networkidle',
    timeout: 60000
    };

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//const pap_script = "function save_paprika_recipe(){var d=document;if(!d.body)return;try{var s=d.createElement('scr'+'ipt');s.setAttribute('src',d.location.protocol+'//www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp='+(new Date().getTime()));d.body.appendChild(s);}catch(e){}};save_paprika_recipe()"

(async () => {
    console.log("function start")
    const browser = await puppeteer.launch();
    // const browser = await puppeteer.launch({ headless: false })
    console.log("puppeteer open")
    const page = await browser.newPage();
    console.log("new page open")
    await page.setViewport({ width: 1000, height: 500 });
    console.log("Browser open...")
    for (let recipe of recipeList2) {
        await page.goto(recipe, timeoutOptions);
        console.log(`Page loaded... ${recipe}`);
        try {
            // var x = await page.addScriptTag(paprika);
            //var x = await page.addScriptTag({content: 'https:' + '//www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=' + (new Date().getTime())})
            //var x = await page.evaluate(save_paprika_recipe);
            var x = page.evaluate(save_paprika_recipe);
            await sleep(8000);
        } catch(e) {
            console.log(e);
        }
        console.log(`Script added`)
        await page.reload(timeoutOptions)
    }
    console.log("Done")

    await browser.close();
})();

// let paprikaApi = new PaprikaApi('martti@aukia.com', 'aWDNrPw7Zyq');


// // paprikaApi.recipes().then((recipes) => {
// //     paprikaApi.recipe(recipes[0].uid).then((recipe) => {
// //         console.log(recipe);
// //     });
// // });

// console.log(paprikaApi.status())


// // function save_paprika_recipe() {
// //     var d = document;
// //     if (!d.body) return;
// //     try {
// //         var s = d.createElement('scr' + 'ipt');
// //         s.setAttribute('src', d.location.protocol + '//www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=' + (new Date().getTime()));
// //         d.body.appendChild(s);
// //     }
// //     catch (e) { }
// };
// save_paprika_recipe();
// void (0);


// parseBoard("https://fi.pinterest.com/aukia/recipes-for-the-impatient/")
