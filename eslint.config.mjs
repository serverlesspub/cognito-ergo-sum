import path from 'node:path';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const baseDirectory = path.dirname(fileURLToPath(import.meta.url)),
	compat = new FlatCompat({
		baseDirectory,
		recommendedConfig: js.configs.recommended,
		allConfig: js.configs.all
	});

export default [...compat.extends('eslint:recommended'), {
	languageOptions: {
		globals: {
			...globals.jest,
			...globals.node,
		},

		ecmaVersion: 2020,
		sourceType: 'module',
	},

	rules: {
		semi: ['error', 'always'],
		strict: ['error', 'global'],
		'no-unused-vars': 'error',

		indent: ['error', 'tab', {
			SwitchCase: 1,
		}],

		'no-const-assign': 'error',
		'one-var': 'error',
		'prefer-const': 'error',
		'no-var': 'error',
		'prefer-arrow-callback': 'error',

		'no-plusplus': ['error', {
			allowForLoopAfterthoughts: true,
		}],

		quotes: ['error', 'single', {
			avoidEscape: true,
			allowTemplateLiterals: true,
		}],

		'no-underscore-dangle': 'off',

		'no-shadow': ['error', {
			builtinGlobals: true,
		}],

		'no-use-before-define': ['error'],
		'require-await': ['error'],
		eqeqeq: ['error'],

		'comma-spacing': ['error', {
			before: false,
			after: true,
		}],

		'key-spacing': ['error', {
			afterColon: true,
			beforeColon: false,
		}],

		'new-cap': ['error', {
			capIsNew: true,
		}],
	},
}];
