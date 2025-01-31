# Cognito Ergo Sum

Minimal [AWS Cognito](https://aws.amazon.com/cognito/) authentication Secure
Remote Password (SRP) implementation, replacing the outdated
[amazon-cognito-identity-js](https://www.npmjs.com/package/amazon-cognito-identity-js) library,
with the goal of only depending on AWS JS Client SDK, and providing a minimal,
focused library for web sites that want to integrate Cognito authentication.

Extracted from and inspired by [AWS Amplify JS](https://github.com/aws-amplify/amplify-js), 
but without all the other stuff that Amplify brings along.

Developed by AWS Heroes [Slobodan Stojanović](https://aws.amazon.com/developer/community/heroes/slobodan-stojanovic/) and [Gojko Adzic](https://aws.amazon.com/developer/community/heroes/gojko-adzic/). 

## Status

Work in progress - basic username/password authentication works, but custom flows are not yet supported.

## Differences from amazon-cognito-identity-js and Amplify JS

- minimal dependencies - the only runtime dependency is AWS Cognito IDP SDK
- focuses only on the authentication flow, without bundling in token caching, UI widgets... 
- uses [JS platform BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) object, widely available in all modern browsers, instead of the legacy BigInteger implementation from JSBN
- uses a much faster method for modPow (completes at 20% time compared to legacy BigInteger, 8% of time compared to standard BigInt methods)

