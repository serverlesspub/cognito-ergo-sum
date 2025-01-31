import { InitiateAuthCommand, RespondToAuthChallengeCommand, NotAuthorizedException, PasswordHistoryPolicyViolationException, InvalidPasswordException, InvalidParameterException } from '@aws-sdk/client-cognito-identity-provider';
import {CognitoAuthSession} from '../src/cognito-auth-session';
import {parseBigInt} from '../src/parse-bigint';
import {jest} from '@jest/globals'; //eslint-disable-line no-shadow

describe('CognitoAuthSession', () => {
	let underTest, client, userPoolName, clientId, clock, srpCalculator, srpContextMock;

	beforeEach(() => {
		client = {
			send: jest.fn(),
		};
		userPoolName = 'testPool';
		clientId = 'testClientId';
		clock = {
			now: jest.fn(),
		};
		srpContextMock = {
			A: parseBigInt('AAAAAA', 16)
		};
		srpCalculator = {
			initContext: jest.fn(() => srpContextMock),
			getPasswordAuthenticationKey: jest.fn(() => 'mockHKDFKey'),
			getSignature: jest.fn(() => 'mockSignature'),
		};
		underTest = new CognitoAuthSession({
			client,
			userPoolName,
			clientId,
			clock,
			srpCalculator
		});
	});

	describe('authenticate', () => {
		test('should initiate authentication', async () => {
			client.send.mockResolvedValueOnce({
				ChallengeName: 'PASSWORD_VERIFIER',
				ChallengeParameters: {USERNAME: 'responseUsername', SECRET_BLOCK: 'mockSecretBlock', SRP_B: 'BB1122', SALT: 'CCAA11' }
			});
			await underTest.authenticate({ username: 'testUser', password: 'testPass' });
			const firstSendArg = client.send.mock.calls[0][0];
			expect(firstSendArg).toBeInstanceOf(InitiateAuthCommand);
			expect(firstSendArg.input).toEqual({
				'AuthFlow': 'USER_SRP_AUTH',
				'AuthParameters': {
					'SRP_A': 'aaaaaa',
					'USERNAME': 'testUser',
				},
				ClientId: 'testClientId',
			});

		});
		test('throws error if next challenge is not supported', async () => {
			client.send.mockResolvedValueOnce({ ChallengeName: 'INVALID_CHALLENGE' });

			await expect(underTest.authenticate({ username: 'testUser', password: 'testPass' }))
				.rejects.toThrow('invalid-challenge');

			expect(client.send).toHaveBeenCalledWith(
				expect.any(InitiateAuthCommand)
			);
		});
		test('re-throws errors from cognito client', async () => {
			client.send.mockRejectedValueOnce(new InvalidParameterException({}));
			await expect(underTest.authenticate({ username: 'testUser', password: 'testPass' }))
				.rejects.toBeInstanceOf(InvalidParameterException);
		});
		describe('when the next challenge is PASSWORD_VERIFIER', () => {
			beforeEach(() => {
				client.send.mockResolvedValueOnce({
					ChallengeName: 'PASSWORD_VERIFIER',
					ChallengeParameters: {USERNAME: 'responseUsername', SECRET_BLOCK: 'mockSecretBlock', SRP_B: 'BBBBBBBB', SALT: 'CCCCCCCC' }
				});

			});
			test('should complete the authentication using the password verification challenge', async () => {
				client.send.mockResolvedValueOnce({ AuthenticationResult: { IdToken: 'mockIdToken' } });
				clock.now.mockReturnValue(1737113275000);
				await underTest.authenticate({ username: 'testUser', password: 'testPass' });
				expect(client.send).toHaveBeenCalledTimes(2);
				const secondSendArg = client.send.mock.calls[1][0];
				expect(secondSendArg).toBeInstanceOf(RespondToAuthChallengeCommand);
				expect(secondSendArg.input).toEqual({
					ChallengeName: 'PASSWORD_VERIFIER',
					ChallengeResponses: {
						USERNAME: 'responseUsername',
						PASSWORD_CLAIM_SECRET_BLOCK: 'mockSecretBlock',
						TIMESTAMP: 'Fri Jan 17 11:27:55 UTC 2025',
						PASSWORD_CLAIM_SIGNATURE: 'mockSignature'
					},
					ClientId: 'testClientId',
				});
				expect(srpCalculator.getSignature).toHaveBeenCalledWith({
					challengeParameters: {'SALT': 'CCCCCCCC', 'SECRET_BLOCK': 'mockSecretBlock', 'SRP_B': 'BBBBBBBB', 'USERNAME': 'responseUsername'},
					dateNow: 'Fri Jan 17 11:27:55 UTC 2025',
					'hkdf': 'mockHKDFKey',
					userPoolName: 'testPool',
					username: 'responseUsername'
				});
				expect(srpCalculator.getPasswordAuthenticationKey).toHaveBeenCalledWith(
					{
						password: 'testPass',
						salt: BigInt('0xCCCCCCCC'),
						serverBValue: BigInt('0xBBBBBBBB'),
						userPoolName: 'testPool',
						username: 'responseUsername',
					},
					srpContextMock
				);
			});
			test('should re-throw cognito errors', async () => {
				client.send.mockRejectedValueOnce(new NotAuthorizedException({}));
				await expect(underTest.authenticate({ username: 'testUser', password: 'testPass' }))
					.rejects.toBeInstanceOf(NotAuthorizedException);
			});
			test('should retrieve the tokens from the last auth response if there is no follow-up challenge', async () => {
				client.send.mockResolvedValueOnce({ AuthenticationResult: { IdToken: 'mockIdToken' } });
				await underTest.authenticate({ username: 'testUser', password: 'testPass' });
				expect(underTest.getIdToken()).toBe('mockIdToken');
				expect(underTest.getNextStep()).toBeFalsy();
			});
			describe('when the follow-up challenge is NEW_PASSWORD_REQUIRED', () => {
				beforeEach(() => {
					client.send.mockResolvedValueOnce({
						ChallengeName: 'NEW_PASSWORD_REQUIRED',
						Session: 'mockSession'
					});
				});
				test('should resolve without retrieving tokens when there is a follow-up challenge', async () => {
					await underTest.authenticate({ username: 'testUser', password: 'testPass' });
					expect(underTest.getIdToken()).toBeFalsy();
					expect(underTest.getNextStep()).toEqual('NEW_PASSWORD_REQUIRED');
				});
			});

		});
	});
	describe('continueWithNewPassword', () => {
		beforeEach(async () => {
			client.send.mockResolvedValueOnce({
				ChallengeName: 'PASSWORD_VERIFIER',
				ChallengeParameters: {USERNAME: 'responseUsername', SECRET_BLOCK: 'mockSecretBlock', SRP_B: 'BB1122', SALT: 'CCAA11' }
			});
			client.send.mockResolvedValueOnce({
				ChallengeName: 'NEW_PASSWORD_REQUIRED',
				Session: 'mockSession'
			});
			await underTest.authenticate({ username: 'testUser', password: 'testPass' });
			client.send.mockReset();
		});
		test('should throw if the new password matches the old password', async () => {
			await expect(underTest.continueWithNewPassword('testPass'))
				.rejects.toEqual(new PasswordHistoryPolicyViolationException('password-cannot-match-previous'));
		});

		test('should re-throw cognito errors ', async () => {
			client.send.mockRejectedValueOnce(new PasswordHistoryPolicyViolationException({}));

			await expect(underTest.continueWithNewPassword('newPass123'))
				.rejects.toBeInstanceOf(PasswordHistoryPolicyViolationException);
		});


		test('should successfully continue with a new password', async () => {
			client.send.mockResolvedValueOnce({ AuthenticationResult: { IdToken: 'mockNewIdToken' } });
			await underTest.continueWithNewPassword('newPass123');
			expect(client.send).toHaveBeenCalledTimes(1);
			const callArg = client.send.mock.calls[0][0];
			expect(callArg).toBeInstanceOf(RespondToAuthChallengeCommand);
			expect(callArg.input).toEqual({
				ChallengeName: 'NEW_PASSWORD_REQUIRED',
				ChallengeResponses: {
					'NEW_PASSWORD': 'newPass123',
					'USERNAME': 'testUser'
				},
				ClientId: 'testClientId',
				Session: 'mockSession'
			});
			expect(underTest.getIdToken()).toBe('mockNewIdToken');
			expect(underTest.getNextStep()).toBeFalsy();
		});
	});

	describe('token getters', () => {
		test('should return tokens from the last authentication response', async () => {
			client.send.mockResolvedValueOnce({
				ChallengeName: 'PASSWORD_VERIFIER',
				ChallengeParameters: {USERNAME: 'responseUsername', SECRET_BLOCK: 'mockSecretBlock', SRP_B: 'BB1122', SALT: 'CCAA11' }
			});
			client.send.mockResolvedValueOnce({
				AuthenticationResult: {
					IdToken: 'mockIdToken',
					RefreshToken: 'mockRefreshToken',
					AccessToken: 'mockAccessToken',
					ExpiresIn: 3600,
					TokenType: 'Bearer',
				},
			});
			await underTest.authenticate({ username: 'testUser', password: 'testPass' });
			expect(underTest.getIdToken()).toBe('mockIdToken');
			expect(underTest.getRefreshToken()).toBe('mockRefreshToken');
			expect(underTest.getAccessToken()).toBe('mockAccessToken');
			expect(underTest.getExpiresIn()).toBe(3600);
			expect(underTest.getTokenType()).toBe('Bearer');
		});
	});
	describe('getTokens', () => {
		let resolved;
		beforeEach(() => {
			underTest.getTokens().then(() => resolved = true);
		});
		test('should not resolve if authenticate fails', async () => {
			client.send.mockRejectedValueOnce(new NotAuthorizedException({}));
			await underTest.authenticate({ username: 'testUser', password: 'testPass' }).catch(() => {});
			expect(resolved).toBeFalsy();
		});
		describe('when authenticate succeeds with follow up challenge', () => {
			beforeEach(() => {
				client.send.mockResolvedValueOnce({
					ChallengeName: 'PASSWORD_VERIFIER',
					ChallengeParameters: {USERNAME: 'responseUsername', SECRET_BLOCK: 'mockSecretBlock', SRP_B: 'BB1122', SALT: 'CCAA11' }
				});
				client.send.mockResolvedValueOnce({
					ChallengeName: 'NEW_PASSWORD_REQUIRED',
					Session: 'mockSession'
				});
			});
			test('should not resolve after authenticate', async () => {
				await underTest.authenticate({ username: 'testUser', password: 'testPass' });
				expect(resolved).toBeFalsy();
			});
			describe('when the follow up challenge fails', () => {
				beforeEach(async () => {
					await underTest.authenticate({ username: 'testUser', password: 'wrongPass' });
					client.send.mockReset();
					client.send.mockRejectedValueOnce(new InvalidPasswordException({}));
				});
				test('should not resolve after the failure', async () => {
					await underTest.continueWithNewPassword('wrongPass1').catch(() => {});
					expect(resolved).toBeFalsy();
				});
				test('should resolve after repeated attempt', async () => {
					client.send.mockResolvedValueOnce({
						AuthenticationResult: {
							IdToken: 'mockIdToken',
							RefreshToken: 'mockRefreshToken',
							AccessToken: 'mockAccessToken',
							ExpiresIn: 3600,
							TokenType: 'Bearer',
						}
					});
					await underTest.continueWithNewPassword('wrongPass1').catch(() => {});
					await underTest.continueWithNewPassword('testPass');
					await expect(underTest.getTokens()).resolves.toEqual({
						id: 'mockIdToken',
						refresh: 'mockRefreshToken',
						access: 'mockAccessToken'
					});
				});
			});
			describe('when the follow up challenge succeeds', () => {
				beforeEach(async () => {
					client.send.mockResolvedValueOnce({
						AuthenticationResult: {
							IdToken: 'mockIdToken',
							RefreshToken: 'mockRefreshToken',
							AccessToken: 'mockAccessToken',
							ExpiresIn: 3600,
							TokenType: 'Bearer',
						}
					});
					await underTest.authenticate({ username: 'testUser', password: 'testPass' });
				});
				test('should resolve with tokens', async () => {
					await underTest.continueWithNewPassword('testPass1');
					await expect(underTest.getTokens()).resolves.toEqual({
						id: 'mockIdToken',
						refresh: 'mockRefreshToken',
						access: 'mockAccessToken'
					});
				});
			});
		});
		describe('when authenticate succeeds without follow up challenge', () => {
			beforeEach(() => {
				client.send.mockResolvedValueOnce({
					ChallengeName: 'PASSWORD_VERIFIER',
					ChallengeParameters: {USERNAME: 'responseUsername', SECRET_BLOCK: 'mockSecretBlock', SRP_B: 'BB1122', SALT: 'CCAA11' }
				});
				client.send.mockResolvedValueOnce({
					AuthenticationResult: {
						IdToken: 'mockIdToken',
						RefreshToken: 'mockRefreshToken',
						AccessToken: 'mockAccessToken',
						ExpiresIn: 3600,
						TokenType: 'Bearer',
					}
				});
			});
			test('should resolve with tokens', async () => {
				await underTest.authenticate({ username: 'testUser', password: 'testPass' });
				await expect(underTest.getTokens()).resolves.toEqual({
					id: 'mockIdToken',
					refresh: 'mockRefreshToken',
					access: 'mockAccessToken'
				});
			});
		});
	});
});

