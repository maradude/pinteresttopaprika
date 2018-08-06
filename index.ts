var program = require('commander');
import {
    PaprikaApi
} from 'paprika-api';
import * as puppeteer from 'puppeteer';
import * as PDK from 'node-pinterest'
import * as toml from 'toml';
import * as fs from 'fs';
import * as request from 'request'
import {
    join
} from 'path';

interface PinterestConfig {
    PinterestPassword: string;
    PinterestUser: string;
}

interface PaprikaConfig {
    PaprikaBookmarkletToken: string;
    PaprikaUser: string;
    PaprikaPassword: string;
}

interface DevConfig {
    PinterestToken: string;
    PinterestAppID: string;
    PinterestAppSecret: string;
}

interface Config {
    Pinterest: PinterestConfig;
    Paprika: PaprikaConfig;
    Dev: DevConfig;
}

interface PinterestData {
    link: string;
    id: string;
}

interface PinterestPage {
    cursor: string;
    next: string;
}

interface PinterestJSON {
    data: PinterestData[];
    page: PinterestPage;

}

if (fs.existsSync('config.toml')) {
const filePath = join(__dirname, 'config.toml');
var configData: Config = toml.parse(fs.readFileSync(filePath, {
    encoding: 'utf-8'
}))} else {
    fs.writeFileSync('config.toml', `[Pinterest]
PinterestUser = ""
PinterestPassword = ""
[Paprika]
PaprikaBookmarkletToken = ""
PaprikaUser = ""
PaprikaPassword = ""
[Dev]
PinterestAppID = ""
PinterestAppSecret = ""
PinterestToken = ""
`)
console.log("a 'config.toml' file has been created please fill as instructed by readme.md")
process.exit()
}

class PinterestDataHandler {
    pinterest;
    options: Object;
    links: Array < string > ;
    constructor(token: string) {
        this.pinterest = PDK.init(token)
        this.links = []
        this.options = {
            qs: {
                fields: "link",
                limit: 100
            }
        };
    }

    async getToken(page: puppeteer.Page) {
        const redirect_uri = "https://localhost/"
        const client_id = configData.Dev.PinterestAppID
        const scope = "read_public"
        const state = "768uyFys"

        const url = `https://api.pinterest.com/oauth/?response_type=code&redirect_uri=${redirect_uri}&client_id=${client_id}&scope=${scope}&state=${state}`
        await page.goto(url)
        await page.click("#dialog_footer > button:nth-child(2)")
        await page.waitForNavigation()
        const response = new URL(page.url())

        const authCode = response.searchParams.get('code')
        const client_secret = configData.Dev.PinterestAppSecret
        const accessToken = `https://api.pinterest.com/v1/oauth/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${client_secret}&code=${authCode}`
        request.get(accessToken).pipe(fs.createWriteStream('token_response'))


    }

    async geta(board: string) {
        var links = []
        var target = board
        try {
            do {
                var data: PinterestJSON = await this.pinterest.api(target, this.options)
                for (let element of await data.data) {
                    links.push(element.link)
                }
                target = data.page.next
                console.log(target)
            } while (target);
            return links
        } catch (e) {
            console.error("issue with pinterest.api()")
            console.log(data)
            console.log(links)
            console.log(target)
            console.error(e)
        }
    }
}
const write_file = (file, data) => new Promise((resolve, reject) => {
    fs.writeFile(file, data, 'utf8', error => {
        if (error) {
            console.error(error);

            reject(false);
        } else {
            resolve(true);
        }
    });
});

const read_file = file => new Promise((resolve, reject) => {
    return fs.readFile(file, 'utf8', (error, data) => {
        if (error) {
            console.error(error);

            reject(false);
        } else {
            resolve(data);
        }
    });
});

function save_paprika_recipe() {
    var d = document;
    if (!d.body) return;
    try {
        var s = d.createElement('scr' + 'ipt');
        s.setAttribute('src', d.location.protocol + `//www.paprikaapp.com/bookmarklet/v1/?token=${configData.Paprika.PaprikaBookmarkletToken}&timestamp=` + (new Date().getTime()));
        d.body.appendChild(s);
    } catch (e) {}
};

