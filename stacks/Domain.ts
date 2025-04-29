export const domain =
  {
    production: "northstar.oetzi.dev",
    dev: "dev.northstar.oetzi.dev",
  }[$app.stage] || $app.stage + ".dev.northstar.oetzi.dev";

export const zone = cloudflare.getZoneOutput({
  name: "oetzi.dev",
});

export const cf = sst.cloudflare.dns({
  zone: zone.zoneId,
});
