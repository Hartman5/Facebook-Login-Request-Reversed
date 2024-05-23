import { request, ProxyAgent } from 'undici';
import { Cookie, CookieJar } from 'tough-cookie';

class FacebookUtility {
    static createJazoest(input) {
        const buf = Buffer.from(input, 'ascii');
        let sum = 0;
        for (let i = 0; i < buf.byteLength; i++) {
            sum += buf.readUInt8(i);
        }
        return parseInt(`2${sum}`);
    }

    static createDyn() {
        let module_list = [21, 24, 27, 32, 35, 39, 42, 46, 47, 54, 55, 56, 62, 67, 76, 82, 88, 93, 27468, 27472, 27473, 27474, 27475, 27476, 27478, 27479, 27480, 27481, 27482, 27483, 27484, 27560, 27589, 27590, 27594, 27595, 27596, 27597, 27598, 27599, 27600, 27601, 27602, 27603, 27604, 27605, 27606, 27607, 27609, 27611, 27612, 27613, 27614, 27615, 27616, 27617, 27618, 27619, 27620, 27621, 27622, 27623, 27624, 27625, 27628, 27707, 27708, 27790, 27811, 27812, 27813, 27818, 27819, 27821, 27822, 27823, 27970, 27972, 27973, 27974, 27975, 27976, 27980, 27981, 28032, 28192, 28193, 28202, 28285, 28286, 28287, 28288, 28289, 28290, 28291, 28294, 28312, 28313, 28319, 28325, 28326, 28334, 28336, 28337, 28338, 28355, 28375, 28391, 28392, 28394, 28396, 28397, 28398, 28399, 28400, 28401, 28403, 28404, 28405, 28406, 28407, 28408, 28409, 28410, 28411, 28412, 28413, 28414, 28415, 28416, 28417, 28418, 28419, 28420, 28421, 28423, 28425, 28433, 28463, 28599, 28603, 28615, 28908, 28910, 28911, 28912, 28921, 28922, 28923, 28924, 28925, 28926, 28929, 28937, 28938, 28949, 28955, 28956, 30577, 30578, 30579, 30655, 30657, 30658, 30665, 30673, 30695]

        var g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

        var $1 = []
        var $2 = null

        for (var module_number of module_list) {
            $1[module_number] = 1
        }

        function h(a) {
            a = a.toString(2);
            var b = "0".repeat(a.length - 1);
            return b + a
        }

        function i(a) {        
            a = (a + "00000").match(/[01]{6}/g);
            var b = "";
            for (var c = 0; a != null && c < a.length; c++)
                b += g[parseInt(a[c], 2)];
            return b
        }

        function toCompressedString () {
            if ($1.length === 0)
                return "";
            if ($2 != null)
                return $2;

            var a = []
                , b = 1
                , c = $1[0] || 0
                , d = c.toString(2);
            
                for (var e = 1; e < $1.length; e++) {
                var f = $1[e] || 0;
                f === c ? b++ : (a.push(h(b)),
                c = f,
                b = 1)
            }
            b && a.push(h(b));
            return $2 = i(d + a.join(""))
        }

        return toCompressedString()

        // credit to xTekky for reversing __dyn, saved me hours :)
    }
}

class Facebook {
    constructor(proxy=null) {
        this.values = {};
        this.proxy = proxy;
        this.cookieJar = new CookieJar();
    }

    async __send_request(url, method, headers, body, x) {
        try {
            const parsed_url = new URL(`http://${this.proxy}`);

            this.agent = new ProxyAgent({
                uri: `http://${this.proxy}`,
            });

            if (parsed_url?.username && parsed_url?.password) {
                this.agent = new ProxyAgent({
                    uri: "http://royal.vital-proxies.com:12321",
                    auth: Buffer.from(
                        `${parsed_url.username}:${parsed_url.password}`
                    ).toString("base64"),
                });
            }

            if (x != true && url != 'https://www.facebook.com/api/graphql/') {
                if (this.cookieJar) {
                    if (this.cookieJar.getCookiesSync(url).length > 0) {
                        headers["cookie"] = this.cookieJar.getCookieStringSync(url);
                    }
                }
            }

            var response = await request(url, {
                method: method,
                headers: headers,
                body: body,
                extraConfiguration: this.agent ? { dispatcher: this.agent } : {},
                tls: {
                    rejectUnauthorized: true,
                    checkServerIdentity: (host, cert) => {
                        const expectedFingerprint = "b32309a26951912be7dba376398abc3b";

                        if (cert.fingerprint256 !== expectedFingerprint) {
                            throw new Error(
                                `Server TLS certificate fingerprint mismatch, expected ${expectedFingerprint}, got ${cert.fingerprint256}`
                            );
                        }
                    },
                },
            });

            let responseCookies = response.headers["set-cookie"];

            if (typeof responseCookies === "string") {
                responseCookies = [responseCookies];
            }

            if (responseCookies) {
                responseCookies.forEach((cookieStr) => {
                    const cookie = Cookie.parse(cookieStr);
                    this.cookieJar.setCookieSync(cookie, url);
                });
            }

            try {
                const chunks = [];

                for await (const chunk of response.body) {
                    chunks.push(chunk);
                }

                response.body = Buffer.concat(chunks).toString("utf8");

                return response;
            } catch (error) {
                console.log(error);
                return response;
            }
        } catch (error) {
            return error.message;
        }
    }

