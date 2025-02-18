/**
 * @jest-environment jsdom
 */

import {CognitoIdentityProvider, PasswordHistoryPolicyViolationException, NotAuthorizedException, InvalidPasswordException, AdminCreateUserCommand, AdminInitiateAuthCommand, AdminDeleteUserCommand, AdminRespondToAuthChallengeCommand} from '@aws-sdk/client-cognito-identity-provider';
import {SRPCalculator} from '../src/srp-calculator';
import {CognitoAuthSession} from '../src/cognito-auth-session';
import {TokenParser} from './token-parser';
import {NodeRuntime} from './node-runtime';
import {randomUUID} from 'node:crypto';
const clientId = process.env.WebAppClientId,
	userPoolId = process.env.UserPoolId;

describe('CognitoAuthSession', () => {
	let runtime, cognitoIdentityServiceProvider, tokenParser, authSession, username;
	const createUser = async ({password, forcePasswordChange = false} = {}) => {
			await cognitoIdentityServiceProvider.send(new AdminCreateUserCommand({
				UserPoolId: userPoolId,
				Username: username,
				UserAttributes: [
					{
						Name: 'email_verified',
						Value: 'True'
					},
					{
						Name: 'email',
						Value: username + '@email.com'
					},
					{
						Name: 'name',
						Value: 'someone'
					}
				],
				MessageAction: 'SUPPRESS',
				TemporaryPassword: forcePasswordChange ? password : '$Password0Temp'
			}));
			if (forcePasswordChange) {
				return;
			}
			const authChallenge = await cognitoIdentityServiceProvider.send(new AdminInitiateAuthCommand({
				AuthFlow: 'ADMIN_NO_SRP_AUTH',
				AuthParameters: {
					'USERNAME': username,
					'PASSWORD': '$Password0Temp'
				},
				ClientId: clientId,
				UserPoolId: userPoolId
			}));
			await cognitoIdentityServiceProvider.send(new AdminRespondToAuthChallengeCommand({
				ClientId: clientId,
				UserPoolId: userPoolId,
				ChallengeName: authChallenge.ChallengeName,
				Session: authChallenge.Session,
				ChallengeResponses: {
					'NEW_PASSWORD': password,
					'USERNAME': username
				}
			}));
		},
		deleteUser = async () => {
			await cognitoIdentityServiceProvider.send(new AdminDeleteUserCommand({
				UserPoolId: userPoolId,
				Username: username
			}));
		};
	beforeEach(() => {
		const [region, userPoolName] = userPoolId.split('_');
		cognitoIdentityServiceProvider = new CognitoIdentityProvider({region});
		runtime = new NodeRuntime();
		username = randomUUID();
		tokenParser = new TokenParser({runtime});
		authSession = new CognitoAuthSession({
			userPoolName,
			clientId,
			runtime,
			client: cognitoIdentityServiceProvider,
			srpCalculator: new SRPCalculator({runtime})
		});
	});
	afterEach(async () => {
		try {
			await deleteUser();
		} catch  {
			return;
		}
	});

	describe('for a completely registered user', () => {
		beforeEach(async () => {
			await createUser({password: '$Password0Final', forcePasswordChange: false});
		});
		test('immediately results in tokens when password is correct', async() => {
			await authSession.authenticate({username, password: '$Password0Final'});
			expect(authSession.getNextStep()).toBeFalsy();
			expect(authSession.getIdToken()).toBeTruthy();
			expect(tokenParser.parseJWT(authSession.getIdToken())).toMatchObject({'cognito:username': username, 'iss': `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`});
			expect(authSession.getRefreshToken()).toBeTruthy();
			expect(authSession.getAccessToken()).toBeTruthy();
			expect(authSession.getExpiresIn()).toEqual(3600);
			expect(authSession.getTokenType()).toEqual('Bearer');
		});
		test('throws when credentials are not correct', async () => {
			await expect(authSession.authenticate({username, password: '$Password0Wrong'})).rejects.toBeInstanceOf(NotAuthorizedException);
			expect(authSession.getNextStep()).toBeFalsy();
			expect(authSession.getIdToken()).toBeFalsy();
			expect(authSession.getRefreshToken()).toBeFalsy();
			expect(authSession.getAccessToken()).toBeFalsy();
			expect(authSession.getExpiresIn()).toBeFalsy();
			expect(authSession.getTokenType()).toBeFalsy();
		});
		test('allows login with email instead of username', async() => {
			await authSession.authenticate({username: username + '@email.com', password: '$Password0Final'});
			expect(authSession.getNextStep()).toBeFalsy();
			expect(authSession.getIdToken()).toBeTruthy();
			expect(tokenParser.parseJWT(authSession.getIdToken())).toMatchObject({'cognito:username': username, 'iss': `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`});
			expect(authSession.getRefreshToken()).toBeTruthy();
			expect(authSession.getAccessToken()).toBeTruthy();
			expect(authSession.getExpiresIn()).toEqual(3600);
			expect(authSession.getTokenType()).toEqual('Bearer');
		});
	});
	describe('for a user where a password change is required', () => {
		beforeEach(async () => {
			username = randomUUID();
			await createUser({username, password: '$Password0Temp', forcePasswordChange: true});
		});
		describe('when the old password is correct', () => {
			beforeEach(async () => {
				await authSession.authenticate({username, password: '$Password0Temp'});
			});
			test('initial step requires password change, without tokens being returned', () => {
				expect(authSession.getNextStep()).toEqual('NEW_PASSWORD_REQUIRED');
				expect(authSession.getIdToken()).toBeFalsy();
				expect(authSession.getRefreshToken()).toBeFalsy();
				expect(authSession.getAccessToken()).toBeFalsy();
				expect(authSession.getExpiresIn()).toBeFalsy();
				expect(authSession.getTokenType()).toBeFalsy();
			});
			test('resolves with tokens, upon a password change', async () => {
				await authSession.continueWithNewPassword('$Password0New');
				expect(authSession.getNextStep()).toBeFalsy();
				expect(authSession.getIdToken()).toBeTruthy();
				expect(tokenParser.parseJWT(authSession.getIdToken())).toMatchObject({'cognito:username': username, 'iss': `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`});
				expect(authSession.getRefreshToken()).toBeTruthy();
				expect(authSession.getAccessToken()).toBeTruthy();
				expect(authSession.getExpiresIn()).toEqual(3600);
				expect(authSession.getTokenType()).toEqual('Bearer');
			});
			test('prevents setting new password as the previous one', async () => {
				await expect(authSession.continueWithNewPassword('$Password0Temp')).rejects.toBeInstanceOf(PasswordHistoryPolicyViolationException);
				expect(authSession.getNextStep()).toEqual('NEW_PASSWORD_REQUIRED');
				expect(authSession.getIdToken()).toBeFalsy();
				expect(authSession.getRefreshToken()).toBeFalsy();
				expect(authSession.getAccessToken()).toBeFalsy();
				expect(authSession.getExpiresIn()).toBeFalsy();
				expect(authSession.getTokenType()).toBeFalsy();
			});
			test('prevents setting password that does not match password policy', async () => {
				await expect(authSession.continueWithNewPassword('asd')).rejects.toBeInstanceOf(InvalidPasswordException);
				expect(authSession.getNextStep()).toEqual('NEW_PASSWORD_REQUIRED');
				expect(authSession.getIdToken()).toBeFalsy();
				expect(authSession.getRefreshToken()).toBeFalsy();
				expect(authSession.getAccessToken()).toBeFalsy();
				expect(authSession.getExpiresIn()).toBeFalsy();
				expect(authSession.getTokenType()).toBeFalsy();
			});
		});
		describe('when the old password is incorrect', () => {
			test('initial step throws, without tokens being returned', async() => {
				await expect(authSession.authenticate({username, password: '$Password0Wrong'})).rejects.toBeInstanceOf(NotAuthorizedException);
				expect(authSession.getNextStep()).toBeFalsy();
				expect(authSession.getIdToken()).toBeFalsy();
				expect(authSession.getRefreshToken()).toBeFalsy();
				expect(authSession.getAccessToken()).toBeFalsy();
				expect(authSession.getExpiresIn()).toBeFalsy();
				expect(authSession.getTokenType()).toBeFalsy();
			});
		});
		describe('when the user tries to log in with email', () => {
			test('force password change', async () => {
				await authSession.authenticate({username: username + '@email.com', password: '$Password0Temp'});
				await authSession.continueWithNewPassword('$Password0New');
				expect(authSession.getNextStep()).toBeFalsy();
				expect(authSession.getIdToken()).toBeTruthy();
				expect(tokenParser.parseJWT(authSession.getIdToken())).toMatchObject({'cognito:username': username, 'iss': `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`});
				expect(authSession.getRefreshToken()).toBeTruthy();
				expect(authSession.getAccessToken()).toBeTruthy();
				expect(authSession.getExpiresIn()).toEqual(3600);
				expect(authSession.getTokenType()).toEqual('Bearer');
			});
		});
	});
	describe('for a non-existing user', () => {
		test('throws NotAuthorizedException error', async() => {
			await expect(authSession.authenticate({username, password: '$Password0Wrong'})).rejects.toBeInstanceOf(NotAuthorizedException);
			expect(authSession.getNextStep()).toBeFalsy();
			expect(authSession.getIdToken()).toBeFalsy();
			expect(authSession.getRefreshToken()).toBeFalsy();
			expect(authSession.getAccessToken()).toBeFalsy();
			expect(authSession.getExpiresIn()).toBeFalsy();
			expect(authSession.getTokenType()).toBeFalsy();
		});
	});
	describe('for custom authentication', () => {
		beforeEach(async () => {
			await createUser({password: '$Password0Final', forcePasswordChange: false});
		});

		test('should complete custom auth flow successfully', async () => {
			await authSession.initiateCustomAuth({username});
			expect(authSession.getNextStep()).toEqual('CUSTOM_CHALLENGE');
			expect(authSession.getIdToken()).toBeFalsy();

			await authSession.respondToCustomChallenge('42');
			expect(authSession.getNextStep()).toBeFalsy();
			expect(authSession.getIdToken()).toBeTruthy();
			expect(tokenParser.parseJWT(authSession.getIdToken())).toMatchObject({
				'cognito:username': username,
				'iss': `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`
			});
			expect(authSession.getRefreshToken()).toBeTruthy();
			expect(authSession.getAccessToken()).toBeTruthy();
			expect(authSession.getExpiresIn()).toEqual(3600);
			expect(authSession.getTokenType()).toEqual('Bearer');
		});

		test('should fail with incorrect answer', async () => {
			await authSession.initiateCustomAuth({username});
			expect(authSession.getNextStep()).toEqual('CUSTOM_CHALLENGE');

			await expect(authSession.respondToCustomChallenge('wrong answer'))
				.rejects.toBeInstanceOf(NotAuthorizedException);
			expect(authSession.getIdToken()).toBeFalsy();
			expect(authSession.getRefreshToken()).toBeFalsy();
			expect(authSession.getAccessToken()).toBeFalsy();
		});

		test('should work with email instead of username', async () => {
			await authSession.initiateCustomAuth({username: username + '@email.com'});
			expect(authSession.getNextStep()).toEqual('CUSTOM_CHALLENGE');

			await authSession.respondToCustomChallenge('42');
			expect(authSession.getNextStep()).toBeFalsy();
			expect(authSession.getIdToken()).toBeTruthy();
			expect(tokenParser.parseJWT(authSession.getIdToken())).toMatchObject({
				'cognito:username': username,
				'iss': `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`
			});
		});
	});
});
