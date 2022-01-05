# Minecraft xBox Login (OAuth)

This **Documentation** + **Example** shows you how you can access the minecraft account of a user through their xBox account.

**Table of contents**

1. Register a new Azure app
2. Example

#### Requirements

It is assumed that you are somewhat familiar with [oAuth,](https://oauth.net/2/) and you also have an Azure account. If
you don't have an [Azure Account](https://portal.azure.com/) yet, you have to create one (to create an account a **credit card is required**)
Here is a [Tutorial](https://docs.microsoft.com/en-us/learn/modules/create-an-azure-account/) that explains how to
create an Azure Account. Once an account has been created, you can start registering the app.

### 1. Register a new Azure app

Since Microsoft itself has documentation
on [how to register an app](https://docs.microsoft.com/en-us/advertising/guides/authentication-oauth-register?view=bingads-13)
, I will only add a few things here.

**Note**: the Nr refers to the respective number in the Microsoft documentation

- Nr 3. **Supported account types** here it's important to use **Accounts in any organizational directory (Any Azure AD
  directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)** otherwise the xBox services can not be
  used.
- Nr 6. Since I am going to use the MSAL Library with Node and Express in my Example, it is important to use **web** as the
  platform.
- Nr 7. Since apps of type **web** are considered confidential (see
  here [Public client and confidential client applications](https://docs.microsoft.com/en-US/azure/active-directory/develop/msal-client-applications))
  a client_secret must be created, this will be needed later in the application.

More advanced Setup (doesn't refer to the documentation)
- [Branding](https://docs.microsoft.com/en-US/azure/active-directory/fundamentals/customize-branding)
- [Custom Domain](https://docs.microsoft.com/en-US/azure/active-directory/fundamentals/add-custom-domain)

### 2. Example

I wrote a simple node express example that uses the [MSAL JS Library](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/master) to authenticate the user. 
At this point I would also like to refer to this [documentation](https://wiki.vg/Microsoft_Authentication_Scheme). 
This documentation describes in more detail how the authentication flow works, it also includes some examples in different programming-languages (bottom of
the page).

## Useful Links

- https://wiki.vg/Microsoft_Authentication_Scheme
- https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node
- https://docs.microsoft.com/en-US/azure/active-directory/develop/reference-v2-libraries
- https://docs.microsoft.com/en-us/advertising/guides/authentication-oauth-register?view=bingads-13
- https://docs.microsoft.com/en-US/azure/active-directory/develop/msal-client-applications
- https://docs.microsoft.com/en-US/azure/active-directory/develop/msal-client-application-configuration#authority
- https://docs.microsoft.com/en-US/azure/active-directory/develop/quickstart-v2-nodejs-console
- https://docs.microsoft.com/en-US/azure/active-directory/develop/reference-v2-libraries

## Errors
- https://coderedirect.com/questions/620671/what-is-correct-platform-for-using-the-publicclientapplication-web-or-spa
- https://docs.microsoft.com/en-us/answers/questions/370508/getting-34invalid-client-secret-is-provided34-erro.html
