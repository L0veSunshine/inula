/*
 * Copyright (c) 2024 Huawei Technologies Co.,Ltd.
 *
 * openInula is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

import { Analyzer, ComponentNode, HookNode } from '../../src/analyze/types';
import { type PluginObj, transform as transformWithBabel } from '@babel/core';
// @ts-expect-error missing type
import syntaxJSX from '@babel/plugin-syntax-jsx';
import { register } from '@openinula/babel-api';
import { analyze } from '../../src/analyze';
import { COMPONENT, defaultHTMLTags } from '../../src/constants';
import { BitManager } from '../../src/analyze/IRBuilder';

export function mockAnalyze(code: string, analyzers?: Analyzer[]): readonly [ComponentNode | HookNode, BitManager] {
  let root: ComponentNode | HookNode | null = null;
  let bitManager: BitManager | null = null;
  transformWithBabel(code, {
    plugins: [
      syntaxJSX.default ?? syntaxJSX,
      function (api): PluginObj {
        register(api);
        const seen = new Set();
        return {
          visitor: {
            FunctionExpression: path => {
              if (seen.has(path)) {
                return;
              }
              [root, bitManager] = analyze(COMPONENT, 'test', path, {
                customAnalyzers: analyzers,
                htmlTags: defaultHTMLTags,
              });
              seen.add(path);
              if (root) {
                path.skip();
              }
            },
            ArrowFunctionExpression: path => {
              if (seen.has(path)) {
                return;
              }
              [root, bitManager] = analyze(COMPONENT, 'test', path, {
                customAnalyzers: analyzers,
                htmlTags: defaultHTMLTags,
              });
              seen.add(path);
              if (root) {
                path.skip();
              }
            },
          },
        };
      },
    ],
    filename: 'test.tsx',
  });

  if (!root || !bitManager) {
    throw new Error('root or bitManager is null');
  }

  return [root, bitManager] as const;
}
