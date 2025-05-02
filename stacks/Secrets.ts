export const secret = {
  SECRET_DATABASE_URL: new sst.Secret("DatabaseUrl"),
  SECRET_DATABASE_PROVIDER: new sst.Secret("DatabaseProvider"),
  SECRET_JWT_SECRET_1: new sst.Secret("JWTSecret1"),
  SECRET_JWT_SECRET_2: new sst.Secret("JWTSecret2"),
};

export const allSecrets = Object.values(secret);