const timeoutOptions = { timeout:120000, waitUntil:'networkidle0'}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveArrayToPaprika(linkArray: Array < string > , page: puppeteer.Page, browser: puppeteer.Browser) {
    console.log(`LinkArray for saveArrayToPaprika: ${linkArray}`)
    var fails: Array < string > = []
    let paprikaApi = new PaprikaApi(configData.Paprika.PaprikaUser, configData.Paprika.PaprikaPassword);
    var paprikaRecipeCount: number = await paprikaApi.recipes().then((recipes) => {
        return recipes.length
    });
    for (let recipe of linkArray) {
        await page.goto(recipe, { timeout: 300000, waitUntil:'networkidle0'}); // timeoutOptions
        console.log(`Page loaded... ${recipe}`);
        try {
            // await page.evaluate(save_paprika_recipe);
            await page.addScriptTag({
                url: `https://www.paprikaapp.com/bookmarklet/v1/?token=${configData.Paprika.PaprikaBookmarkletToken}&timestamp=` + (new Date().getTime())
            })
            await page.waitFor(6000)
        } catch (e) {
            console.error(e);
        }
        console.log(`Script added`)
        paprikaApi.recipes().then((recipes) => {
            if (recipes.length > paprikaRecipeCount) {
                paprikaRecipeCount = recipes.length;
            } else {
                console.error(`FAILED: ${recipe}`)
                fails.push(recipe)
            }

        });
    }
    console.log("Done")

    console.log("Following failed: " + fails + "see stderr for all errors")
    return fails
};

async function openChromium() {
    console.log("launching chromium...")
    const browser = await puppeteer.launch({
        timeout: 120000,
        headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1000,
        height: 500
    });
    console.log("Browser open...")
    return {
        page: page,
        browser: browser
    }
}

async function loginToPinterest(page: puppeteer.Page) {
    const USERNAME_SELECTOR = "#email"
    const PASSWORD_SELECTOR = "#password"
    const LOGIN_BTN_SELECTOR = "body > div:nth-child(1) > div > div > div:nth-child(1) > div > div > div:nth-child(4) > div:nth-child(1) > form > button"

    await page.goto("https://www.pinterest.com/login/", {timeout:120000, waitUntil:'networkidle0'})

    await page.click(USERNAME_SELECTOR)
    await page.keyboard.type(configData.Pinterest.PinterestUser)

    await page.click(PASSWORD_SELECTOR)
    await page.keyboard.type(configData.Pinterest.PinterestPassword)

    await page.click(LOGIN_BTN_SELECTOR)

    await page.waitForNavigation()
    await write_file('cookies.txt', JSON.stringify(await page.cookies()))
    return await page.cookies

    return "Logged into Pinterest"
}

function convertUrlToBoard(str: string) {
    var loc: URL = new URL(str);
    return 'boards' + loc.pathname + 'pins'
}

async function main(board) {
    try {
        const {
            page,
            browser
        } = await openChromium()
        if (fs.existsSync('cookies.txt')) {
            const cookie: any = await read_file('cookies.txt') || '[]' // type issues
            await page.setCookie(...JSON.parse(cookie))
        } else {
            console.log(await loginToPinterest(page))
        }
        if (!configData.Dev.PinterestToken) {
            try {
                pin.getToken(page)
            } catch (e) {
                console.error(`Issue gathering access token: ${e}`)
            }
        }
        await saveArrayToPaprika(await pin.geta(board), page, browser)
        await browser.close();
    } catch (err) {
        console.log(`ISSUE WITH GETTING PINS ${err}`)
    }
}

function cli() {
    program
        .arguments('<url>')
        .option('-u, --username <username>', 'Paprika sync email')
        .option('-p, --password <password>', 'Paprika sync password')
        .option('-t, --token <token>', 'Pinterest User Token')
        .option('-b, --bookmarklet-token <bookmarklet>', 'Paprika bookmarklet')
        .action(function () {
            if (program.username) {
                configData.Paprika.PaprikaUser = program.username
            } else if (program.password) {
                configData.Paprika.PaprikaPassword = program.password
            } else if (program.token) {
                configData.Dev.PinterestToken = program.token
            } else if (program.bookmarklet) {
                configData.Paprika.PaprikaBookmarkletToken = program.bookmarklet
            }
        })
        .parse(process.argv);
    return program.args[0]
}
const board = convertUrlToBoard(cli())
const token = configData.Dev.PinterestToken
var pin = new PinterestDataHandler(token);
main(board)