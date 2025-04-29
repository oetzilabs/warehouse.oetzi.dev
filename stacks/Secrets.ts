export const secret = {
  SECRET_DATABASE_URL: new sst.Secret("DatabaseUrl"),
  SECRET_DATABASE_PROVIDER: new sst.Secret("DatabaseProvider"),
  SECRET_GOOGLE_CLIENT_ID: new sst.Secret("GoogleClientId"),
  SECRET_GOOGLE_CLIENT_SECRET: new sst.Secret("GoogleClientSecret"),
  SECRET_EMAIL_HOST: new sst.Secret("EmailHost"),
  SECRET_EMAIL_PORT: new sst.Secret("EmailPort"),
  SECRET_EMAIL_USERNAME: new sst.Secret("EmailUsername"),
  SECRET_EMAIL_PASSWORD: new sst.Secret("EmailPassword"),
  SECRET_EMAIL_FROM: new sst.Secret("EmailFrom"),
  SECRET_DOC_PARSER_API_KEY: new sst.Secret("DocParserApiKey"),
  SECRET_WITH_EMAIL: new sst.Secret("WithEmail"),
  SECRET_CONTACT_EMAIL: new sst.Secret("ContactEmail"),
};

export const allSecrets = Object.values(secret);
