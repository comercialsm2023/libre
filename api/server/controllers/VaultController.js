const { updateUserKey, deleteUserKey, getUserKeyExpiry, getUserKey } = require('~/models');
const { EModelEndpoint } = require('librechat-data-provider');
const { logger } = require('@librechat/data-schemas');
const mongoose = require('mongoose');
const axios = require('axios');

const patterns = [
  {
    name: EModelEndpoint.openAI,
    pattern: /^sk-[a-zA-Z0-9]{20,}$/,
    isAI: true,
  },
  {
    name: EModelEndpoint.anthropic,
    pattern: /^sk-ant-[a-zA-Z0-9-]{20,}$/,
    isAI: true,
  },
  {
    name: EModelEndpoint.google,
    pattern: /^AIza[a-zA-Z0-9_-]{35}$/,
    isAI: true,
  },
  {
    name: 'OpenRouter',
    pattern: /^sk-or-[a-zA-Z0-9-]{20,}$/,
    isAI: true,
    isCustom: true,
    baseURL: 'https://openrouter.ai/api/v1',
  },
];

async function probeService(name, value) {
  try {
    if (name === 'GitHub' || value.startsWith('ghp_')) {
      const res = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${value}` },
      });
      return { success: true, name: 'GitHub', metadata: { username: res.data.login } };
    }
    // Add more probes here (HuggingFace, etc.)
  } catch (err) {
    return { success: false };
  }
  return { success: false };
}

function detectKeyType(value) {
  for (const p of patterns) {
    if (p.pattern.test(value)) {
      return { ...p, isDetected: true };
    }
  }
  return {
    name: 'Generic Token',
    isAI: false,
    isGeneric: true,
    isDetected: false,
  };
}

async function getVaultKeys(req, res) {
  try {
    const Key = mongoose.model('Key');
    const keys = await Key.find({ userId: req.user.id }).lean();
    
    const response = keys.map(k => ({
      name: k.name,
      expiresAt: k.expiresAt,
    }));

    res.status(200).send(response);
  } catch (error) {
    logger.error('[VaultController] getVaultKeys error:', error);
    res.status(500).send({ error: 'Failed to fetch vault keys.' });
  }
}

async function updateVaultKey(req, res) {
  try {
    const { value, customName } = req.body;
    if (!value) {
      return res.status(400).send({ error: 'Key value is required.' });
    }

    let detection = detectKeyType(value);
    
    // Auto-Discovery: If generic, try to probe services
    if (detection.isGeneric) {
      const probe = await probeService('unknown', value);
      if (probe.success) {
        detection = { name: probe.name, isAI: false, isDetected: true };
      }
    }

    let keyName = customName || detection.name;

    if (detection.isGeneric && !customName) {
      keyName = `Token_${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }

    let storageValue = value;
    if (detection.isCustom) {
      storageValue = JSON.stringify({
        apiKey: value,
        baseURL: detection.baseURL,
      });
    }

    await updateUserKey({ userId: req.user.id, name: keyName, value: storageValue });
    res.status(201).send({ name: keyName, isAI: detection.isAI });
  } catch (error) {
    logger.error('[VaultController] updateVaultKey error:', error);
    res.status(500).send({ error: 'Failed to update vault key.' });
  }
}

async function deleteVaultKey(req, res) {
  try {
    const { name } = req.params;
    await deleteUserKey({ userId: req.user.id, name });
    res.status(204).send();
  } catch (error) {
    logger.error('[VaultController] deleteVaultKey error:', error);
    res.status(500).send({ error: 'Failed to delete vault key.' });
  }
}

module.exports = {
  getVaultKeys,
  updateVaultKey,
  deleteVaultKey,
  detectKeyType,
};
