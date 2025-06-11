module.exports = {
	clearMocks: true,
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
	coverageDirectory: 'coverage',
	moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['./jest.setup.js'],
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
	],
};
