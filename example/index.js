const express = require('express');
const msal = require('@azure/msal-node');
const axios = require('axios');
const app = express()
const port = 3000;

const request = {
    authCodeUrlParameters: {
        // without offline_access you won't get a refresh_token
        scopes: ["XboxLive.signin", "XboxLive.offline_access"],
        redirectUri: "http://localhost:3000/redirect"
    }, tokenRequest: {
        redirectUri: "http://localhost:3000/redirect",
        // without offline_access you won't get a refresh_token
        scopes: ["XboxLive.signin", "XboxLive.offline_access"],
    }
}

// must be a ConfidentialClientApplication since this is a web application
const confidentialClientApplication = new msal.ConfidentialClientApplication({
    auth: {
        clientId: process.env.MSAL_CLIENT_SECRET ?? "00000000-0000-0000-0000-000000000000",
        // must be consumers! look at https://docs.microsoft.com/de-de/azure/active-directory/develop/msal-client-application-configuration#authority and https://wiki.vg/Microsoft_Authentication_Scheme
        // Quote: `If using the MSAL library to handle OAuth for you, you must use the consumers AAD tenant to sign in with the XboxLive.signin scope.`
        authority: "https://login.microsoftonline.com/consumers",
        // the clientSecret must be generated in the azure portal, under Certificates & secrets
        clientSecret: process.env.MSAL_CLIENT_SECRET ?? "~0000~0000000000000000000000000000000000"
    }, system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            }, piiLoggingEnabled: false, logLevel: msal.LogLevel.Verbose,
        }
    }
});

app.get("/", (req, res) => {
    const authCodeUrlParameters = {...request.authCodeUrlParameters};

    if (req.query) {
        // Check for the state parameter
        if (req.query.state) authCodeUrlParameters.state = req.query.state;

        // Check for the prompt parameter
        if (req.query.prompt) authCodeUrlParameters.prompt = req.query.prompt;

        // Check for the loginHint parameter
        if (req.query.loginHint) authCodeUrlParameters.loginHint = req.query.loginHint;

        // Check for the domainHint parameter
        if (req.query.domainHint) authCodeUrlParameters.domainHint = req.query.domainHint;
    }

    /**
     * MSAL Usage
     * The code below demonstrates the correct usage pattern of the ClientApplicaiton.getAuthCodeUrl API.
     *
     * Authorization Code Grant: First Leg
     *
     * In this code block, the application uses MSAL to obtain an authorization code request URL. Once the URL is
     * returned by MSAL, the express application is redirected to said request URL, concluding the first leg of the
     * Authorization Code Grant flow.
     */
    confidentialClientApplication.getAuthCodeUrl(authCodeUrlParameters).then((authCodeUrl) => {
        res.redirect(authCodeUrl);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get("/redirect", (req, res) => {
    /**
     * MSAL Usage
     * The code below demonstrates the correct usage pattern of the ClientApplicaiton.acquireTokenByCode API.
     *
     * Authorization Code Grant: Second Leg
     *
     * In this code block, the application uses MSAL to obtain an Access Token from the configured authentication service.
     * The response contains an `accessToken` property. Said property contains a string representing an encoded Json Web Token
     * which can be added to the `Authorization` header in a protected resource request to demonstrate authorization.
     */
    confidentialClientApplication.acquireTokenByCode({
        ...request.tokenRequest, code: req.query.code
    }).then((response) => {
        authenticateXBL(response.accessToken).then((axiosResponse) => {
            const xblAccessToken = axiosResponse.data.Token;

            authenticateXSTS(xblAccessToken).then((axiosResponse) => {
                const xstsAccessToken = axiosResponse.data.Token;
                const xui = axiosResponse.data.DisplayClaims.xui[0].uhs;

                authenticateToMinecraft(xui, xstsAccessToken).then((axiosResponse) => {
                    const minecraftAccessToken = axiosResponse.data.access_token;

                    getMinecraftProfile(minecraftAccessToken).then((axiosResponse) => {
                        res.send(axiosResponse.data);
                    });
                });
            }).catch((error) => {
                if (error.status === 401) {
                    switch (error.response.data.XErr) {
                        case 2148916233:
                            console.log("The account doesn't have an Xbox account");
                            break;
                        case 2148916235:
                            console.log("The account is from a country where Xbox Live is not available/banned");
                            break;
                        case 2148916238:
                            console.log("The account is a child (under 18) and cannot proceed unless the account is added to a Family by an adult.");
                            break;
                        default:
                            console.log("error");
                            break;
                    }
                }

                res.status(500).send(error);
            });
        });
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

function authenticateXBL(msalAccessToken) {
    console.log("1. authenticateXBL");

    //Now that we are authenticated with Microsoft, we can authenticate to Xbox Live.
    return axios.post('https://user.auth.xboxlive.com/user/authenticate', {
        "Properties": {
            "AuthMethod": "RPS", "SiteName": "user.auth.xboxlive.com", "RpsTicket": `d=${msalAccessToken}` // your access token from step 2 here
        }, "RelyingParty": "http://auth.xboxlive.com", "TokenType": "JWT"
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

function authenticateXSTS(xblAccessToken) {
    console.log("2. authenticateXSTS");

    //Now that we are authenticated with XBL, we need to get a XSTS token, we can use to login to Minecraft.
    return axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
        "Properties": {
            "SandboxId": "RETAIL", "UserTokens": [xblAccessToken]
        }, "RelyingParty": "rp://api.minecraftservices.com/", "TokenType": "JWT"
    });
}

function authenticateToMinecraft(xui, xstsAccessToken) {
    console.log("3. authenticateToMinecraft");

    // Now we can finally start talking to Minecraft. The XSTS token from the last request allows us to authenticate to Minecraft
    return axios.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
        "identityToken": `XBL3.0 x=${xui};${xstsAccessToken}`
    });
}

function getMinecraftProfile(minecraftAccessToken) {
    console.log("4. get minecraft profile");

    return axios.get('https://api.minecraftservices.com/minecraft/profile', {
        headers: {
            'Authorization': `Bearer ${minecraftAccessToken}`
        }
    });
}

app.listen(port, () => {
    console.log(`MSAL example app listening at http://localhost:${port}`)
});
