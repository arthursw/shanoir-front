
const METADATA = {
    BACKEND_API_USERS_MS_URL: 'http://users:9901' + '/users',
    BACKEND_API_STUDIES_MS_URL: 'http://studies:9902' + '/studies',
    BACKEND_API_DATASET_MS_URL: 'http://datasets:9904' + '/datasets',
    BACKEND_API_IMPORT_MS_URL: 'http://import:9903' + '/import',
    BACKEND_API_BOUTIQUES_MS_URL: 'http://boutiques:9000' + '/boutiques',
    KEYCLOAK_BASE_URL: 'http://keycloak:8080/auth',
    LOGOUT_REDIRECT_URL: 'http://localhost:4200/shanoir-ng/index.html',
    ENV: 'development',
};

export var process = { env: {
    'ENV': JSON.stringify(METADATA.ENV),
    'NODE_ENV': JSON.stringify(METADATA.ENV),
    'BACKEND_API_USERS_MS_URL': JSON.stringify(METADATA.BACKEND_API_USERS_MS_URL),
    'BACKEND_API_STUDIES_MS_URL': JSON.stringify(METADATA.BACKEND_API_STUDIES_MS_URL),
    'BACKEND_API_DATASET_MS_URL': JSON.stringify(METADATA.BACKEND_API_DATASET_MS_URL),
    'BACKEND_API_IMPORT_MS_URL': JSON.stringify(METADATA.BACKEND_API_IMPORT_MS_URL),
    'BACKEND_API_BOUTIQUES_MS_URL': JSON.stringify(METADATA.BACKEND_API_BOUTIQUES_MS_URL),
    'LOGOUT_REDIRECT_URL': JSON.stringify(METADATA.LOGOUT_REDIRECT_URL),
    'KEYCLOAK_BASE_URL': JSON.stringify(METADATA.KEYCLOAK_BASE_URL),
}};