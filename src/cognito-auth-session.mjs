import {InitiateAuthCommand, RespondToAuthChallengeCommand, PasswordHistoryPolicyViolationException} from '@aws-sdk/client-cognito-identity-provider';
import {BigInteger} from '../external/jsbn';
import {formatTimestampForCognitoChallenge} from './format-timestamp-for-cognito-challenge';

export function CognitoAuthSession({client, userPoolName, srpCalculator, clientId, clock = Date}) {
	if (!userPoolName || !clientId || !srpCalculator) {
		console.error({userPoolName, clientId});
		throw new Error('invalid-args');
	}
	let lastAuthResponse,
		initialRequest,
		resolve;
	const getIdToken = () => {
			return lastAuthResponse?.AuthenticationResult?.IdToken;
		},
		processAuthCommand = async (command) => {
			lastAuthResponse = await client.send(command);
			if (getIdToken()) {
				resolve();
			}
		},
		tokensPromise = new Promise(r => resolve = r),
		srpContext = srpCalculator.initContext(),
		initiateAuth = async ({username}) => {
			try {
				await processAuthCommand(new InitiateAuthCommand({
					AuthFlow: 'USER_SRP_AUTH',
					AuthParameters: {
						USERNAME: username,
						SRP_A: srpContext.A.toString(16)
					},
					ClientId: clientId
				}));
			} catch (e) {
				lastAuthResponse = null;
				throw e;
			}
		},
		getNextStep = () => {
			return lastAuthResponse?.ChallengeName;
		},
		continueWithPasswordVerifier = async () => {
			const lastChallengeParameters = lastAuthResponse?.ChallengeParameters,
				serverBValue = new BigInteger(lastChallengeParameters.SRP_B, 16),
				salt = new BigInteger(lastChallengeParameters.SALT, 16),
				dateNow = formatTimestampForCognitoChallenge(clock.now()),
				hkdf = srpCalculator.getPasswordAuthenticationKey({
					username: lastChallengeParameters.USERNAME,
					password: initialRequest.password,
					serverBValue,
					salt,
					userPoolName
				}, srpContext),
				commandInput = {
					ChallengeName: getNextStep(),
					ChallengeResponses: {
						USERNAME: lastChallengeParameters.USERNAME,
						PASSWORD_CLAIM_SECRET_BLOCK: lastChallengeParameters.SECRET_BLOCK,
						TIMESTAMP: dateNow,
						PASSWORD_CLAIM_SIGNATURE: srpCalculator.getSignature({
							username: lastChallengeParameters.USERNAME,
							userPoolName: userPoolName,
							challengeParameters: lastChallengeParameters,
							dateNow,
							hkdf
						})
					},
					ClientId: clientId
				},
				respondToAuthCommand = new RespondToAuthChallengeCommand(commandInput);
			try {
				await processAuthCommand(respondToAuthCommand);
			} catch (e) {
				lastAuthResponse = null;
				throw e;
			}
		},
		authenticate = async ({username, password}) => {
			initialRequest = {username, password};
			await initiateAuth({username});
			if (getNextStep() !== 'PASSWORD_VERIFIER') {
				throw new Error('invalid-challenge');
			}
			await continueWithPasswordVerifier();
		},
		continueWithNewPassword = async (password) => {
			if (password === initialRequest.password) {
				throw new PasswordHistoryPolicyViolationException('password-cannot-match-previous');
			}
			const commandInput = {
					ChallengeName: getNextStep(),
					ChallengeResponses: {
						USERNAME: initialRequest.username,
						NEW_PASSWORD: password
					},
					ClientId: clientId,
					Session: lastAuthResponse.Session
				},
				respondToAuthCommand = new RespondToAuthChallengeCommand(commandInput);
			await processAuthCommand(respondToAuthCommand);
		},
		getRefreshToken = () => {
			return lastAuthResponse?.AuthenticationResult?.RefreshToken;
		},
		getAccessToken = () => {
			return lastAuthResponse?.AuthenticationResult?.AccessToken;
		},
		getExpiresIn = () => {
			return lastAuthResponse?.AuthenticationResult?.ExpiresIn;
		},
		getTokenType = () => {
			return lastAuthResponse?.AuthenticationResult?.TokenType;
		},
		getTokens = async () => {
			await tokensPromise;
			return {
				id: getIdToken(),
				refresh: getRefreshToken(),
				access: getAccessToken()
			};
		};

	Object.freeze(Object.assign(
		this, {
			authenticate,
			continueWithNewPassword,
			getNextStep,
			getIdToken,
			getRefreshToken,
			getAccessToken,
			getExpiresIn,
			getTokenType,
			getTokens,
		}));
};
