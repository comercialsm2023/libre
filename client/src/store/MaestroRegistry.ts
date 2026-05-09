import { ShieldCheck, LucideIcon } from 'lucide-react';
import Vault from '../../../mods/vault/frontend/Vault';

export type MaestroModule = {
  name: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType;
  tabValue: string;
};

export const maestroModules: MaestroModule[] = [
  {
    name: 'vault',
    label: 'com_nav_setting_vault',
    icon: ShieldCheck,
    component: Vault,
    tabValue: 'vault',
  },
];
