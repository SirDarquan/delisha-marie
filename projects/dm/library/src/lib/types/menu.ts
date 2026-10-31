export interface MenuLinkChild {
  label: string;
  path: string;
  icon?: string;
}

export interface MenuLink {
  label: string;
  path?: string;
  externalUrl?: string;
  icon?: string;
  children?: MenuLinkChild[];
}
