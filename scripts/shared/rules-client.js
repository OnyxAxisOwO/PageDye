// Thin wrapper around the serialized URL_RULES_KEY write arbiter that lives in
// scripts/background.js (see the comment there for why this exists). Used by
// popup.js and options.js; scripts/content.js and the injected element-picker
// function (which can't load an external script when executeScript-injected
// by value) each call chrome.runtime.sendMessage directly instead, with the
// same 'pagedyeMutateUrlRules' message shape.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeRulesClient = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  async function sendRuleOp(op, payload) {
    const response = await chrome.runtime.sendMessage({ action: 'pagedyeMutateUrlRules', op, payload });
    if (!response || !response.ok) {
      throw new Error((response && response.error) || 'URL rules write failed');
    }
    return response.rules;
  }

  return {
    setRuleSettings: (ruleId, settings) => sendRuleOp('setRuleSettings', { ruleId, settings }),
    patchRuleSettingsField: (ruleId, fieldPath, value) => sendRuleOp('patchRuleSettingsField', { ruleId, fieldPath, value }),
    insertRule: (rule) => sendRuleOp('insertRule', { rule }),
    deleteRule: (ruleId) => sendRuleOp('deleteRule', { ruleId }),
    setRuleEnabled: (ruleId, enabled) => sendRuleOp('setRuleEnabled', { ruleId, enabled }),
    reorderRules: (orderedIds) => sendRuleOp('reorderRules', { orderedIds })
  };
});
