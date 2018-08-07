"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require('commander');
const paprika_api_1 = require("paprika-api");
const puppeteer = require("puppeteer");
const PDK = require("node-pinterest");
const toml = require("toml");
const fs = require("fs");
const path_1 = require("path");
var ProgressBar = require('ascii-progress');
if (fs.existsSync('config.toml')) {
    const filePath = path_1.join(__dirname, 'config.toml');
    var configData = toml.parse(fs.readFileSync(filePath, {
        encoding: 'utf-8'
    }));
}
else {
    fs.writeFileSync('config.toml', `[Pinterest]
PinterestUser = ""
PinterestPassword = ""
[Paprika]
PaprikaBookmarkletToken = ""
PaprikaUser = ""
PaprikaPassword = ""
[Dev]
PinterestToken = ""
`);
    console.log("a 'config.toml' file has been created please fill as instructed by readme.md");
    process.exit();
}
class PinterestDataHandler {
    constructor(token) {
        this.pinterest = PDK.init(token);
        this.links = [];
        this.options = {
            qs: {
                fields: "link",
                limit: 100
            }
        };
    }
    async geta(board, verbose) {
        var links = [];
        var target = board;
        try {
            do {
                var data = await this.pinterest.api(target, this.options);
                for (let element of await data.data) {
                    links.push(element.link);
                }
                target = data.page.next;
                if (verbose) {
                    console.log(target);
                }
            } while (target);
            return links;
        }
        catch (e) {
            console.error("issue with pinterest.api()");
            console.log(data);
            console.log(links);
            console.log(target);
            console.error(e);
        }
    }
}
const write_file = (file, data) => new Promise((resolve, reject) => {
    fs.writeFile(file, data, 'utf8', error => {
        if (error) {
            console.error(error);
            reject(false);
        }
        else {
            resolve(true);
        }
    });
});
const read_file = file => new Promise((resolve, reject) => {
    return fs.readFile(file, 'utf8', (error, data) => {
        if (error) {
            console.error(error);
            reject(false);
        }
        else {
            resolve(data);
        }
    });
});
function save_paprika_recipe() {
    var d = document;
    if (!d.body)
        return;
    try {
        var s = d.createElement('scr' + 'ipt');
        s.setAttribute('src', d.location.protocol + `//www.paprikaapp.com/bookmarklet/v1/?token=${configData.Paprika.PaprikaBookmarkletToken}&timestamp=` + (new Date().getTime()));
        d.body.appendChild(s);
    }
    catch (e) { }
}
;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function addPaprikaScript(linkArray, page, timeout, sleep, verbose, progress) {
    var fails = [];
    let paprikaApi = new paprika_api_1.PaprikaApi(configData.Paprika.PaprikaUser, configData.Paprika.PaprikaPassword);
    var paprikaRecipeCount = await paprikaApi.recipes().then((recipes) => {
        return recipes.length;
    });
    if (progress) {
        var bar = new ProgressBar({
            schema: ':bar, :precent',
            total: linkArray.length
        });
    }
    for (let recipe of linkArray) {
        if (progress) {
            bar.tick();
        }
        try {
            await page.goto(recipe, { timeout: timeout, waitUntil: 'networkidle0' }); // timeoutOptions
        }
        catch (e) {
            if (verbose) {
                console.error(`Issue loading: ${page.url()} \n ${e}`);
            }
            fails.push(page.url());
            continue;
        }
        let recipeURL = page.url();
        try {
            // await page.evaluate(save_paprika_recipe);
            await page.addScriptTag({
                url: `https://www.paprikaapp.com/bookmarklet/v1/?token=${configData.Paprika.PaprikaBookmarkletToken}&timestamp=` + (new Date().getTime())
            });
            await page.waitFor(sleep);
        }
        catch (e) {
            if (verbose) {
                console.error(`Issue with bookmarklet: ${e}`);
            }
        }
        paprikaApi.recipes().then((recipes) => {
            if (recipes.length > paprikaRecipeCount) {
                paprikaRecipeCount = recipes.length;
            }
            else {
                if (verbose) {
                    console.error(`FAILED: ${recipeURL}`);
                }
                fails.push(recipeURL);
            }
        });
    }
    return fails;
}
async function saveArrayToPaprika(linkArray, page, verbose, progress) {
    if (verbose) {
        console.log(`Amount of links: ${linkArray.length}`);
    }
    let fails = await addPaprikaScript(linkArray, page, 30000, 6000, verbose, progress);
    console.log(`RETRYING ${fails.length} FAILED LINKS`);
    let finalFails = await addPaprikaScript(fails, page, 120000, 12000, verbose, progress);
    console.log("Done");
    console.log("Following failed: " + finalFails + "see stderr for all errors");
    return finalFails;
}
;
async function openChromium(verbose) {
    if (verbose) {
        console.log("launching chromium...");
    }
    const browser = await puppeteer.launch({
        timeout: 120000,
        headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1000,
        height: 500
    });
    return {
        page: page,
        browser: browser
    };
}
async function loginToPinterest(page) {
    const USERNAME_SELECTOR = "#email";
    const PASSWORD_SELECTOR = "#password";
    const LOGIN_BTN_SELECTOR = "body > div:nth-child(1) > div > div > div:nth-child(1) > div > div > div:nth-child(4) > div:nth-child(1) > form > button";
    await page.goto("https://www.pinterest.com/login/", { timeout: 120000, waitUntil: 'networkidle0' });
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(configData.Pinterest.PinterestUser);
    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(configData.Pinterest.PinterestPassword);
    await page.click(LOGIN_BTN_SELECTOR);
    await page.waitForNavigation();
    await write_file('cookies.txt', JSON.stringify(await page.cookies()));
    return await page.cookies;
    return "Logged into Pinterest";
}
function convertUrlToBoard(str) {
    var loc = new URL(str);
    return 'boards' + loc.pathname + 'pins';
}
async function main(board, verbose, progress) {
    try {
        const { page, browser } = await openChromium(verbose);
        if (fs.existsSync('cookies.txt')) {
            const cookie = await read_file('cookies.txt') || '[]'; // type issues
            await page.setCookie(...JSON.parse(cookie));
        }
        else {
            console.log(await loginToPinterest(page));
        }
        await saveArrayToPaprika(await pin.geta(board, verbose), page, verbose, progress);
        await browser.close();
    }
    catch (err) {
        console.log(`ISSUE WITH GETTING PINS ${err}`);
    }
}
function cli() {
    program
        .arguments('<url>')
        .option('-u, --username <username>', 'Paprika sync email')
        .option('-p, --password <password>', 'Paprika sync password')
        .option('-t, --token <token>', 'Pinterest User Token')
        .option('-b, --bookmarklet-token <bookmarklet>', 'Paprika bookmarklet')
        .option('-v, --verbose', 'Print more stuff')
        .option('-l, --progress', 'show progress bar')
        .action(function () {
        if (program.username) {
            configData.Paprika.PaprikaUser = program.username;
        }
        else if (program.password) {
            configData.Paprika.PaprikaPassword = program.password;
        }
        else if (program.token) {
            configData.Dev.PinterestToken = program.token;
        }
        else if (program.bookmarklet) {
            configData.Paprika.PaprikaBookmarkletToken = program.bookmarklet;
        }
    })
        .parse(process.argv);
    return { boardURL: program.args[0], verbose: program.verbose, progress: program.progress };
}
const { boardURL, verbose, progress } = cli();
const board = convertUrlToBoard(boardURL);
const token = configData.Dev.PinterestToken;
var pin = new PinterestDataHandler(token);
main(board, verbose, progress);
//# sourceMappingURL=index.js.map