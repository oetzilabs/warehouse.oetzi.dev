export const domain =
  {
    production: "warehouse.oetzi.dev",
    dev: "dev.warehouse.oetzi.dev",
  }[$app.stage] || $app.stage + ".dev.warehouse.oetzi.dev";

export const zone = cloudflare.getZoneOutput({
  name: "oetzi.dev",
});

export const cf = sst.cloudflare.dns({
  zone: zone.zoneId,
});
