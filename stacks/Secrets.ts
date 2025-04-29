export const secret = {
  SECRET_DATABASE_URL: new sst.Secret("DatabaseUrl"),
  SECRET_DATABASE_PROVIDER: new sst.Secret("DatabaseProvider"),
};

export const allSecrets = Object.values(secret);
