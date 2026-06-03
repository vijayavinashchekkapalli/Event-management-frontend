module.exports = {
	apps: [{
		name: 'event-management-backend',
		script: './server.js',
		exec_mode: 'cluster',
		instances: 'max',
		autorestart: true,
		watch: false,
		env: {
			NODE_ENV: 'development',
			PORT: 5000
		},
		env_production: {
			NODE_ENV: 'production',
			PORT: 5000
		}
	}]
};
