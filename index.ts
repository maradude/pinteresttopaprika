// import { PaprikaApi } from 'paprika-api';
import * as puppeteer from 'puppeteer';

// const testPage = "https://www.kingarthurflour.com/recipes/homemade-whole-grain-pancake-mix-recipe";
// const testPage = "https://www.seriouseats.com/2017/11/sweet-potato-quesadillas.html"
// const testPage = "https://www.budgetbytes.com/easy-homemade-teriyaki-sauce-or-marinade/"
// const testPage = "http://pastanjauhantaa.blogspot.com/2009/01/lohiceviche-salaattipedill.html"
const testPage = "https://www.jamieoliver.com/recipes/salmon-recipes/sorta-salmon-nicoise/"
// const paprika = "https://www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=1532454061328";

const paprika = {
    url:"https://www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=1532454061328",
    path:"",
    content:"",
    type:""
};

// TODO: check if recipe scrapping was succesfull, if not log url

const timeoutOptions = {
        // networkIdleTimeout: 5000,
        // waitUntil: 'networkidle',
        timeout: 3000000
    };

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 500 });
    console.log("wow")
    await page.goto(testPage, timeoutOptions);
    console.log("wow2")
    await page.addScriptTag(paprika)
    console.log("wow3")
    await page.reload(timeoutOptions)

    await browser.close();
})();

// let paprikaApi = new PaprikaApi('martti@aukia.com', 'aWDNrPw7Zyq');


// // paprikaApi.recipes().then((recipes) => {
// //     paprikaApi.recipe(recipes[0].uid).then((recipe) => {
// //         console.log(recipe);
// //     });
// // });

// console.log(paprikaApi.status())


// function save_paprika_recipe() {
//     var d = document;
//     if (!d.body) return;
//     try {
//         var s = d.createElement('scr' + 'ipt');
//         s.setAttribute('src', d.location.protocol + '//www.paprikaapp.com/bookmarklet/v1/?token=86fa45ba75900f87&timestamp=' + (new Date().getTime()));
//         d.body.appendChild(s);
//     }
//     catch (e) { }
// };
// save_paprika_recipe();
// void (0);