    async fetchDocumentId() {
        const req = await this.__send_request(
            "https://static.xx.fbcdn.net/rsrc.php/v3iORu4/yG/l/makehaste_jhash/eiMJ_M8zDjf.js?_nc_x=zY5clkt_-f3",
            "GET",
            null,
            null,
            null
        );

        return req.body.match(/{e.exports="(.*?)"}/)?.[1];
    }

    async consent() {
        const HomeData = await this.fetchHome();

        const jazoest = FacebookUtility.createJazoest(HomeData.dtsg);
        this.values.asbdid = await this.fetchASBDID(HomeData._nc_x);

        await this.__send_request(
            "https://m.facebook.com/cookie/consent/",
            "POST",
            {
                host: "m.facebook.com",
                connection: "keep-alive",
                "sec-ch-ua":
                    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "x-response-format": "JSONStream",
                "content-type": "application/x-www-form-urlencoded",
                "x-fb-lsd": HomeData.lsd,
                "sec-ch-ua-platform-version": '"15.0.0"',
                "x-requested-with": "XMLHttpRequest",
                "x-asbd-id": this.values.asbdid,
                "sec-ch-ua-full-version-list":
                    '"Chromium";v="124.0.6367.119", "Google Chrome";v="124.0.6367.119", "Not-A.Brand";v="99.0.0.0"',
                "sec-ch-ua-model": '""',
                "sec-ch-prefers-color-scheme": "dark",
                "sec-ch-ua-platform": '"Windows"',
                accept: "*/*",
                origin: "https://m.facebook.com",
                "sec-fetch-site": "same-origin",
                "sec-fetch-mode": "cors",
                "sec-fetch-dest": "empty",
                referer: "https://m.facebook.com/login?source=auth_switcher",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                cookie: `_js_datr=${HomeData._js_datr}`,
            },
            new URLSearchParams({
                accept_only_essential: "false",
                fb_dtsg: HomeData.dtsg.toString(),
                jazoest: jazoest.toString(),
                lsd: HomeData.lsd.toString(),
                __dyn: FacebookUtility.createDyn(),
                __csr: "",
                __req: "2",
                __fmt: "1",
                __a: HomeData.__a.toString(),
                __user: "0",
            }).toString(),
            true
        );

        return Object.assign(HomeData, { jazoest })
    }

