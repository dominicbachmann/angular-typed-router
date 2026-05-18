declare const __orgIdBrand: unique symbol;
declare const __projectIdBrand: unique symbol;

export type OrgId = string & { readonly [__orgIdBrand]: true };
export type ProjectId = string & { readonly [__projectIdBrand]: true };

export const asOrgId = (value: string): OrgId => value as OrgId;
export const asProjectId = (value: string): ProjectId => value as ProjectId;
