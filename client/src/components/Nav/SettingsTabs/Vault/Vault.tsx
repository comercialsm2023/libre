import React, { useState } from 'react';
import { useLocalize } from '~/hooks';
import {
  useGetVaultKeysQuery,
  useUpdateVaultKeyMutation,
  useDeleteVaultKeyMutation,
} from 'librechat-data-provider/react-query';
import { Button, useToastContext } from '@librechat/client';
import { Trash2, Key, Info, ShieldCheck, HelpCircle, Activity } from 'lucide-react';
import { cn } from '~/utils';

const Vault = () => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [keyValue, setKeyValue] = useState('');
  const [customLabel, setCustomName] = useState('');

  const { data: vaultKeys, isLoading } = useGetVaultKeysQuery();
  const updateVaultKey = useUpdateVaultKeyMutation();
  const deleteVaultKey = useDeleteVaultKeyMutation();

  const handleAddKey = () => {
    if (!keyValue.trim()) {
      return;
    }

    updateVaultKey.mutate(
      { value: keyValue.trim(), customName: customLabel.trim() || undefined },
      {
        onSuccess: (data) => {
          showToast({
            message: `Chave ${data.name} adicionada com sucesso!`,
            status: 'success',
          });
          setKeyValue('');
          setCustomName('');
        },
        onError: (error: any) => {
          showToast({
            message: error?.response?.data?.error || 'Falha ao adicionar chave.',
            status: 'error',
          });
        },
      },
    );
  };

  const handleDeleteKey = (name: string) => {
    deleteVaultKey.mutate(name, {
      onSuccess: () => {
        showToast({
          message: `Chave ${name} removida.`,
          status: 'success',
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 p-1 text-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Cofre do Maestro</h3>
        </div>
        <p className="text-text-secondary">
          Gestão centralizada de chaves de API e tokens de autorização. O sistema identifica automaticamente o serviço e valida a ligação.
        </p>
      </div>

      <div className="rounded-xl border border-border-medium bg-surface-secondary/50 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-text-primary">Chave ou Token</label>
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-..., ghp_..., etc."
              className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-text-primary">Etiqueta (Opcional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: GitHub Pessoal"
                className="flex-1 rounded-lg border border-border-medium bg-surface-primary px-3 py-2 focus:border-primary focus:outline-none"
              />
              <Button
                onClick={handleAddKey}
                disabled={updateVaultKey.isLoading || !keyValue.trim()}
                variant="primary"
                className="px-6"
              >
                {updateVaultKey.isLoading ? '...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-semibold text-text-primary uppercase tracking-wider text-xs">Itens no Cofre</h4>
          <span className="text-xs text-text-tertiary">{vaultKeys?.length || 0} Itens</span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Activity className="h-6 w-6 animate-spin text-text-tertiary" />
          </div>
        ) : vaultKeys && vaultKeys.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {vaultKeys.map((key) => (
              <div
                key={key.name}
                className="group flex items-center justify-between rounded-xl border border-border-light bg-surface-primary p-4 shadow-sm transition-all hover:border-primary/50"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-surface-secondary p-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Key className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">
                      {key.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Ativo
                      </span>
                      <span>•</span>
                      <span>{key.expiresAt ? `Expira: ${new Date(key.expiresAt).toLocaleDateString()}` : 'Permanente'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.name)}
                  className="rounded-lg p-2 text-text-tertiary hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  title="Remover do Cofre"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border-medium py-12 text-center">
            <div className="rounded-full bg-surface-secondary p-4">
              <HelpCircle className="h-8 w-8 text-text-tertiary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">O teu cofre está vazio</p>
              <p className="text-xs text-text-tertiary mt-1 text-balance max-w-[200px]">
                Adiciona chaves acima para desbloquear novas funcionalidades e modelos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vault;
