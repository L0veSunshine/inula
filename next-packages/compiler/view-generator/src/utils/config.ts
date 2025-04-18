import { ViewGeneratorConfig } from '../types';

export const prefixMap = { template: '$t', node: '$node' };

export let elementAttributeMap: Record<string, string[]> = {};
export let alterAttributeMap: Record<string, string> = {};
export let importMap: Record<string, string> = {};
export const nodeNameInUpdate = '$$node';

export function runWithConfig<T>(config: ViewGeneratorConfig, fn: () => T) {
  elementAttributeMap = config.attributeMap
    ? Object.entries(config.attributeMap).reduce<Record<string, string[]>>((acc, [key, elements]) => {
        elements.forEach(element => {
          if (!acc[element]) acc[element] = [];
          acc[element].push(key);
        });
        return acc;
      }, {})
    : {};
  alterAttributeMap = config.alterAttributeMap;
  importMap = config.importMap;
  const result = fn();
  elementAttributeMap = {};
  alterAttributeMap = {};
  importMap = {};

  return result;
}
