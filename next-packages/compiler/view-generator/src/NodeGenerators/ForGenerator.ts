import { importMap } from '../utils/config';
import { DependencyValue, type ForParticle } from '@openinula/reactivity-parser';
import { ViewContext, ViewGenerator } from '../index';
import { types as t } from '@openinula/babel-api';

const PARAM_NODE = '$$n';
const PARAM_INDEX = '$$i';
const PARAM_KEY = '$$key';

/**
 * @example
 * ```jsx
 *    createForNode(
 *      () => data,
 *      () => data.map(({id}) => id),
 *      (node, updateItemFuncArr, item, key, idx) => {
 *        updateItemFuncArr[idx] = (newItem, newIdx) => {
 *          item = newItem
 *          idx = newIdx
 *        }
 *        return [${children}]
 *      },
 *        0b0001
 *    )
 * ```
 */
export const forGenerator: ViewGenerator = {
  for: ({ item, index: indexParam, array, key, children }: ForParticle, ctx: ViewContext) => {
    if (!t.isIdentifier(item) && !t.isObjectPattern(item) && !t.isArrayPattern(item)) {
      throw new Error('ForGenerator: item cannot be a member expression');
    }
    const index = indexParam ?? t.identifier(PARAM_INDEX);
    const updateItemFuncArr = t.identifier('updateItemFuncArr');

    return t.callExpression(t.identifier(importMap.createForNode), [
      // Array
      t.arrowFunctionExpression([], array.value),
      // Key
      keyMappingFn(array, item, indexParam, key),
      // Update func
      t.arrowFunctionExpression(
        [t.identifier(PARAM_NODE), updateItemFuncArr, item, t.identifier(PARAM_KEY), index],
        t.blockStatement([
          t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.memberExpression(updateItemFuncArr, index, true),
              itemUpdater(item, indexParam)
            )
          ),
          t.returnStatement(t.arrayExpression(children.map(child => ctx.next(child)))),
        ])
      ),
      // reactBits
      t.numericLiteral(ctx.getReactBits(array.depIdBitmap)),
    ]);
  },
};

/**
 * @example
 * ```ts
 * (item) => item.id
 * ```
 */
function keyMappingFn(
  array: DependencyValue<t.Expression>,
  item: t.Identifier | t.Pattern | t.RestElement,
  index: t.Identifier | null,
  key: t.Expression
): t.Expression | t.SpreadElement | t.ArgumentPlaceholder {
  if (!key) {
    return t.nullLiteral();
  }
  const params = [item];
  if (index) {
    params.push(index);
  }
  return t.arrowFunctionExpression(
    [],
    t.callExpression(t.memberExpression(array.value, t.identifier('map')), [t.arrowFunctionExpression(params, key)])
  );
}

/**
 * @example
 * ```ts
 * (newItem, newIdx) => {
 *   item = newItem
 *   idx = newIdx // if indexParam is provided
 * }
 * ```
 */
function itemUpdater(item: t.Identifier | t.Pattern | t.RestElement, indexParam: t.Identifier | null): t.Expression {
  const newItem = t.identifier('newItem');
  const newIdx = t.identifier('newIdx');
  const itemAssign = t.expressionStatement(t.assignmentExpression('=', item, newItem));
  const indexAssign = indexParam && t.expressionStatement(t.assignmentExpression('=', indexParam, newIdx));
  return t.arrowFunctionExpression(
    [newItem, newIdx],
    t.blockStatement([itemAssign, indexAssign].filter((s): s is t.ExpressionStatement => Boolean(s)))
  );
}
