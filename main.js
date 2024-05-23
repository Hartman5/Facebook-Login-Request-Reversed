import Facebook from "./modules/facebook.js";

/*
    Both proxied and non-proxied requests are working. Put your proxy inside the new Facebook() constructor.
*/

(async () => {
    const facebook = new Facebook();
    await facebook.init();
    console.log(await facebook.login('EMAIL/PHONE', 'PASSWORD'));
})();