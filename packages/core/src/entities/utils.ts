type BasePathVersion = `v${number}.${number}.${number}`;

export const generateBasePath = (options: { organizationId: string; version: BasePathVersion }) =>
  `/${options.version}/organizations/${options.organizationId}`;