    async fetchHome() {
        const res = await this.__send_request(
            "https://m.facebook.com/login?source=auth_switcher",
            "GET",
            {
                host: "m.facebook.com",
                connection: "keep-alive",
                "sec-ch-ua": '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "upgrade-insecure-requests": "1",
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "sec-gpc": "1",
                "accept-language": "en-GB,en;q=0.6",
                "sec-fetch-site": "none",
                "sec-fetch-mode": "navigate",
                "sec-fetch-user": "?1",
                "sec-fetch-dest": "document",
            },
            null
        );

        const _nc_x = res.body.match(/_nc_x=(.*?)/)?.[1];
        const datr = res.body.match(/datrCookie:"(.*?)"/)?.[1];
        const _js_datr = res.body.match(/"click_forget_password","(.*?)"/)?.[1];
        const dtsg = res.body.match(/dtsg":{"token":"(.*?)"/)?.[1];
        const lsd = res.body.match(/LSD",\[\],{"token":"(.*?)"/)?.[1];
        const __a = res.body.match(/"encrypted":"(.*?)"/)?.[1];
        const __rev = res.body.match(/"__spin_r":(.*?),/)?.[1];
        const __hsi = res.body.match(/"hsi":"(.*?)"/)?.[1];
        const ccg = res.body.match(/{"connectionClass":"(.*?)"}/)?.[1];
        const __hs = res.body.match(/"haste_session":"(.*?)"/)?.[1];

        return { _nc_x, datr, _js_datr, dtsg, lsd, __a, __rev, __hsi, ccg, __hs }
    }

    async fetchASBDID(_nc_x) {
        const res = await this.__send_request(
            `https://static.xx.fbcdn.net/rsrc.php/v3/y9/r/rgmwtTu7inu.js?_nc_x=${_nc_x}`,
            "GET",
            {
                host: "static.xx.fbcdn.net",
                connection: "keep-alive",
                "sec-ch-ua": '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
                origin: "https://m.facebook.com",
                "sec-ch-ua-mobile": "?0",
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "sec-ch-ua-platform": '"Windows"',
                accept: "*/*",
                "sec-gpc": "1",
                "accept-language": "en-GB,en;q=0.6",
                "sec-fetch-site": "cross-site",
                "sec-fetch-mode": "cors",
                "sec-fetch-dest": "script",
                referer: "https://m.facebook.com/",
                "accept-encoding": "utf-8",
            },
            null
        );

        const asbdid = res.body.match(/{"use strict";a="(.*?)";f.ASBD_ID=a}/)?.[1];

        return asbdid
    }

    async init() {
        try {
            var req = await __send_request(
                "https://www.facebook.com/",
                "GET",
                {
                    host: "www.facebook.com",
                    connection: "keep-alive",
                    "sec-ch-ua":
                        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "upgrade-insecure-requests": "1",
                    "user-agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "sec-fetch-site": "cross-site",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-user": "?1",
                    "sec-fetch-dest": "document",
                    referer: "https://www.google.com/",
                    "accept-encoding": "utf-8",
                    "accept-language": "en-US,en;q=0.9",
                },
                null
            );

            return {
                response: req,
                cookieJar: cookieJar,
            };
        } catch (error) {
            return error.message;
        }
    }

    async login(email, password) {
        const HomeData = await this.consent();

        this.values = {...this.values, ...HomeData};

        var res = await this.__send_request(
            "https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=100",
            "POST",   
            {
                host: "www.facebook.com",
                connection: "keep-alive",
                "cache-control": "max-age=0",
                "sec-ch-ua":
                    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"macOS"',
                "upgrade-insecure-requests": "1",
                origin: "https://www.facebook.com",
                "content-type": "application/x-www-form-urlencoded",
                "user-agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "sec-fetch-site": "same-origin",
                "sec-fetch-mode": "navigate",
                "sec-fetch-user": "?1",
                "sec-fetch-dest": "document",
                //referer: 'https://www.facebook.com/login/?privacy_mutation_token=eyJ0eXBlIjowLCJjcmVhdGlvbl90aW1lIjoxNzE0OTU3MTE0LCJjYWxsc2l0ZV9pZCI6MzgxMjI5MDc5NTc1OTQ2fQ%3D%3D',
                "accept-encoding": "utf-8",
                "accept-language": "en-US,en;q=0.9",
            },
            new URLSearchParams({
                jazoest: this.values.jazoest.toString(),
                lsd: this.values.lsd.toString(),
                display: "",
                isprivate: "",
                return_session: "",
                skip_api_login: "",
                signed_next: "",
                trynum: "1",
                timezone: "240",
                // lgndim: 'eyJ3IjoxNzEwLCJoIjoxMTA3LCJhdyI6MTcxMCwiYWgiOjk3OSwiYyI6MzB9',
                // lgnrnd: '144009_fL2m',
                // lgnjs: '1715118010',
                email: email.toString(),
                prefill_contact_point: "",
                prefill_source: "",
                prefill_type: "",
                first_prefill_source: "",
                first_prefill_type: "",
                had_cp_prefilled: "false",
                had_password_prefilled: "false",
                //ab_test_data: 'AAKVV/qVVfVAAAAAAKAAAAAAAAAAAAAAAAAAAAAAd/ZIEAAAAANBAB',
                encpass: `#PWD_BROWSER:0:&:${password}`,
            }).toString()
        );

        const location = res.headers?.['location'];
        if (location.includes('checkpoint')) {
            return {
                status: 'checkpoint',
                location: location,
                cookieJar: this.cookieJar.getCookieStringSync('https://www.facebook.com')
            }
        }

        return {
            status: 'success',
            location: location,
            cookieJar: this.cookieJar.getCookieStringSync('https://www.facebook.com')
        }
    }
}

export default Facebook;